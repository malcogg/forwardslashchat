"use client";

import { useChat } from "ai/react";
import { ArrowUp } from "lucide-react";
import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { sanitizeChatMessage, LIMITS } from "@/lib/validation";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { ChatCards } from "@/components/chat/ChatCards";
import type { ChatCardBlock } from "@/components/chat/chat-types";
import { SLASH_COMMAND_CHIPS } from "@/lib/chat-slash-commands";
import { CustomerChatLeadGate, customerLeadSessionKey } from "@/components/CustomerChatLeadGate";

const PREVIEW_DEMO_MESSAGES = [
  { id: "preview-u1", role: "user" as const, content: "What services do you offer?" },
  {
    id: "preview-a1",
    role: "assistant" as const,
    content:
      "Thanks for asking! We focus on **consulting**, **delivery**, and **ongoing support** — all tailored to your goals. Want a quick overview or pricing?",
  },
];

function initialLeadDone(customerId: string, previewDemo: boolean) {
  if (previewDemo) return true;
  if (typeof window === "undefined") return false;
  try {
    const v = sessionStorage.getItem(customerLeadSessionKey(customerId));
    return v === "1" || v === "skipped";
  } catch {
    return false;
  }
}

interface CustomerChatProps {
  customerId: string;
  businessName: string;
  primaryColor?: string;
  compact?: boolean;
  /** Seed a sample thread in the dashboard preview so the widget feels alive before the user chats. */
  previewDemo?: boolean;
}

export function CustomerChat({
  customerId,
  businessName,
  primaryColor = "#059669",
  compact = false,
  previewDemo = false,
}: CustomerChatProps) {
  const [leadDone, setLeadDone] = useState(() => initialLeadDone(customerId, previewDemo));
  const [messageBlocks, setMessageBlocks] = useState<Record<number, ChatCardBlock[]>>({});
  const nextAssistantIndexRef = useRef(0);

  useEffect(() => {
    setLeadDone(initialLeadDone(customerId, previewDemo));
  }, [customerId, previewDemo]);

  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    body: { customerId },
    initialMessages: previewDemo ? PREVIEW_DEMO_MESSAGES : undefined,
    onFinish: useCallback(
      async (finalMessage: { content?: string }) => {
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
    if (messages.length > 0 || previewDemo) return [];
    return [
      "What services do you offer?",
      "Tell me about your products",
      "How do I get in touch?",
    ];
  }, [messages.length, previewDemo]);

  const send = (text: string) => {
    const t = sanitizeChatMessage(text);
    if (!t || isLoading) return;
    nextAssistantIndexRef.current = messages.length + 1;
    append({ role: "user", content: t });
  };

  const initials = businessName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const slashBar = (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {SLASH_COMMAND_CHIPS.map(({ command, label }) => (
        <button
          key={command}
          type="button"
          onClick={() => send(`/${command}`)}
          disabled={isLoading}
          className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={`flex flex-col bg-white overflow-hidden ${
        compact ? "h-[380px] rounded-2xl border border-gray-200" : "h-full min-h-0"
      }`}
    >
      <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-gray-200">
          <span className="text-gray-700 text-xs font-bold">{initials[0]}</span>
        </div>
        <span className="font-medium text-gray-900 text-sm truncate">{businessName}</span>
      </header>

      {!leadDone ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <CustomerChatLeadGate
            customerId={customerId}
            businessName={businessName}
            primaryColor={primaryColor}
            onComplete={() => setLeadDone(true)}
          />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">How can I help?</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Ask anything, or use a shortcut like <strong>/pricing</strong>.
                </p>
                <div className="max-w-md mx-auto mb-4 text-left">
                  <div className="border border-gray-200 rounded-lg p-3 bg-white">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value.slice(0, LIMITS.chatMessage))}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
                      placeholder="Ask anything or type /help"
                      maxLength={LIMITS.chatMessage}
                      className="w-full text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-500"
                    />
                    <div className="flex items-center justify-end mt-2">
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
                  {slashBar}
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
                        m.role === "user" ? "text-white" : "bg-gray-100 text-gray-900"
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
                  placeholder="Ask anything or /pricing"
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
              {slashBar}
            </div>
          )}
        </>
      )}
    </div>
  );
}
