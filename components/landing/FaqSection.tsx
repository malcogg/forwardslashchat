"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FadeInSection } from "@/components/FadeInSection";

const faqs = [
  {
    question: "What is ForwardSlash.Chat and how does it work?",
    answer:
      "ForwardSlash.Chat builds custom AI chatbots for small and medium businesses. We scan your website, train an AI on your content (services, FAQ, products, blog), and deploy it at your subdomain (e.g. chat.yourbusiness.com). You pay once—no monthly fees—and hosting is included for your prepaid period.",
  },
  {
    question: "How does the AI use my website content?",
    answer:
      "We crawl your site and extract clean text from your pages. That content is stored and used when a visitor asks a question. The AI answers only using your real content—we don't make things up. Your data is used exclusively for your chatbot and is never shared or used to train other models.",
  },
  {
    question: "What does the one-time payment include?",
    answer:
      "One payment covers chatbot creation, hosting, and maintenance for your chosen period (1–5 years). After your prepaid period ends, renewal is optional at $495/year. There are no monthly fees, no per-message charges, and no hidden costs.",
  },
  {
    question: "How long until my chatbot is live?",
    answer:
      "Typically 3–10 business days. After payment, we crawl your site, train the bot, and send you DNS instructions. Once you add the CNAME record, your chatbot goes live at your chosen subdomain.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <FadeInSection>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              Frequently asked
              <br />
              questions
            </h2>
          </div>
          <div className="space-y-0">
            {faqs.map((faq, index) => (
              <div key={index} className="border-t border-border">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <span className="text-sm pr-4 text-foreground">{faq.question}</span>
                  <Plus
                    className={`w-4 h-4 flex-shrink-0 transition-transform text-muted-foreground ${openIndex === index ? "rotate-45" : ""}`}
                  />
                </button>
                {openIndex === index && (
                  <div className="pb-5 text-sm text-muted-foreground">{faq.answer}</div>
                )}
              </div>
            ))}
            <div className="border-t border-border" />
          </div>
        </div>
        </FadeInSection>
      </div>
    </section>
  );
}
