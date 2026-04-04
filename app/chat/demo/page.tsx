"use client";

import { Suspense, useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useChat } from "ai/react";
import type { Message, JSONValue } from "ai";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { ArrowUp, Plus } from "lucide-react";
import {
  sanitizeChatMessage,
  LIMITS,
  sanitizeFirstName,
  sanitizeEmail,
  sanitizePhone,
  isValidEmail,
} from "@/lib/validation";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";
import { ChatCards } from "@/components/chat/ChatCards";
import { getDemoCardsForMessage, shouldShowBlogPill } from "@/lib/demo-cards";
import { Button } from "@/components/ui/button";

const CAL_LINK = process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://cal.com/forwardslash/30min";

/** Bumped when lead copy/steps change so returning visitors see the new intro once. */
const LEAD_STORAGE_DONE = "fs_demo_lead_v2";

const LEAD_ASK_NAME =
  "Hi! I'm the ForwardSlash demo assistant. To follow up and show you what's possible, may I have your **first name**? (Type **skip** to try the demo without sharing contact info.)";

const LEAD_ASK_EMAIL = (name: string) =>
  `Thanks, ${name}! What's your **email** so we can reach you if needed? (Type **skip** to continue without email.)`;

const LEAD_ASK_PHONE = `Almost done — what's the best **phone number** to reach you? **Optional** — type **skip** or leave blank.`;

const LEAD_THANKS =
  "Thanks — your details are saved. Ask me anything about ForwardSlash.Chat, pricing, how it works, or what's included.";

const LEAD_SKIP_THANKS =
  "No problem — you can ask me anything about ForwardSlash.Chat, pricing, how it works, or what's included.";

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
  "Sorry, I'm still learning! 😊 Ask me about our $350 quick start site, $1,000 new build, $2,000 redesign, AI chatbot, or how we help Florida businesses get online. Or [contact us](" +
  CAL_LINK +
  ") directly.";

const TYPING_DELAY_MS = 900;

type ResponseResult = { text: string; pills?: { label: string; href: string }[]; followUps?: string[] };

type DemoHardcodedData = {
  demoKind: "hardcoded";
  pills?: { label: string; href: string }[];
  followUps?: string[];
};

function isDemoHardcodedData(data: JSONValue | undefined): data is DemoHardcodedData {
  return (
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data) &&
    "demoKind" in data &&
    (data as { demoKind?: string }).demoKind === "hardcoded"
  );
}

