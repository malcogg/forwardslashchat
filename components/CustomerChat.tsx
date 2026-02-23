"use client";

import { useChat } from "ai/react";
import { ArrowUp } from "lucide-react";
import { useMemo, useCallback, useState, useRef } from "react";
import { sanitizeChatMessage, LIMITS } from "@/lib/validation";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { ChatCards } from "@/components/chat/ChatCards";
import type { ChatCardBlock } from "@/components/chat/chat-types";

interface CustomerChatProps {
  customerId: string;
  businessName: string;
  primaryColor?: string;
  compact?: boolean;
}

export function CustomerChat({
  customerId,
  businessName,
  primaryColor = "#059669",
  compact = false,
}: CustomerChatProps) {
  const [messageBlocks, setMessageBlocks] = useState<Record<number, ChatCardBlock[]>>({});
  const nextAssistantIndexRef = useRef(0);

  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    body: { customerId },
    onFinish: useCallback(
      async (_message, { message: finalMessage }) => {
        const content = finalMessage?.content;
        if (typeof content !== "string" || !content.trim()) return;
        const idx = nextAssistantIndexRef.current;
        try {
          const res = await fetch("/api/chat/extract-blocks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerId, messageContent: content }),
          });
          const data = (await res.json()) as { blocks?: ChatCardBlock[] };
          const blocks = Array.isArray(data.blocks) ? data.blocks : [];
          setMessageBlocks((prev) => ({ ...prev, [idx]: blocks }));
        } catch {
          // ignore
        }
      },
      [customerId]
    ),
  });

  const suggestions = useMemo(() => {
    if (messages.length > 0) return [];
    return [
      "What services do you offer?",
      "Tell me about your products",
      "How do I get in touch?",
    ];
  }, [messages.length]);

  const send = (text: string) => {
    const t = sanitizeChatMessage(text);
    if (!t || isLoading) return;
    nextAssistantIndexRef.current = messages.length + 1; // next message will be assistant at this index
    append({ role: "user", content: t });
  };

  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden ${
        compact ? "h-[380px] rounded-2xl border border-gray-200" : "h-full min-h-0"
      }`}
    >
      <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-gray-200"
        >
          <span className="text-gray-700 text-xs font-bold">{initials[0]}</span>
        </div>
        <span className="font-medium text-gray-900 text-sm truncate">{businessName}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">How can I help?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ask me about your services, products,
              <br />
              or anything on your website.
            </p>
            <div className="max-w-md mx-auto mb-6 text-left">
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, LIMITS.chatMessage))}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                  placeholder="Ask anything"
                  maxLength={LIMITS.chatMessage}
                  className="w-full text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-500"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>📎</span> 0 Files
                  </div>
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || isLoading}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="text-left max-w-md mx-auto space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full text-left text-sm text-gray-500 hover:text-gray-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[90%] px-3 py-2 rounded-xl text-sm ${
                    m.role === "user"
                      ? "text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                  style={m.role === "user" ? { backgroundColor: primaryColor } : undefined}
                >
                  {m.role === "assistant" ? (
                    <>
                      <ChatMessageContent content={m.content} />
                      <ChatCards blocks={messageBlocks[i] ?? []} primaryColor={primaryColor} />
                    </>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <div className="inline-block px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, LIMITS.chatMessage))}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Ask anything"
              maxLength={LIMITS.chatMessage}
              className="flex-1 px-3 py-2 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none text-sm"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-full text-white disabled:opacity-50 flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <span>📎</span> 0 Files
          </div>
        </div>
      )}
    </div>
  );
}
