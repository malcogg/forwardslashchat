"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

const DEMO_CONTENT = [
  {
    title: "Our Story",
    url: "https://demo-coffee.com/about",
    content:
      "Demo Coffee Roasters started in 2018 in a small garage in Portland. We source single-origin beans from Ethiopia, Colombia, and Guatemala. We roast in small batches every Tuesday.",
  },
  {
    title: "Best Sellers",
    url: "https://demo-coffee.com/shop",
    content:
      "1. **Ethiopian Yirgacheffe** - $18/250g - bright, floral, citrus notes\n2. **Colombian Supremo** - $16/250g - chocolate, caramel sweetness\n3. **Guatemala Antigua** - $17/250g - balanced, smoky finish",
  },
  {
    title: "Brew Guide",
    url: "https://demo-coffee.com/brew",
    content:
      "**V60**: 15g coffee to 250g water, 92°C, 2:30 brew time.\n**French Press**: 30g to 500g water, 4 minutes steep.",
  },
  {
    title: "Latest Blog",
    url: "https://demo-coffee.com/blog/latest",
    content:
      "**Why Light Roasts Are Making a Comeback** (Feb 2026) - Light roasts preserve origin flavors and highlight subtle notes. Perfect for pour-over and AeroPress.",
  },
];

function findAnswer(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("bean") || q.includes("product") || q.includes("sell") || q.includes("colombian") || q.includes("ethiopian")) {
    const c = DEMO_CONTENT.find((x) => x.title === "Best Sellers");
    return c ? `${c.content}\n\n[${c.title}](${c.url})` : "I don't have info on that yet.";
  }
  if (q.includes("brew") || q.includes("v60") || q.includes("french press") || q.includes("recipe")) {
    const c = DEMO_CONTENT.find((x) => x.title === "Brew Guide");
    return c ? `${c.content}\n\n[${c.title}](${c.url})` : "I don't have info on that yet.";
  }
  if (q.includes("blog") || q.includes("latest") || q.includes("light roast")) {
    const c = DEMO_CONTENT.find((x) => x.title === "Latest Blog");
    return c ? `${c.content}\n\n[${c.title}](${c.url})` : "I don't have info on that yet.";
  }
  if (q.includes("about") || q.includes("story") || q.includes("start")) {
    const c = DEMO_CONTENT.find((x) => x.title === "Our Story");
    return c ? `${c.content}\n\n[${c.title}](${c.url})` : "I don't have info on that yet.";
  }
  return "I don't have info on that yet — ask about our beans, brewing, or latest roast!";
}

const SUGGESTIONS = ["What beans do you have?", "How do I brew with V60?", "Show me your best sellers", "Tell me about your latest blog"];

export default function DemoChatPage() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setLoading(true);
    setTimeout(() => {
      const reply = findAnswer(userMsg);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#6B4E3D" }}>
            <span className="text-white text-sm">☕</span>
          </div>
          <span className="font-semibold text-white">Demo Coffee Roasters</span>
        </div>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Back to ForwardSlash
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <>
              <p className="text-lg font-medium text-white mb-1">Hi! I&apos;m your friendly coffee assistant.</p>
              <p className="text-zinc-400 mb-6">Ask me about beans, brewing, or our latest roast!</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-4 py-2 rounded-lg text-sm text-zinc-300 bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-700/50 text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === "user" ? "text-right" : ""}>
                  <div
                    className={`inline-block max-w-[85%] px-4 py-2 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-800/80 text-zinc-200 whitespace-pre-wrap"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        {msg.content.split("\n").map((line, j) => {
                          const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
                          if (linkMatch) {
                            return (
                              <div key={j}>
                                <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#6B4E3D] underline">
                                  {linkMatch[1]}
                                </a>
                              </div>
                            );
                          }
                          const boldMatch = line.match(/\*\*([^*]+)\*\*/);
                          if (boldMatch) {
                            return (
                              <p key={j}>
                                <strong>{boldMatch[1]}</strong>
                              </p>
                            );
                          }
                          return <p key={j}>{line}</p>;
                        })}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <div className="inline-block px-4 py-2 rounded-xl bg-zinc-800/80 text-zinc-400 text-sm">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 rounded-xl border border-zinc-700 bg-zinc-900/50 focus-within:border-zinc-600">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Send a message..."
              className="flex-1 px-4 py-3 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-zinc-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-600"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">Powered by ForwardSlash.Chat</p>
        </div>
      </div>
    </div>
  );
}