function getHardcodedResponse(message: string): ResponseResult | null {
  const q = message.toLowerCase().trim();
  if (!q) return null;

  const pairs: { keywords: string[]; answer: string; pills?: { label: string; href: string }[]; followUps?: string[] }[] =
    [
      {
        keywords: ["how much", "pricing", "cost", "plans", "price", "how much is it"],
        answer: `Simple one-time pricing — year 1 hosting included, no monthly fees ever.
After year 1: move to your own host (free) or renew hosting with us for $200/year (optional).
AI chatbot: from $799 (1yr) or $1,099 (2yr) — price scales with site size. Tap below.`,
        pills: [
          { label: "AI Chatbot — See price", href: "/?pages=25#pricing" },
          { label: "Quick $350 Starter", href: "/checkout?plan=starter" },
          { label: "$1,000 New Build", href: "/checkout?plan=new-build" },
          { label: "$2,000 Redesign", href: "/checkout?plan=redesign" },
        ],
        followUps: ["How does it work?", "What's included in a new build?"],
      },
      {
        keywords: ["how does it work", "how to get started", "process", "steps"],
        answer: `Easy 3 steps:
1. Tell us your business & goals
2. We design & build your site (with AI chatbot if chosen)
3. We launch + host for year 1 — live in days/weeks.
One-time payment, no subscriptions. See the full [How it Works](/services#how-it-works) page.`,
        followUps: ["How much does it cost?", "Quick $350 Starter?"],
      },
      {
        keywords: ["quick", "starter", "$350", "simple site", "just get started"],
        answer:
          "Our $350 Quick WordPress Starter is perfect if you just want a simple site fast: 10 clean pages, mobile-ready, basic SEO, contact form + map, WordPress dashboard, year 1 hosting included. One-time $350 — no monthly fees. Great for new entrepreneurs!",
        pills: [{ label: "Get Your $350 Site Now", href: "/checkout?plan=starter" }],
        followUps: ["What's included in a new build?", "How much does it cost?"],
      },
      {
        keywords: ["new website", "brand new", "$1000", "build"],
        answer:
          "For $1,000 one-time we build you a full custom modern website (Next.js or WordPress) + built-in AI chatbot trained on your content. Mobile-responsive, fast, SEO-ready, year 1 hosting included. Perfect upgrade for growing businesses.",
        pills: [{ label: "Start $1,000 Build", href: "/checkout?plan=new-build" }],
        followUps: ["How does the AI chatbot work?", "Tell me about redesign"],
      },
      {
        keywords: ["redesign", "refresh", "upgrade", "$2000"],
        answer:
          "$2,000 one-time redesign/refresh: modern look, speed & SEO upgrades, mobile-responsive, + built-in AI chatbot. We keep your existing content, make it look & work better, host year 1. Ideal if your current site feels outdated.",
        pills: [{ label: "Start $2,000 Redesign", href: "/checkout?plan=redesign" }],
        followUps: ["How does the AI chatbot work?", "How much does it cost?"],
      },
      {
        keywords: ["ai chatbot", "ai", "chatbot", "what is the ai"],
        answer:
          "Every plan can include our custom AI chatbot (trained only on your site content). It lives at chat.yourdomain.com or yourdomain.com/chat, answers customer questions 24/7 — services, hours, prices, FAQs — no monthly fees, private & branded. See it in action on the [Demo](/chat/demo).",
        followUps: ["How much does it cost?", "What's included in a new build?"],
      },
      {
        keywords: ["hosting", "host", "year 1", "after year 1", "renew"],
        answer:
          "We host your site for the full first year (included in price). After that: move to your own host for free (we give full access) or keep us hosting for $200/year (optional). Your choice — no lock-in.",
      },
      {
        keywords: ["florida", "orlando", "local"],
        answer: `We're based in Orlando, Florida and specialize in helping local businesses like plumbers, shops, restaurants, and contractors get a professional online presence fast — affordable, no-nonsense websites + AI help.
[Book a chat with Michael Francis](${CAL_LINK})`,
      },
      {
        keywords: ["demo", "see it", "try", "test"],
        answer: `You're chatting with the demo right now! Tap any pill above or ask about our websites, AI chatbot, pricing, or getting started.
Want to see more? Visit the full [Demo](/chat/demo).`,
      },
      {
        keywords: ["dashboard", "how to use dashboard", "what is dashboard"],
        answer:
          "After payment, you get a dashboard to track your order, upload extra files, customize branding (logo/colors), view DNS instructions, and see your live site/chatbot URL once deployed. Super simple — no tech skills needed.",
      },
      {
        keywords: ["branding", "customize", "logo", "colors"],
        answer:
          "In your dashboard, upload your logo/favicon, pick accent/background colors — your website and AI chatbot will match your brand perfectly. Easy drag-and-drop.",
      },
      {
        keywords: ["how long", "delivery time", "when will it be ready", "timeline"],
        answer:
          "Most sites launch in days to a few weeks depending on plan. Quick $350 starter is fastest. We aim for 3–10 business days after you approve the design.",
      },
      {
        keywords: ["help", "support", "contact", "questions"],
        answer: `We're here for you! Reach out to Michael Francis anytime:
Email: michael@forwardslash.chat
[Book a quick chat](${CAL_LINK})
We're based in Orlando, Florida and reply fast.`,
      },
      {
        keywords: ["what is", "what does forwardslash do", "what is forwardslash.chat", "tell me about"],
        answer: `**ForwardSlash.Chat** helps new entrepreneurs and local businesses in Florida get online fast with a professional website + built-in AI chatbot. We build it, host it for year 1, and you pay once — no monthly fees.
From a quick [starter site for $350](/services#pricing) to full custom builds.
Check the [demo](/chat/demo) or see [how it works](/services#how-it-works).`,
      },
      {
        keywords: ["blog", "blogs", "article", "articles", "post", "posts", "read your", "writing", "tips"],
        answer:
          "Here are some posts we've written on getting online, one-time pricing, and using an AI chatbot for your business. Tap a card to read more.",
        followUps: ["How much does it cost?", "What's the $350 starter?"],
      },
    ];

  for (const { keywords, answer, pills, followUps } of pairs) {
    for (const kw of keywords) {
      if (q.includes(kw)) return { text: answer, pills, followUps };
    }
  }
  return null;
}

function newMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type LeadLine = { role: "user" | "assistant"; content: string };

async function postDemoLead(body: Record<string, unknown>) {
  const res = await fetch("/api/chat/demo/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not save");
  }
  return res.json() as Promise<{ ok?: boolean }>;
}

