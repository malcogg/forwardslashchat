"use client";

import { useParams } from "next/navigation";
import { CustomerChat } from "@/components/CustomerChat";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { CustomerChatAiDisclaimer } from "@/components/chat/CustomerChatAiDisclaimer";

export default function CustomerChatPage() {
  const params = useParams();
  const customerId = params.customerId as string;
  const [customer, setCustomer] = useState<{ businessName: string; primaryColor: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      setError("Missing customer");
      return;
    }
    fetch(`/api/chat/customer/${customerId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Not found"))))
      .then(setCustomer)
      .catch(() => setError("Chatbot not found"))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </main>
        <CustomerChatAiDisclaimer />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{error ?? "Chatbot not found"}</p>
            <Link href="/" className="text-emerald-600 hover:underline">
              Back to ForwardSlash.Chat
            </Link>
          </div>
        </main>
        <CustomerChatAiDisclaimer />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-end px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ForwardSlash.Chat
        </Link>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <CustomerChat
          customerId={customerId}
          businessName={customer.businessName}
          primaryColor={customer.primaryColor ?? "#6B4E3D"}
          compact={false}
        />
        {/* Shirt-tag style: full bleed, tucked in corner, black bg, white text — sits above disclaimer */}
        <a
          href="https://forwardslash.chat"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black text-white px-3 py-1.5 text-xs font-medium -rotate-3 origin-bottom-right hover:bg-gray-900 hover:text-white shadow-sm"
          style={{ borderTopLeftRadius: 4 }}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
          <span>ForwardSlash</span>
        </a>
      </div>
      <CustomerChatAiDisclaimer />
    </div>
  );
}
