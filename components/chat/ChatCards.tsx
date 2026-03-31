"use client";

import { ProductCard } from "./ProductCard";
import { BlogCard } from "./BlogCard";
import { CompactTipCard } from "./CompactTipCard";
import type { ChatCardBlock } from "./chat-types";

type ChatCardsProps = {
  blocks: ChatCardBlock[];
  primaryColor?: string;
  /** When true, 3 columns one row, compact cards */
  compact?: boolean;
};

export function ChatCards({ blocks, primaryColor = "#059669", compact = false }: ChatCardsProps) {
  if (blocks.length === 0) return null;
  const wrapperClass = compact
    ? "mt-3 grid grid-cols-3 gap-2 max-w-full w-full"
    : "mt-3 flex flex-wrap gap-2";
  return (
    <div className={wrapperClass}>
      {blocks.map((block, i) => {
        if (block.type === "product") {
          return (
            <ProductCard
              key={block.id ?? `p-${i}`}
              block={block}
              primaryColor={primaryColor}
              compact={compact}
            />
          );
        }
        if (block.type === "blog") {
          return <BlogCard key={block.id ?? `b-${i}`} block={block} compact={compact} />;
        }
        if (block.type === "tip") {
          return <CompactTipCard key={block.id ?? `t-${i}`} block={block} />;
        }
        return null;
      })}
    </div>
  );
}