function DemoLeadCapture({ onComplete }: { onComplete: () => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LeadLine[]>([]);
  const [step, setStep] = useState<"name" | "email" | "phone">("name");
  const [firstName, setFirstName] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setLines([{ role: "assistant", content: LEAD_ASK_NAME }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const pushPair = (userText: string, assistantContent: string) => {
    setLines((prev) => [
      ...prev,
      { role: "user", content: userText },
      { role: "assistant", content: assistantContent },
    ]);
  };

  const submit = async () => {
    let raw = sanitizeChatMessage(input);
    if (step === "phone" && input.trim() === "") {
      raw = "skip";
    }
    if (!raw || busy) return;
    setInput("");
    setErr(null);
    const lower = raw.toLowerCase();

    if (step === "name") {
      if (lower === "skip") {
        setBusy(true);
        try {
          await postDemoLead({ skipped: true });
          sessionStorage.setItem(LEAD_STORAGE_DONE, "skipped");
          pushPair(raw, LEAD_SKIP_THANKS);
          window.setTimeout(onComplete, 400);
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Save failed");
        } finally {
          setBusy(false);
        }
        return;
      }
      const name = sanitizeFirstName(raw);
      if (!name) {
        setErr("Please enter your first name, or type skip.");
        return;
      }
      setFirstName(name);
      setStep("email");
      pushPair(raw, LEAD_ASK_EMAIL(name));
      return;
    }

    if (step === "email") {
      if (lower === "skip") {
        setBusy(true);
        try {
          await postDemoLead({ skipped: true });
          sessionStorage.setItem(LEAD_STORAGE_DONE, "skipped");
          pushPair(raw, LEAD_SKIP_THANKS);
          window.setTimeout(onComplete, 400);
        } catch (e) {
          setErr(e instanceof Error ? e.message : "Save failed");
        } finally {
          setBusy(false);
        }
        return;
      }
      const em = sanitizeEmail(raw);
      if (!isValidEmail(em)) {
        setErr("Please enter a valid email, or type skip.");
        return;
      }
      setEmailDraft(em);
      setStep("phone");
      pushPair(raw, LEAD_ASK_PHONE);
      return;
    }

    if (step === "phone") {
      setBusy(true);
      try {
        const phone =
          lower === "skip" || raw.trim() === "" ? null : sanitizePhone(raw);
        await postDemoLead({
          skipped: false,
          firstName,
          email: emailDraft,
          phone: phone && phone.length > 0 ? phone : null,
        });
        sessionStorage.setItem(LEAD_STORAGE_DONE, "1");
        pushPair(raw.trim() === "" || lower === "skip" ? "skip" : raw, LEAD_THANKS);
        window.setTimeout(onComplete, 400);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed");
      } finally {
        setBusy(false);
      }
    }
  };

  const placeholder =
    step === "name" ? "First name or skip" : step === "email" ? "Email or skip" : "Phone (optional) or skip";

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
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400/90">
            Quick intro
          </p>
          {err && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}
          {lines.map((line, i) => (
            <div key={i} className={line.role === "user" ? "flex justify-end" : ""}>
              <div
                className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                  line.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/80"
                }`}
              >
                {line.role === "assistant" ? <ChatMessageContent content={line.content} /> : line.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="inline-block px-4 py-3 rounded-2xl bg-muted/80 text-muted-foreground text-sm">
                Saving...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="p-4 border-t shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="border border-border rounded-lg p-3 bg-muted/30 dark:bg-muted/10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, LIMITS.chatMessage))}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void submit()}
              placeholder={placeholder}
              maxLength={LIMITS.chatMessage}
              disabled={busy}
              className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!input.trim() || busy}
                className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 shrink-0"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoChatThread() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pendingHardcoded, setPendingHardcoded] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { messages, append, setMessages, input, setInput, isLoading, error, stop } = useChat({
    api: "/api/chat/demo",
    id: "forwardslash-product-demo",
    onError: () => {
      setLocalError("Something went wrong. You can try again, or use a suggested question above.");
    },
    onFinish: () => {
      setLocalError(null);
    },
  });

  const busy = isLoading || pendingHardcoded;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, localError]);

  const send = useCallback(
    async (text: string) => {
      const t = sanitizeChatMessage(text);
      if (!t || busy) return;
      setInput("");
      setLocalError(null);

      const hardcoded = getHardcodedResponse(t);
      if (hardcoded) {
        setPendingHardcoded(true);
        window.setTimeout(() => {
          const userMsg: Message = {
            id: newMessageId("u"),
            role: "user",
            content: t,
            createdAt: new Date(),
          };
          const assistantMsg: Message = {
            id: newMessageId("a"),
            role: "assistant",
            content: hardcoded.text,
            createdAt: new Date(),
            data: {
              demoKind: "hardcoded",
              ...(hardcoded.pills != null ? { pills: hardcoded.pills } : {}),
              ...(hardcoded.followUps != null ? { followUps: hardcoded.followUps } : {}),
            } as JSONValue,
          };
          setMessages((prev) => [...prev, userMsg, assistantMsg]);
          setPendingHardcoded(false);
        }, TYPING_DELAY_MS);
        return;
      }

      try {
        await append({ role: "user", content: t });
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: newMessageId("a"),
            role: "assistant",
            content: FALLBACK,
            createdAt: new Date(),
          },
        ]);
      }
    },
    [append, busy, setInput, setMessages]
  );

  const startNewChat = useCallback(() => {
    stop();
    setPendingHardcoded(false);
    setLocalError(null);
    setMessages([]);
    setInput("");
  }, [stop, setMessages, setInput]);

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
              <p className="text-lg font-medium mb-1">You&apos;re in the product demo.</p>
              <p className="text-muted-foreground mb-6">
                Popular topics get instant replies; open-ended questions use live AI trained on ForwardSlash product
                information — the same pattern as deployed customer chatbots.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-6">
                {PILL_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
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
                    type="button"
                    onClick={() => void send(s)}
                    className="block w-full text-left text-sm text-muted-foreground hover:text-foreground py-2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {(localError || error) && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {localError ?? error?.message ?? "Request failed."}
                </div>
              )}
              {messages.map((m, i) => {
                const userQuery = m.role === "assistant" ? messages[i - 1]?.content ?? "" : "";
                const cards = m.role === "assistant" ? getDemoCardsForMessage(userQuery) : [];
                const showBlogPill = m.role === "assistant" && shouldShowBlogPill(userQuery);
                const demoData = m.role === "assistant" && isDemoHardcodedData(m.data) ? m.data : null;
                const pills = demoData?.pills;
                const followUps = demoData?.followUps;

                return (
                  <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                    <div
                      className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/80"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <>
                          <ChatMessageContent content={m.content} />
                          <ChatCards blocks={cards} primaryColor="#059669" compact />
                          {showBlogPill && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => void send("What blog posts do you have?")}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
                              >
                                Blog →
                              </button>
                            </div>
                          )}
                          {followUps && followUps.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {followUps.map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => void send(f)}
                                  className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          )}
                          {pills && pills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {pills.map((p) => (
                                <Link
                                  key={p.href + p.label}
                                  href={p.href}
                                  className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors shadow-sm"
                                >
                                  {p.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                );
              })}
              {busy && (
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
          <div className="border border-border rounded-lg p-3 bg-muted/30 dark:bg-muted/10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, LIMITS.chatMessage))}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send(input)}
              placeholder="Ask anything"
              maxLength={LIMITS.chatMessage}
              className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex items-center justify-between mt-2 gap-3">
              <Button
                asChild
                variant="cta"
                size="sm"
                className="rounded-full px-4 font-semibold shadow-md shadow-emerald-600/25"
              >
                <Link href="/checkout?plan=chatbot-2y&pages=25">Purchase</Link>
              </Button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={startNewChat}
                  title="New chat — clear this conversation"
                  aria-label="New chat"
                  className="w-7 h-7 rounded-full border border-border bg-background text-foreground flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => void send(input)}
                  disabled={!input.trim() || busy}
                  title="Send"
                  aria-label="Send message"
                  className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 shrink-0"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Demo chatbot · Keyword shortcuts + live AI (same engine as deployed bots).{" "}
            <Link
              href="/chat/demo?forceLead=1"
              className="text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-800 dark:hover:text-emerald-300"
            >
              Show name &amp; email intro again
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function DemoChatPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const forceLead = searchParams.get("forceLead");
  const [ready, setReady] = useState(false);
  const [leadDone, setLeadDone] = useState(false);

  useLayoutEffect(() => {
    if (forceLead === "1") {
      sessionStorage.removeItem(LEAD_STORAGE_DONE);
      sessionStorage.removeItem("fs_demo_lead_v1");
      setLeadDone(false);
      const next = new URLSearchParams(window.location.search);
      next.delete("forceLead");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    } else {
      setLeadDone(Boolean(sessionStorage.getItem(LEAD_STORAGE_DONE)));
    }
    setReady(true);
  }, [forceLead, pathname, router]);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-muted-foreground text-sm">
        Loading demo…
      </div>
    );
  }

  if (!leadDone) {
    return <DemoLeadCapture onComplete={() => setLeadDone(true)} />;
  }

  return <DemoChatThread />;
}

export default function DemoChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-background text-muted-foreground text-sm">
          Loading demo…
        </div>
      }
    >
      <DemoChatPageContent />
    </Suspense>
  );
}
