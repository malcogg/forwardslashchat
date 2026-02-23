"use client";

import Link from "next/link";
import { Lightbulb } from "lucide-react";
import type { TipCardBlock } from "./chat-types";

type CompactTipCardProps = {
  block: TipCardBlock;
};

export function CompactTipCard({ block }: CompactTipCardProps) {
  const { title, body, icon, url } = block;
  const content = (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left w-full max-w-[280px] flex gap-2">
      <span className="shrink-0 text-amber-500 dark:text-amber-400 mt-0.5">
        {icon === "tip" || !icon ? <Lightbulb className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm">{title}</p>
        {body && <p className="text-xs text-muted-foreground mt-0.5">{body}</p>}
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
