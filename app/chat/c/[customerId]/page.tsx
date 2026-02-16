"use client";

import { useParams } from "next/navigation";
import { CustomerChat } from "@/components/CustomerChat";
import { useState, useEffect } from "react";
import Link from "next/link";

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
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading...</p>
      </main>
    );
  }

  if (error || !customer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-8">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error ?? "Chatbot not found"}</p>
          <Link href="/" className="text-blue-400 hover:underline">Back to ForwardSlash.Chat</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
        <span className="font-semibold text-white">{customer.businessName}</span>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ForwardSlash.Chat
        </Link>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <CustomerChat
          customerId={customerId}
          businessName={customer.businessName}
          primaryColor={customer.primaryColor ?? "#6B4E3D"}
          compact={false}
        />
      </div>
    </div>
  );
}
