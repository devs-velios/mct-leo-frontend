"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * LLM answers often come back as one paragraph with inline `**bold:**` section
 * labels and ` - ` bullets (no real newlines). Gently normalize that into proper
 * markdown so headings and lists render, without mangling legitimate hyphens.
 */
function normalizeLlmMarkdown(text: string): string {
  return text
    // Put a bold "Section:" label on its own block.
    .replace(/\s*\*\*([^*]+?:)\*\*\s*/g, "\n\n**$1**\n")
    // Turn inline " - item" bullets into list items (requires spaces both sides).
    .replace(/\s+-\s+/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Memoized: only re-parses when the text actually changes, so unrelated re-renders
// (e.g. typing in the chat input) don't re-run the markdown parser for every message.
function MarkdownBase({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-[13px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-[#332151]">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          h1: ({ children }) => <h3 className="font-bold text-[#332151] text-sm">{children}</h3>,
          h2: ({ children }) => <h4 className="font-bold text-[#332151] text-sm">{children}</h4>,
          h3: ({ children }) => <h5 className="font-bold text-[#332151] text-[13px]">{children}</h5>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-[#E34F2D] font-semibold underline">
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px] text-[#332151]">{children}</code>
          ),
        }}
      >
        {normalizeLlmMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}

const Markdown = memo(MarkdownBase);
export default Markdown;
