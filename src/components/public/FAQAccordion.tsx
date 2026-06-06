"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-900/50 transition-colors"
            >
              <span
                className={`font-bold uppercase tracking-wide text-sm md:text-base ${
                  isOpen ? "text-lime-400" : "text-white"
                }`}
              >
                {faq.q}
              </span>
              <div
                className={`w-8 h-8 flex items-center justify-center shrink-0 border transition-colors ${
                  isOpen
                    ? "bg-lime-400 text-zinc-950 border-lime-400"
                    : "bg-transparent text-zinc-500 border-zinc-700"
                }`}
              >
                {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-6 pt-2 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50">
                  {faq.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
