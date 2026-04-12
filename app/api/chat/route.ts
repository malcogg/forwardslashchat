import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { content, customerBlogPosts, customerProducts } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { sanitizeChatMessage } from "@/lib/validation";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";
import {
  buildWebsiteKnowledgeContext,
  resolveChatContextMaxChars,
  resolveChatHistoryMessageLimit,
  resolveChatMaxOutputTokens,
} from "@/lib/chat-context";
import { expandSlashCommand } from "@/lib/chat-slash-commands";
import { resolveChatUseRag } from "@/lib/rag-config";
import { buildCustomerChatSupplementaryContext } from "@/lib/chat-supplementary-context";
import type { CrawledPageForChat } from "@/lib/chat-context";
import { buildRagContextBlock, retrieveChunksForCustomerChat } from "@/lib/rag-retrieve";
import { getPaidCustomerForChat } from "@/lib/customer-chat-access";

/**
 * POST /api/chat
 * Body: { customerId: string, messages: { role: string; content: string }[] }
 * Streams LLM response using customer's crawled content.
 *
 * Context assembly and limits: `docs/CHAT-CONTEXT.md`, `lib/chat-context.ts`.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, messages } = body as {
      customerId: string;
      messages: { role: string; content: string }[];
    };

    if (!customerId || !Array.isArray(messages)) {
      return NextResponse.json({ error: "customerId and messages required" }, { status: 400 });
    }

    const lastUser = messages.filter((m) => m.role === "user").pop();
    const rawQuery = lastUser?.content;
    const query = typeof rawQuery === "string" ? sanitizeChatMessage(rawQuery) : "";
    if (!query) {
      return NextResponse.json({ error: "No message to answer" }, { status: 400 });
    }
    const retrievalQuery = expandSlashCommand(query) ?? query;

    const access = await getPaidCustomerForChat(customerId);
    if (!access.ok) {
      if (access.reason === "not_found") {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      if (access.reason === "payment_required") {
        return NextResponse.json({ error: "Payment required" }, { status: 402 });
      }
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }
    const { customer } = access;

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Rate limit per customer to prevent abuse / runaway spend.
    const perMinute = Math.min(120, Math.max(5, Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE ?? 30)));
    const rl = await checkAndIncrementRateLimit({ key: `customer:${customerId}`, limitPerMinute: perMinute });
    if (!rl.ok) {
      return NextResponse.json({ error: "Rate limited. Please slow down." }, { status: 429 });
    }

    const [rows, products, posts] = await Promise.all([
      db
        .select()
        .from(content)
        .where(eq(content.customerId, customerId))
        .orderBy(asc(content.createdAt), asc(content.url)),
      db
        .select({
          title: customerProducts.title,
          price: customerProducts.price,
          productUrl: customerProducts.productUrl,
          description: customerProducts.description,
        })
        .from(customerProducts)
        .where(eq(customerProducts.customerId, customerId))
        .orderBy(asc(customerProducts.sortOrder), asc(customerProducts.createdAt))
        .limit(20),
      db
        .select({
          title: customerBlogPosts.title,
          excerpt: customerBlogPosts.excerpt,
          url: customerBlogPosts.url,
          date: customerBlogPosts.date,
        })
        .from(customerBlogPosts)
        .where(eq(customerBlogPosts.customerId, customerId))
        .orderBy(asc(customerBlogPosts.sortOrder), asc(customerBlogPosts.createdAt))
        .limit(20),
    ]);

    const maxContextChars = resolveChatContextMaxChars();
    const supplementaryBudget = Math.min(18_000, Math.floor(maxContextChars * 0.3));

    const crawledForIndex: CrawledPageForChat[] = rows.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      createdAt: r.createdAt,
    }));

    const supplementary = buildCustomerChatSupplementaryContext({
      customer: {
        businessName: customer.businessName,
        websiteUrl: customer.websiteUrl,
        domain: customer.domain,
        subdomain: customer.subdomain,
        welcomeMessage: customer.welcomeMessage,
      },
      contentRows: crawledForIndex,
      products,
      posts,
      budgetChars: supplementaryBudget,
    });

    const ragBudget = Math.max(6000, maxContextChars - supplementary.length - 400);

    let bodyContext = "";
    if (resolveChatUseRag()) {
      const chunks = await retrieveChunksForCustomerChat(customerId, retrievalQuery);
      bodyContext = buildRagContextBlock(chunks, ragBudget);
    }
    if (!bodyContext.trim()) {
      bodyContext = buildWebsiteKnowledgeContext(crawledForIndex, ragBudget).context;
    }

    const contextParts = [supplementary, bodyContext].filter((s) => s.trim());
    const context =
      contextParts.join("\n\n========\n\n") || "(No content yet - the chatbot is still being built.)";

    const systemPrompt = `You are the official chat assistant for **${customer.businessName}**. You help visitors understand this business using the materials below.

How to answer:
- Use the **Company profile**, **curated** lists, **page index**, and **excerpts** together. The index lists every crawled page — use it to point people to the right blog post or guide when they ask about topics (e.g. fees, how-to articles).
- Stay grounded in the provided text. If something is not covered, say so briefly and share the **official website** link from the profile when available.
- Prefer concrete facts, steps, and URLs from the content. Write in clear markdown.

Knowledge pack for this chat:
${context}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
    }

    // Guardrails: cap history length and message sizes; expand slash commands for the last user turn only.
    const histLimit = resolveChatHistoryMessageLimit();
    const sliced = messages.slice(-histLimit);
    const lastIdx = sliced.length - 1;
    const safeMessages = sliced
      .map((m, i) => {
        let text = typeof m.content === "string" ? sanitizeChatMessage(m.content) : "";
        if (i === lastIdx && m.role === "user" && text) {
          text = expandSlashCommand(text) ?? text;
        }
        return {
          role: m.role as "user" | "assistant" | "system",
          content: text,
        };
      })
      .filter((m) => m.content);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: safeMessages,
      maxSteps: 1,
      maxTokens: resolveChatMaxOutputTokens(),
      maxRetries: 1,
    });

    return result.toDataStreamResponse();
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
