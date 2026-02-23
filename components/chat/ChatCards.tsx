"use client";

import { ProductCard } from "./ProductCard";
import { BlogCard } from "./BlogCard";
import { CompactTipCard } from "./CompactTipCard";
import type { ChatCardBlock } from "./chat-types";

type ChatCardsProps = {
  blocks: ChatCardBlock[];
  primaryColor?: string;
};

export function ChatCards({ blocks, primaryColor = "#059669" }: ChatCardsProps) {
  if (blocks.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {blocks.map((block, i) => {
        if (block.type === "product") {
          return <ProductCard key={block.id ?? `p-${i}`} block={block} primaryColor={primaryColor} />;
        }
        if (block.type === "blog") {
          return <BlogCard key={block.id ?? `b-${i}`} block={block} />;
        }
        if (block.type === "tip") {
          return <CompactTipCard key={block.id ?? `t-${i}`} block={block} />;
        }
        return null;
      })}
    </div>
  );
}
