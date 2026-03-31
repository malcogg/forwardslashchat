"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Globe, Check } from "lucide-react";

const ACCENT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#0ea5e9", "#6366f1",
  "#a855f7", "#d946ef", "#1e293b", "#374151", "#4b5563", "#6b7280",
];

export function DashboardMockup() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const items = mockupRef.current?.querySelectorAll(".animate-on-scroll");
    if (!items?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const index = Number(el.dataset.index ?? 0);
            setTimeout(() => el.classList.add("visible"), index * 120);
          }
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [mounted]);

  // Invert: light page → dark mockup, dark page → light mockup (contrast)
  const darkMockup = !mounted || theme !== "dark";

  const base = darkMockup
    ? {
        bg: "bg-zinc-800",
        card: "bg-zinc-700",
        border: "border-zinc-600",
        text: "text-zinc-100",
        muted: "text-zinc-400",
        bar: "bg-zinc-700/80",
        input: "bg-zinc-900/50 border-zinc-600",
      }
    : {
        bg: "bg-gray-50",
        card: "bg-white",
        border: "border-gray-200",
        text: "text-gray-900",
        muted: "text-gray-500",
        bar: "bg-gray-100",
        input: "bg-white border-gray-300",
      };

  return (
    <div ref={mockupRef} className="relative w-full max-w-5xl mx-auto rounded-xl shadow-2xl overflow-hidden mt-12 border border-border dashboard-mockup-wrapper">
    <div className={`w-full max-w-5xl mx-auto rounded-xl overflow-hidden border ${base.border} ${base.bg}`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${base.border} ${base.bar}`}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs ${base.muted} ${darkMockup ? "bg-zinc-600/50" : "bg-gray-200"}`}>
            <Globe className="w-3 h-3" />
            forwardslash.chat/dashboard
          </div>
        </div>
      </div>

      <div className="flex">
        <div className={`w-56 border-r ${base.border} p-4 hidden md:block ${darkMockup ? "bg-zinc-800/50" : "bg-gray-100/80"}`}>
          <div className="flex items-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${darkMockup ? "bg-zinc-600" : "bg-gray-700"}`}>
              <span className={`text-xs font-medium ${darkMockup ? "text-zinc-100" : "text-white"}`}>MF</span>
            </div>
            <span className={`text-sm font-medium ${base.text} truncate`}>Michael Francis</span>
            <span className="pro-badge shrink-0 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold text-[11px] px-2.5 py-0.5 rounded-full ml-1 shadow-sm">
              PRO
            </span>
          </div>

          <div className="mb-4">
            <div className={`flex items-center justify-between px-2 py-1.5 text-sm ${base.muted}`}>
              <span>▸</span> Scan site
            </div>
          </div>

          <nav className="space-y-0.5 flex-1 dashboard-mockup-nav">
            <div className="nav-item animate-on-scroll flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-all duration-500" data-index={0}>
              <span className="checkmark inline-block w-5 h-5 shrink-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </span>
              <span className={base.muted}>Training</span>
            </div>
            <div className={`nav-item selected animate-on-scroll flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-all duration-500 ${darkMockup ? "bg-zinc-600/50 text-zinc-100" : "bg-gray-200 text-gray-900"}`} data-index={1}>
              <span className="checkmark inline-block w-5 h-5 shrink-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </span>
              <span>Design</span>
            </div>
            <div className={`nav-item animate-on-scroll flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-all duration-500 ${base.muted}`} data-index={2}>
              <span className="checkmark inline-block w-5 h-5 shrink-0 flex items-center justify-center">
                <span className="text-gray-400">○</span>
              </span>
              <span>Domain</span>
            </div>
          </nav>

          <div className={`pt-6 border-t ${base.border}`}>
            <div className={`text-xs ${base.muted}`}>Content pages</div>
            <div className={`text-sm font-medium ${darkMockup ? "text-red-400" : "text-red-500"}`}>12 / 25 crawled</div>
            <div className="flex items-center gap-2 mt-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${darkMockup ? "bg-zinc-600" : "bg-gray-200"}`}>
                <span className={`text-xs font-medium ${base.text}`}>MF</span>
              </div>
              <span className={`text-sm ${base.text} truncate`}>Michael Francis</span>
            </div>
          </div>
        </div>

        <div className={`w-64 border-r ${base.border} p-4 hidden lg:block ${base.bg}`}>
          <h3 className={`font-medium ${base.text} mb-6`}>Design</h3>
          <div className="space-y-4">
            <div>
              <label className={`text-sm ${base.muted}`}>Display name</label>
              <div className={`text-sm ${base.text} mt-1`}>My Business</div>
            </div>
            <div>
              <label className={`text-sm ${base.muted}`}>Logo</label>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mt-1 ${darkMockup ? "bg-zinc-600" : "bg-gray-200"}`}>
                <span className={`text-sm font-medium ${base.text}`}>M</span>
              </div>
            </div>
            <div className={`rounded-lg p-4 border ${base.border} ${darkMockup ? "bg-zinc-700/50" : "bg-gray-100"}`}>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${darkMockup ? "bg-zinc-600" : "bg-gray-700"}`}>
                  <span className="text-white text-xs">MF</span>
                </div>
                <div>
                  <div className={`text-sm font-medium ${base.text}`}>Michael Francis</div>
                  <div className={`text-xs ${base.muted}`}>My Business</div>
                </div>
              </div>
            </div>
            <div>
              <label className={`text-sm ${base.muted}`}>Favicon</label>
              <div className={`w-6 h-6 rounded flex items-center justify-center mt-1 ${darkMockup ? "bg-zinc-600" : "bg-gray-700"}`}>
                <span className="text-white text-xs">✦</span>
              </div>
            </div>
            <div>
              <label className={`text-sm ${base.muted}`}>Accent</label>
              <div className="w-6 h-6 rounded-full mt-1 border border-gray-400 bg-black" />
            </div>
            <div>
              <label className={`text-sm ${base.muted}`}>Heading</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ACCENT_COLORS.map((c) => (
                  <div key={c} className="w-5 h-5 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button className={`px-3 py-1.5 text-sm border ${base.border} rounded ${base.text}`}>Discard</button>
            <button className={`px-3 py-1.5 text-sm rounded ${darkMockup ? "bg-zinc-100 text-zinc-900" : "bg-gray-900 text-white"}`}>Save</button>
          </div>
        </div>

        <div className="flex-1 p-4 min-w-0">
          <ChatPreview dark={darkMockup} />
        </div>
      </div>
    </div>
    </div>
  );
}

