"use client";

import Link from "next/link";
import type { ProductCardBlock } from "./chat-types";

type ProductCardProps = {
  block: ProductCardBlock;
  primaryColor?: string;
};

export function ProductCard({ block, primaryColor = "#059669" }: ProductCardProps) {
  const { title, price, imageUrl, productUrl, description } = block;
  const content = (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full max-w-[280px]">
      {imageUrl && (
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <p className="font-semibold text-foreground text-sm line-clamp-2">{title}</p>
        {price && (
          <p className="text-sm font-medium mt-1" style={{ color: primaryColor }}>
            {price}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );

  if (productUrl) {
    return (
      <Link href={productUrl} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </Link>
    );
  }
  return content;
}
