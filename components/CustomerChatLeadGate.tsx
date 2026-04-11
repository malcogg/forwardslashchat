"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import {
  isValidEmail,
  LIMITS,
  sanitizeChatMessage,
  sanitizeEmail,
  sanitizeFirstName,
  sanitizePhone,
} from "@/lib/validation";
import { ChatMessageContent } from "@/components/chat/ChatMessageContent";

export function customerLeadSessionKey(customerId: string) {
  return `fs_cust_lead_v1_${customerId}`;
}

type LeadLine = { role: "user" | "assistant"; content: string };

async function postCustomerLead(customerId: string, body: Record<string, unknown>) {
  const res = await fetch("/api/chat/customer-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, ...body }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not save");
  }
  return res.json() as Promise<{ ok?: boolean }>;
}

interface CustomerChatLeadGateProps {
  customerId: string;
  businessName: string;
  primaryColor: string;
  onComplete: () => void;
}

export function CustomerChatLeadGate({
  customerId,
  businessName,
  primaryColor,
  onComplete,
}: CustomerChatLeadGateProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LeadLine[]>([]);
  const [step, setStep] = useState<"name" | "email" | "phone">("name");
  const [firstName, setFirstName] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const seeded = useRef(false);

  const askName = `Would you like **${businessName}** to follow up? Share your **first name**, or type **skip** to ask questions without sharing contact info.`;

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setLines([{ role: "assistant", content: askName }]);
  }, [askName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const pushPair = useCallback((userText: string, assistantContent: string) => {
    setLines((prev) => [
      ...prev,
      { role: "user", content: userText },
      { role: "assistant", content: assistantContent },
    ]);
  }, []);

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
          await postCustomerLead(customerId, { skipped: true });
          sessionStorage.setItem(customerLeadSessionKey(customerId), "skipped");
          pushPair(raw, "No problem — ask anything about our services, products, or site.");
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
        setErr("Enter your first name, or type skip.");
        return;
      }
      setFirstName(name);
      setStep("email");
      pushPair(raw, `Thanks, ${name}! What's your **email**? (Type **skip** to continue without email.)`);
      return;
    }

    if (step === "email") {
      if (lower === "skip") {
        setBusy(true);
        try {
          await postCustomerLead(customerId, { skipped: true });
          sessionStorage.setItem(customerLeadSessionKey(customerId), "skipped");
          pushPair(raw, "No problem — ask anything you need.");
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
        setErr("Enter a valid email, or type skip.");
        return;
      }
      setEmailDraft(em);
      setStep("phone");
      pushPair(raw, "Almost done — **phone number** (optional)? Type **skip** or leave blank.");
      return;
    }

    if (step === "phone") {
      setBusy(true);
      try {
        const phone =
          lower === "skip" || raw.trim() === "" ? null : sanitizePhone(raw);
        await postCustomerLead(customerId, {
          skipped: false,
          firstName,
          email: emailDraft,
          phone: phone && phone.length > 0 ? phone : null,
        });
        sessionStorage.setItem(customerLeadSessionKey(customerId), "1");
        pushPair(
          raw.trim() === "" || lower === "skip" ? "skip" : raw,
          "Thanks — how can we help you today?"
        );
        window.setTimeout(onComplete, 400);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Save failed");
      } finally {
        setBusy(false);
      }
    }
  };

  const placeholder =
    step === "name"
      ? "First name or skip"
      : step === "email"
        ? "Email or skip"
        : "Phone (optional) or skip";

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-3 py-2 text-sm mb-3">
            {err}
          </div>
        )}
        <div className="space-y-3">
          {lines.map((line, i) => (
            <div key={i} className={line.role === "user" ? "flex justify-end" : ""}>
              <div
                className={`inline-block max-w-[90%] px-3 py-2 rounded-xl text-sm ${
                  line.role === "user" ? "text-white" : "bg-gray-100 text-gray-900"
                }`}
                style={line.role === "user" ? { backgroundColor: primaryColor } : undefined}
              >
                {line.role === "assistant" ? (
                  <ChatMessageContent content={line.content} />
                ) : (
                  line.content
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="text-sm text-gray-500 px-1">Saving…</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="p-3 border-t border-gray-200 shrink-0">
        <div className="flex gap-2 rounded-lg border border-gray-200 bg-white p-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, LIMITS.chatMessage))}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void submit()}
            placeholder={placeholder}
            maxLength={LIMITS.chatMessage}
            disabled={busy}
            className="flex-1 px-2 py-1.5 bg-transparent text-gray-900 placeholder:text-gray-500 text-sm outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!input.trim() || busy}
            className="p-2 rounded-full text-white disabled:opacity-50 flex items-center justify-center shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
