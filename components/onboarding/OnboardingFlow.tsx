"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Bot,
  Globe,
  GraduationCap,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  Layers,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Mic,
  Newspaper,
  PenLine,
  Radio,
  Search,
  Share2,
  Sparkles,
  Store,
  UserPlus,
} from "lucide-react";
import type { DnsHelpPreference, OnboardingPath } from "@/lib/onboarding-types";
import { playOnboardingClick } from "@/lib/onboarding-click-sound";
import { OnboardingPricingStep } from "@/components/onboarding/OnboardingPricingStep";

const ONBOARDING_SEEN_KEY = "forwardslash_onboarding_seen";

type Phase = "intro" | "path" | "site" | "goal" | "hasAi" | "industry" | "referral" | "last" | "pricing";

function clickSound() {
  playOnboardingClick();
}

const GOAL_OPTIONS = [
  { id: "support", label: "Support visitors", icon: HeadphonesIcon },
  { id: "leads", label: "Capture leads", icon: UserPlus },
  { id: "bookings", label: "Book appointments", icon: LayoutGrid },
  { id: "faq", label: "Answer FAQs", icon: MessageCircle },
  { id: "other", label: "Something else", icon: HelpCircle },
] as const;

const INDUSTRY_OPTIONS = [
  { id: "ecommerce", label: "E-commerce", icon: Store },
  { id: "services", label: "Professional services", icon: Briefcase },
  { id: "saas", label: "SaaS / software", icon: Layers },
  { id: "agency", label: "Agency", icon: Megaphone },
  { id: "nonprofit", label: "Nonprofit", icon: Heart },
  { id: "creator", label: "Creator / media", icon: Mic },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "other", label: "Other", icon: Sparkles },
] as const;

const HAS_AI_OPTIONS = [
  { id: true as const, label: "Yes", sub: "e.g. Intercom, Drift, or a custom widget", icon: Bot },
  { id: false as const, label: "No", sub: "ForwardSlash will be my first chat experience", icon: Sparkles },
] as const;

const REFERRAL_OPTIONS = [
  { id: "search", label: "Search", icon: Search },
  { id: "friend", label: "Friend or colleague", icon: Share2 },
  { id: "social", label: "Social / creator", icon: MessageCircle },
  { id: "newsletter", label: "Newsletter or blog", icon: PenLine },
  { id: "podcast", label: "Podcast", icon: Radio },
  { id: "news", label: "News / press", icon: Newspaper },
  { id: "other", label: "Other", icon: HelpCircle },
] as const;