function ChatPreview({ dark }: { dark: boolean }) {
  const bg = dark ? "bg-zinc-700" : "bg-white";
  const border = dark ? "border-zinc-600" : "border-gray-200";
  const text = dark ? "text-zinc-100" : "text-gray-900";
  const muted = dark ? "text-zinc-400" : "text-gray-500";
  const inputBg = dark ? "border-zinc-600 bg-zinc-800" : "border-gray-200 bg-gray-50";

  return (
    <div className={`${bg} rounded-lg border ${border} shadow-sm overflow-hidden h-full min-h-[200px] flex flex-col`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${border} shrink-0`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${dark ? "bg-zinc-600" : "bg-gray-300"}`}>
          <span className={`text-xs font-bold ${dark ? "text-zinc-100" : "text-gray-700"}`}>A</span>
        </div>
        <span className={`text-sm font-medium ${text}`}>Your Business</span>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h2 className={`text-xl font-semibold mb-2 ${text}`}>How can I help?</h2>
        <p className={`text-sm ${muted} mb-6`}>
          Ask me about your services, products,
          <br />
          or anything on your website.
        </p>
        <div className={`border rounded-lg p-3 ${inputBg} mb-6`}>
          <input
            type="text"
            placeholder="Ask anything"
            className={`w-full text-sm outline-none bg-transparent ${dark ? "text-zinc-100 placeholder:text-zinc-500" : "text-gray-900 placeholder:text-gray-500"}`}
            readOnly
          />
          <div className="flex items-center justify-between mt-2">
            <div className={`flex items-center gap-1 text-xs ${muted}`}>
              <span>📎</span> 0 Files
            </div>
            <button className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs">↑</span>
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p className={`text-sm ${muted}`}>What services do you offer?</p>
          <p className={`text-sm ${muted}`}>Tell me about your products</p>
          <p className={`text-sm ${muted}`}>How do I get in touch?</p>
        </div>
      </div>
    </div>
  );
}
