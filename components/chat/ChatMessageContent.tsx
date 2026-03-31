"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

type ChatMessageContentProps = {
  content: string;
  className?: string;
};

/** Renders assistant message content as markdown (links, bold, lists, etc.) */
export function ChatMessageContent({ content, className = "" }: ChatMessageContentProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (!href) return <>{children}</>;
            const isInternal = href.startsWith("/") && !href.startsWith("//");
            if (isInternal) {
              return (
                <Link href={href} className="text-primary underline hover:underline">
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