const DNS_OPTIONS: { id: DnsHelpPreference; label: string; sub: string }[] = [
  { id: "self", label: "I'll add DNS myself", sub: "Comfortable updating records at my registrar" },
  { id: "guided", label: "Walk me through it", sub: "Step-by-step when I'm ready to go live" },
  { id: "someone_else", label: "Someone else handles IT", sub: "I'll share instructions with them" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("intro");
  const [pathChoice, setPathChoice] = useState<OnboardingPath | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [noSiteNote, setNoSiteNote] = useState("");
  const [goal, setGoal] = useState<string | null>(null);
  const [industry, setIndustry] = useState<string | null>(null);
  const [referral, setReferral] = useState<string | null>(null);
  const [hasExistingAiChat, setHasExistingAiChat] = useState<boolean | null>(null);
  const [dns, setDns] = useState<DnsHelpPreference | null>(null);
  const [skippedStepIds, setSkippedStepIds] = useState<string[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { completed?: boolean };
        if (!cancelled && data.completed) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (phase !== "intro") return;
    const t = window.setTimeout(() => {
      setPhase("path");
    }, 2200);
    return () => window.clearTimeout(t);
  }, [phase]);

  const progressIndex = useMemo(() => {
    const order: Phase[] = ["path", "site", "goal", "hasAi", "industry", "referral", "last", "pricing"];
    const i = order.indexOf(phase);
    return i >= 0 ? i : 0;
  }, [phase]);

  const showDots = phase !== "intro";

  const addSkip = useCallback((id: string) => {
    setSkippedStepIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const goBack = useCallback(() => {
    clickSound();
    setSubmitError(null);
    if (phase === "path") return;
    if (phase === "site") {
      setPhase("path");
      return;
    }
    if (phase === "goal") {
      setPhase("site");
      return;
    }
    if (phase === "hasAi") {
      setPhase("goal");
      return;
    }
    if (phase === "industry") {
      setPhase("hasAi");
      return;
    }
    if (phase === "referral") {
      setPhase("industry");
      return;
    }
    if (phase === "last") {
      setPhase("referral");
      return;
    }
    if (phase === "pricing") {
      setPhase("last");
    }
  }, [phase]);

  type AfterSave = "dashboard" | { checkoutHref: string };

  const completeOnboarding = useCallback(
    async (skipAll: boolean, extraSkipIds: string[], after: AfterSave) => {
      if (!pathChoice && !skipAll) return;
      setSubmitting(true);
      setSubmitError(null);
      const mergedSkipped = [...new Set([...skippedStepIds, ...extraSkipIds])];
      const skippedDnsStep = mergedSkipped.includes("dns");
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skipEntireFlow: skipAll,
            path: pathChoice ?? "has_website",
            websiteUrlSnapshot: pathChoice === "has_website" ? websiteUrl || null : null,
            noSiteProjectNote: pathChoice === "no_website" ? noSiteNote || null : null,
            assistantPrimaryUse: goal,
            industry,
            referralSource: referral,
            hasExistingAiChat: skipAll ? null : hasExistingAiChat,
            dnsHelpPreference:
              pathChoice === "has_website" ? (skippedDnsStep ? null : dns) : null,
            skippedStepIds: mergedSkipped,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          setSubmitError(err.error ?? "Something went wrong. Try again.");
          setSubmitting(false);
          return;
        }
        try {
          localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
        } catch {
          /* ignore */
        }
        if (after === "dashboard") {
          setSubmitting(false);
          router.replace("/dashboard");
          return;
        }
        window.location.assign(after.checkoutHref);
      } catch {
        setSubmitError("Network error. Try again.");
        setSubmitting(false);
      }
    },
    [
      pathChoice,
      websiteUrl,
      noSiteNote,
      goal,
      industry,
      referral,
      dns,
      hasExistingAiChat,
      skippedStepIds,
      router,
    ]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" aria-hidden />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-lg"
            >
              <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20" />
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">ForwardSlash.Chat</h1>
              <p className="mt-3 text-sm text-neutral-500">Your site → a trained AI chatbot</p>
              <button
                type="button"
                onClick={() => {
                  clickSound();
                  setPhase("path");
                }}
                className="mt-10 text-sm text-neutral-500 underline-offset-4 hover:underline"
              >
                Skip intro
              </button>
            </motion.div>
          )}

          {phase === "path" && (
            <motion.div
              key="path"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl"
            >
              <div className="text-center mb-10">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Choose your path</h2>
                <p className="mt-2 text-sm text-neutral-500">You can change your mind later — this helps us set up your dashboard</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    setPathChoice("has_website");
                  }}
                  className={`text-left rounded-2xl border p-6 sm:p-8 transition-shadow ${
                    pathChoice === "has_website"
                      ? "border-black ring-1 ring-black shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">I have a live website</h3>
                      <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                        Connect your domain and train a chatbot on your real pages.
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    setPathChoice("no_website");
                  }}
                  className={`text-left rounded-2xl border p-6 sm:p-8 transition-shadow ${
                    pathChoice === "no_website"
                      ? "border-black ring-1 ring-black shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">Not yet — planning or building</h3>
                      <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                        Tell us what you&apos;re working on; we&apos;ll tailor next steps.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <button
                  type="button"
                  disabled={!pathChoice}
                  onClick={() => {
                    clickSound();
                    setPhase("site");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-800 transition-colors"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    void completeOnboarding(true, [], "dashboard");
                  }}
                  disabled={submitting}
                  className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline disabled:opacity-50"
                >
                  Skip setup
                </button>
              </div>
            </motion.div>
          )}

          {phase === "site" && (
            <motion.div
              key="site"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md"
            >
              {pathChoice === "has_website" ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                    What&apos;s your website URL?
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 text-center">Optional — helps pre-fill your first scan</p>
                  <label className="block mt-8 text-sm font-medium text-neutral-700">
                    Website
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://yoursite.com"
                      className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                  </label>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                    What are you building?
                  </h2>
                  <p className="mt-2 text-sm text-neutral-500 text-center">A sentence is enough</p>
                  <label className="block mt-8 text-sm font-medium text-neutral-700">
                    Project (optional)
                    <textarea
                      value={noSiteNote}
                      onChange={(e) => setNoSiteNote(e.target.value)}
                      rows={4}
                      placeholder="e.g. Launching a dental practice site next month…"
                      className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                    />
                  </label>
                </>
              )}
              <div className="flex flex-wrap items-center gap-6 mt-10">
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    setPhase("goal");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    addSkip("site");
                    setPhase("goal");
                  }}
                  className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={goBack}
                  className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {phase === "goal" && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                What should your chatbot do first?
              </h2>
              <p className="mt-2 text-sm text-neutral-500 text-center">Pick the closest match</p>
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GOAL_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      clickSound();
                      setGoal(id);
                    }}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-medium transition-shadow ${
                      goal === id ? "border-black ring-1 ring-black" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-neutral-500 shrink-0" strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center">
                <button
                  type="button"
                  disabled={!goal}
                  onClick={() => {
                    clickSound();
                    setPhase("hasAi");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
                <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline">
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {phase === "hasAi" && (
            <motion.div
              key="hasAi"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                Do you already use a chatbot or live chat?
              </h2>
              <p className="mt-2 text-sm text-neutral-500 text-center">Helps us tailor migration tips in your dashboard</p>
              <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {HAS_AI_OPTIONS.map(({ id, label, sub, icon: Icon }) => (
                  <button
                    key={String(id)}
                    type="button"
                    onClick={() => {
                      clickSound();
                      setHasExistingAiChat(id);
                    }}
                    className={`text-left rounded-2xl border p-6 transition-shadow ${
                      hasExistingAiChat === id ? "border-black ring-1 ring-black" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-neutral-500 mb-3" strokeWidth={1.5} />
                    <p className="font-semibold">{label}</p>
                    <p className="mt-2 text-xs text-neutral-500 leading-relaxed">{sub}</p>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center">
                <button
                  type="button"
                  disabled={hasExistingAiChat === null}
                  onClick={() => {
                    clickSound();
                    setPhase("industry");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    addSkip("hasAi");
                    setHasExistingAiChat(null);
                    setPhase("industry");
                  }}
                  className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline"
                >
                  Skip
                </button>
                <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline">
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {phase === "industry" && (
            <motion.div
              key="industry"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                Which best describes you?
              </h2>
              <p className="mt-2 text-sm text-neutral-500 text-center">We use this to tune suggestions</p>
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INDUSTRY_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      clickSound();
                      setIndustry(id);
                    }}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-4 text-left text-sm font-medium transition-shadow ${
                      industry === id ? "border-black ring-1 ring-black" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-neutral-500 shrink-0" strokeWidth={1.5} />
                    <span className="leading-tight">{label}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center">
                <button
                  type="button"
                  disabled={!industry}
                  onClick={() => {
                    clickSound();
                    setPhase("referral");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
                <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline">
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {phase === "referral" && (
            <motion.div
              key="referral"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                How did you hear about us?
              </h2>
              <p className="mt-2 text-sm text-neutral-500 text-center">Optional</p>
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {REFERRAL_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      clickSound();
                      setReferral(id);
                    }}
                    className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-shadow ${
                      referral === id ? "border-black ring-1 ring-black" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-neutral-500 shrink-0" strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    setPhase("last");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    addSkip("referral");
                    setReferral(null);
                    setPhase("last");
                  }}
                  className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline"
                >
                  Skip
                </button>
                <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline">
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {phase === "last" && pathChoice === "has_website" && (
            <motion.div
              key="last-dns"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
                When it&apos;s time to go live, DNS feels…
              </h2>
              <p className="mt-2 text-sm text-neutral-500 text-center">We&apos;ll match instructions to your comfort level</p>
              <div className="mt-10 grid sm:grid-cols-3 gap-4">
                {DNS_OPTIONS.map(({ id, label, sub }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      clickSound();
                      setDns(id);
                    }}
                    className={`text-left rounded-2xl border p-5 transition-shadow ${
                      dns === id ? "border-black ring-1 ring-black" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="mt-2 text-xs text-neutral-500 leading-relaxed">{sub}</p>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center">
                <button
                  type="button"
                  disabled={!dns}
                  onClick={() => {
                    clickSound();
                    setSubmitError(null);
                    setPhase("pricing");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none hover:bg-neutral-800 transition-colors"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    addSkip("dns");
                    setSubmitError(null);
                    setPhase("pricing");
                  }}
                  className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline"
                >
                  Skip
                </button>
                <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline">
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {phase === "last" && pathChoice === "no_website" && (
            <motion.div
              key="last-ready"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                <Globe className="h-8 w-8 text-neutral-600" strokeWidth={1.25} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">You&apos;re set</h2>
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                We&apos;ll use your answers in the dashboard. When your site is ready, you can connect it in a few clicks.
              </p>
              <div className="flex flex-wrap items-center gap-6 mt-10 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    clickSound();
                    setSubmitError(null);
                    setPhase("pricing");
                  }}
                  className="rounded-full bg-black text-white px-10 py-3 text-sm font-medium hover:bg-neutral-800 transition-colors"
                >
                  Continue
                </button>
                <button type="button" onClick={goBack} className="text-sm text-neutral-600 hover:text-black underline-offset-4 hover:underline">
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {phase === "pricing" && (
            <OnboardingPricingStep
              hasWebsitePath={pathChoice === "has_website"}
              websiteUrl={websiteUrl}
              preselectDnsAddon={
                pathChoice === "has_website" &&
                (dns === "guided" || dns === "someone_else")
              }
              onBack={goBack}
              onSaveAndGoDashboard={() => void completeOnboarding(false, [], "dashboard")}
              onSaveAndGoCheckout={(checkoutHref) =>
                void completeOnboarding(false, [], { checkoutHref })
              }
              submitting={submitting}
              error={submitError}
            />
          )}
        </AnimatePresence>
      </div>

      {showDots && (
        <div className="pb-10 flex justify-center gap-2" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <span
              key={i}
              className={`rounded-full transition-all ${
                i === progressIndex ? "h-2 w-2 bg-black" : "h-1.5 w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
