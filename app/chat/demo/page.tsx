"use client";

import { useChat } from "ai/react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef } from "react";

const SUGGESTIONS = [
  "What is ForwardSlash.Chat?",
  "How much does it cost?",
  "How does it work?",
  "What's included?",
];

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

export default function DemoChatPage() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, append, isLoading, error } = useChat({
    api: "/api/chat/demo",
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    append({ role: "user", content: t });
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
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <>
              <p className="text-lg font-medium mb-1">Hi! I&apos;m the ForwardSlash demo assistant.</p>
              <p className="text-muted-foreground mb-6">Ask me about our product, pricing, how it works, or what&apos;s included.</p>
              {error && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  Couldn&apos;t connect. The demo needs <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> set in your environment.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-4 py-3 rounded-lg text-sm text-left border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={(m as { id?: string }).id ?? `msg-${i}`} className={m.role === "user" ? "flex justify-end" : ""}>
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
              {error && (
                <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  Couldn&apos;t connect. The demo needs <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> set in your environment.
                </div>
              )}
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
