"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2 space-y-1 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-2 space-y-1 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),
        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Code (inline)
        code: ({ children }) => (
          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground my-2">
            {children}
          </blockquote>
        ),
        // Horizontal rule
        hr: () => <hr className="my-4 border-border" />,
        // Links
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-primary underline underline-offset-2 hover:text-primary/80"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
