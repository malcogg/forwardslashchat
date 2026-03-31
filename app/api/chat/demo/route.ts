import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { sanitizeChatMessage } from "@/lib/validation";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/chat/demo
 * Demo chat for ForwardSlash.Chat using demo-content.json (no Firecrawl/DB).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: { role: string; content: string }[] };

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const lastUser = messages.filter((m) => m.role === "user").pop();
    const query = typeof lastUser?.content === "string" ? sanitizeChatMessage(lastUser.content) : "";
    if (!query) {
      return NextResponse.json({ error: "No message to answer" }, { status: 400 });
    }

    const jsonPath = join(process.cwd(), "data", "demo-content.json");
    const raw = await readFile(jsonPath, "utf-8");
    const data = JSON.parse(raw) as {
      businessName: string;
      pages: { title: string; url: string; content: string }[];
    };

    const context = data.pages
      .map((p) => `## ${p.title}\nURL: ${p.url}\n\n${p.content}`)
      .join("\n\n---\n\n");

    const systemPrompt = `You are a helpful AI assistant for ${data.businessName}. Answer questions using ONLY the following content about the product. Do not make up information. If the content doesn't contain relevant information, say so politely. Include links when relevant. Format responses in markdown.

Product content:
${context}`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
    }

    // Rate limit demo by IP (best-effort)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const demoLimit = Math.min(60, Math.max(5, Number(process.env.DEMO_CHAT_RATE_LIMIT_PER_MINUTE ?? 20)));
    const rl = await checkAndIncrementRateLimit({ key: `ip:${ip}`, limitPerMinute: demoLimit });
    if (!rl.ok) {
      return NextResponse.json({ error: "Rate limited. Please slow down." }, { status: 429 });
    }

    const safeMessages = messages
      .slice(-10)
      .map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: typeof m.content === "string" ? sanitizeChatMessage(m.content) : "",
      }))
      .filter((m) => m.content);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: safeMessages,
      maxSteps: 1,
      maxTokens: Math.min(900, Math.max(128, Number(process.env.DEMO_CHAT_MAX_TOKENS ?? 400))),
      maxRetries: 1,
    });

    return result.toDataStreamResponse();
  } catch (e) {
    console.error("Demo chat error:", e);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
