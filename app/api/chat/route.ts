import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { content, customers } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/chat
 * Body: { customerId: string, messages: { role: string; content: string }[] }
 * Streams LLM response using customer's crawled content.
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
    const query = lastUser?.content?.trim();
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

    const rows = await db.select().from(content).where(eq(content.customerId, customerId));

    const context = rows
      .map((r) => `## ${r.title}\nURL: ${r.url}\n\n${r.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a helpful AI assistant for ${customer.businessName}. Answer questions using ONLY the following content from their website. Do not make up information. If the content doesn't contain relevant information, say so politely. Include links when relevant. Format responses in markdown.

Website content:
${context || "(No content yet - the chatbot is still being built.)"}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });

    return result.toDataStreamResponse();
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
