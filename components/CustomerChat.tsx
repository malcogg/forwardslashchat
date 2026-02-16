"use client";

import { useChat } from "ai/react";
import { ArrowUp } from "lucide-react";
import { useMemo } from "react";

interface CustomerChatProps {
  customerId: string;
  businessName: string;
  primaryColor?: string;
  compact?: boolean;
}

export function CustomerChat({
  customerId,
  businessName,
  primaryColor = "#6B4E3D",
  compact = false,
}: CustomerChatProps) {
  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    body: { customerId },
  });

  const suggestions = useMemo(() => {
    if (messages.length > 0) return [];
    return [
      "What services do you offer?",
      "Tell me about your business",
      "How can I get in touch?",
    ];
  }, [messages.length]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    append({ role: "user", content: t });
  };

  return (
    <div
      className={`flex flex-col bg-zinc-950 overflow-hidden ${
        compact ? "h-[380px] rounded-2xl" : "h-full min-h-0"
      }`}
    >
      <header
        className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0"
        style={{ backgroundColor: `${primaryColor}20` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <span className="text-white text-xs">💬</span>
        </div>
        <span className="font-semibold text-white text-sm truncate">{businessName}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">Hi! Ask me anything about {businessName}.</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-700/50"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[90%] px-3 py-2 rounded-xl text-xs ${
                    m.role === "user"
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-800/80 text-zinc-200 prose prose-invert prose-sm max-w-none"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="whitespace-pre-wrap [&_a]:text-blue-400 [&_a]:underline">
                      {m.content}
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <div className="inline-block px-3 py-2 rounded-xl bg-zinc-800/80 text-zinc-400 text-xs">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-zinc-800 shrink-0">
        <div className="flex gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
            placeholder="Ask..."
            className="flex-1 px-3 py-2 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
