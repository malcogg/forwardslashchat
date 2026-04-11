"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MdProps = ComponentPropsWithoutRef<"p">;

const components = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-2xl font-semibold tracking-tight text-foreground mt-10 mb-4 first:mt-0" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-xl font-semibold text-foreground mt-8 mb-3" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-lg font-medium text-foreground mt-6 mb-2" {...props} />
  ),
  p: (props: MdProps) => <p className="mb-4 text-muted-foreground leading-relaxed" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-4 list-disc pl-6 text-muted-foreground space-y-2" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-4 list-decimal pl-6 text-muted-foreground space-y-2" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => <li className="leading-relaxed" {...props} />,
  strong: (props: ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold text-foreground" {...props} />,
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a className="text-primary underline underline-offset-2 hover:opacity-90" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="border-l-2 border-border pl-4 my-4 text-muted-foreground italic text-sm"
      {...props}
    />
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm text-left" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: (props: ComponentPropsWithoutRef<"thead">) => <thead className="bg-muted/50" {...props} />,
  th: (props: ComponentPropsWithoutRef<"th">) => (
    <th className="px-3 py-2 font-medium text-foreground border-b border-border" {...props} />
  ),
  td: (props: ComponentPropsWithoutRef<"td">) => (
    <td className="px-3 py-2 text-muted-foreground border-b border-border align-top" {...props} />
  ),
  hr: () => <hr className="my-8 border-border" />,
};

export function LegalMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
