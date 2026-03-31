"use client";

import Link from "next/link";
import type { BlogCardBlock } from "./chat-types";

type BlogCardProps = {
  block: BlogCardBlock;
  compact?: boolean;
};

export function BlogCard({ block, compact = false }: BlogCardProps) {
  const { title, excerpt, imageUrl, url, date } = block;
  const content = (
    <div
      className={
        compact
          ? "rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full min-w-0"
          : "rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full max-w-[280px]"
      }
    >
      {imageUrl && (
        <div className="aspect-video bg-muted relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={compact ? "p-2" : "p-3"}>
        <p className={compact ? "font-semibold text-foreground text-xs line-clamp-2" : "font-semibold text-foreground text-sm line-clamp-2"}>{title}</p>
        {excerpt && !compact && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{excerpt}</p>
        )}
        {date && (
          <p className={compact ? "text-[9px] text-muted-foreground mt-1 uppercase tracking-wide" : "text-[10px] text-muted-foreground mt-2 uppercase tracking-wide"}>{date}</p>
        )}
      </div>
    </div>
  );

  if (url) {
    return (
      <Link href={url} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </Link>
    );
  }
  return content;
}
