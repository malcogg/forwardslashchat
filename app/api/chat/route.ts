import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { content, customers, orders } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { sanitizeChatMessage } from "@/lib/validation";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";
import {
  buildWebsiteKnowledgeContext,
  resolveChatContextMaxChars,
  resolveChatHistoryMessageLimit,
  resolveChatMaxOutputTokens,
} from "@/lib/chat-context";

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

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Rate limit per customer to prevent abuse / runaway spend.
    const perMinute = Math.min(120, Math.max(5, Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE ?? 30)));
    const rl = await checkAndIncrementRateLimit({ key: `customer:${customerId}`, limitPerMinute: perMinute });
    if (!rl.ok) {
      return NextResponse.json({ error: "Rate limited. Please slow down." }, { status: 429 });
    }

    // Public endpoint: only allow real usage for paid customers.
    const [order] = await db.select().from(orders).where(eq(orders.id, customer.orderId));
    const paid = order?.status === "paid" || order?.status === "delivered" || order?.status === "processing";
    if (!paid) {
      return NextResponse.json(
        { error: "Payment required" },
        { status: 402 }
      );
    }

    const rows = await db
      .select()
      .from(content)
      .where(eq(content.customerId, customerId))
      .orderBy(asc(content.createdAt), asc(content.url));

    const maxContextChars = resolveChatContextMaxChars();
    const { context } = buildWebsiteKnowledgeContext(rows, maxContextChars);

    const systemPrompt = `You are a helpful AI assistant for ${customer.businessName}. Answer questions using ONLY the following content from their website. Do not make up information. If the content doesn't contain relevant information, say so politely. Include links when relevant. Format responses in markdown.

Website content:
${context || "(No content yet - the chatbot is still being built.)"}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
    }

    // Guardrails: cap history length and message sizes
    const safeMessages = messages
      .slice(-12)
      .map((m) => {
      const content = typeof m.content === "string" ? sanitizeChatMessage(m.content) : "";
      return {
        role: m.role as "user" | "assistant" | "system",
        content,
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
