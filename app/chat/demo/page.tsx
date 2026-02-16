"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PILL_SUGGESTIONS = [
  "What is ForwardSlash.Chat?",
  "How much does it cost?",
  "How does it work?",
  "Quick $350 Starter?",
];

const QUESTION_SUGGESTIONS = [
  "Tell me about the $350 quick site",
  "What's included in a new build?",
  "How does the AI chatbot work?",
];

const FALLBACK =
  "Sorry, I'm still learning! 😊 Ask me about our $350 quick start site, $1,000 new build, $2,000 redesign, AI chatbot, or how we help Florida businesses get online.";

const TYPING_DELAY_MS = 1600;

function getHardcodedResponse(message: string): string | null {
  const q = message.toLowerCase().trim();
  if (!q) return null;

  const pairs: { keywords: string[]; answer: string }[] = [
    {
      keywords: ["how much", "pricing", "cost", "plans", "price", "how much is it"],
      answer: `Simple one-time pricing — year 1 hosting included, no monthly fees:
• Quick WordPress Starter: $350 (10 pages, perfect to get going)
• Brand New Website Build: $1,000 (full custom + AI chatbot)
• Website Redesign / Refresh: $2,000 (upgrade your existing site + AI)
After year 1: move to your own host (free) or renew hosting with us for $200/year (optional).`,
    },
    {
      keywords: ["how does it work", "how to get started", "process", "steps"],
      answer: `Easy 3 steps:
1. Tell us your business & goals
2. We design & build your site (with AI chatbot if chosen)
3. We launch + host for year 1 — live in days/weeks. One-time payment, no subscriptions.`,
    },
    {
      keywords: ["quick", "starter", "$350", "simple site", "just get started"],
      answer:
        "Our $350 Quick WordPress Starter is perfect if you just want a simple site fast: 10 clean pages, mobile-ready, basic SEO, contact form + map, WordPress dashboard, year 1 hosting included. One-time $350 — no monthly fees. Great for new entrepreneurs!",
    },
    {
      keywords: ["new website", "brand new", "$1000", "build"],
      answer:
        "For $1,000 one-time we build you a full custom modern website (Next.js or WordPress) + built-in AI chatbot trained on your content. Mobile-responsive, fast, SEO-ready, year 1 hosting included. Perfect upgrade for growing businesses.",
    },
    {
      keywords: ["redesign", "refresh", "upgrade", "$2000"],
      answer:
        "$2,000 one-time redesign/refresh: modern look, speed & SEO upgrades, mobile-responsive, + built-in AI chatbot. We keep your existing content, make it look & work better, host year 1. Ideal if your current site feels outdated.",
    },
    {
      keywords: ["ai chatbot", "ai", "chatbot", "what is the ai"],
      answer:
        "Every plan can include our custom AI chatbot (trained only on your site content). It lives at chat.yourdomain.com or yourdomain.com/chat, answers customer questions 24/7 — services, hours, prices, FAQs — no monthly fees, private & branded.",
    },
    {
      keywords: ["hosting", "host", "year 1", "after year 1", "renew"],
      answer:
        "We host your site for the full first year (included in price). After that: move to your own host for free (we give full access) or keep us hosting for $200/year (optional). Your choice — no lock-in.",
    },
    {
      keywords: ["florida", "orlando", "local"],
      answer:
        "We're based in Orlando, Florida and specialize in helping local businesses like plumbers, shops, restaurants, and contractors get a professional online presence fast — affordable, no-nonsense websites + AI help.",
    },
    {
      keywords: ["demo", "see it", "try", "test"],
      answer:
        "You're chatting with the demo right now! Tap any question above or ask anything about our websites, AI chatbot, pricing, or getting started.",
    },
    {
      keywords: ["what is", "what does forwardslash do", "what is forwardslash.chat", "tell me about"],
      answer:
        "**ForwardSlash.Chat** helps new entrepreneurs and local businesses in Florida get online fast with a professional website + built-in AI chatbot. We build it, host it for year 1, and you pay once — no monthly fees. From a quick $350 starter site to full custom builds.",
    },
  ];

  for (const { keywords, answer } of pairs) {
    for (const kw of keywords) {
      if (q.includes(kw)) return answer;
    }
  }
  return null;
}

function MarkdownText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    let match: RegExpMatchArray | null = null;
    let type: "link" | "bold" | "code" = "link";
    let idx = remaining.length;

    if (linkMatch && linkMatch.index !== undefined && linkMatch.index < idx) {
      match = linkMatch;
      type = "link";
      idx = linkMatch.index;
    }
    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < idx) {
      match = boldMatch;
      type = "bold";
      idx = boldMatch.index;
    }
    if (codeMatch && codeMatch.index !== undefined && codeMatch.index < idx) {
      match = codeMatch;
      type = "code";
      idx = codeMatch.index;
    }

    if (match && match.index !== undefined) {
      if (idx > 0) {
        parts.push(
          <span key={key++}>
            {remaining.slice(0, idx).split("\n").map((line, i) => (
              <span key={i}>{line}{i < remaining.slice(0, idx).split("\n").length - 1 ? <br /> : null}</span>
            ))}
          </span>
        );
      }
      if (type === "link") {
        parts.push(
          <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-primary underline">
            {match[1]}
          </a>
        );
      } else if (type === "bold") {
        parts.push(<strong key={key++}>{match[1]}</strong>);
      } else if (type === "code") {
        parts.push(<code key={key++} className="bg-muted px-1 rounded text-sm">{match[1]}</code>);
      }
      remaining = remaining.slice(idx + match[0].length);
    } else {
      parts.push(
        <span key={key++}>
          {remaining.split("\n").map((line, i) => (
            <span key={i}>{line}{i < remaining.split("\n").length - 1 ? <br /> : null}</span>
          ))}
        </span>
      );
      break;
    }
  }

  return <>{parts}</>;
}

type Message = { role: "user" | "assistant"; content: string; id?: string };

export default function DemoChatPage() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: t, id: `u-${Date.now()}` }]);
    setIsLoading(true);

    setTimeout(() => {
      const reply = getHardcodedResponse(t) ?? FALLBACK;
      setMessages((prev) => [...prev, { role: "assistant", content: reply, id: `a-${Date.now()}` }]);
      setIsLoading(false);
    }, TYPING_DELAY_MS);
  };

  return (
    <div className="flex flex-col h-dvh bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">/</span>
          </div>
          <span className="font-semibold">ForwardSlash.Chat</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <>
              <p className="text-lg font-medium mb-1">Hi! I&apos;m the ForwardSlash demo assistant.</p>
              <p className="text-muted-foreground mb-6">Ask me about our product, pricing, how it works, or what&apos;s included.</p>

              <div className="grid grid-cols-4 gap-1.5 mb-6">
                {PILL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-2 py-1.5 rounded-lg text-[11px] leading-tight text-left border bg-card hover:bg-accent hover:text-accent-foreground transition-colors min-w-0"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {QUESTION_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-sm text-muted-foreground hover:text-foreground py-2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={m.id ?? `msg-${i}`} className={m.role === "user" ? "flex justify-end" : ""}>
                  <div
                    className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/80"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownText text={m.content} />
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="inline-block px-4 py-3 rounded-2xl bg-muted/80 text-muted-foreground text-sm">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 rounded-xl border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Ask about ForwardSlash.Chat..."
              className="flex-1 px-4 py-3 bg-transparent placeholder:text-muted-foreground focus:outline-none text-sm"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Demo chatbot · Powered by ForwardSlash.Chat</p>
        </div>
      </div>
    </div>
  );
}
