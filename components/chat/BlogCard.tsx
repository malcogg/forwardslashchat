"use client";

import Link from "next/link";
import type { BlogCardBlock } from "./chat-types";

type BlogCardProps = {
  block: BlogCardBlock;
};

export function BlogCard({ block }: BlogCardProps) {
  const { title, excerpt, imageUrl, url, date } = block;
  const content = (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full max-w-[280px]">
      {imageUrl && (
        <div className="aspect-video bg-muted relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <p className="font-semibold text-foreground text-sm line-clamp-2">{title}</p>
        {excerpt && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{excerpt}</p>
        )}
        {date && (
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">{date}</p>
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
