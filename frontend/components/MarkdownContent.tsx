import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import { normalizeScientificMarkdown, stripPaperEvidenceAnnotations } from "../lib/scientificMarkdown";
import { MermaidBlock } from "./MermaidBlock";

type MarkdownContentProps = {
  content: string;
  inline?: boolean;
  hideEvidenceAnnotations?: boolean;
};

function safeMarkdownUrl(url: string): string {
  const value = url.trim();
  if (!value || value.startsWith("//")) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (
    value.startsWith("#") ||
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    !/^[a-z][a-z\d+.-]*:/i.test(value)
  ) {
    return value;
  }
  return "";
}

function isExternalHttpLink(href?: string): boolean {
  return typeof href === "string" && /^https?:\/\//i.test(href);
}

export function MarkdownContent({ content, inline = false, hideEvidenceAnnotations = false }: MarkdownContentProps) {
  if (!content.trim()) {
    return <p className="muted">暂无内容。</p>;
  }

  const markdown = (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, {
          strict: false,
          trust: false,
          throwOnError: false
        }]]}
        urlTransform={safeMarkdownUrl}
        components={{
          ...(inline ? { p: ({ children }) => <>{children}</> } : {}),
          a: ({ children, href, ...props }) => {
            const external = isExternalHttpLink(href);
            return (
              <a
                {...props}
                href={href || undefined}
                rel={external ? "noreferrer noopener" : undefined}
                target={external ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
          img: ({ alt }) => (
            <span className="markdown-image-blocked" role="note">
              {alt ? `图片已隐藏：${alt}` : "图片已隐藏。"}
            </span>
          ),
          code: ({ className, children, ...props }) => {
            if (typeof className === "string" && className.includes("language-mermaid")) {
              return <MermaidBlock code={String(children).replace(/\n$/, "")} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            const child = React.Children.toArray(children)[0] as
              | React.ReactElement<{ className?: string }>
              | undefined;
            if (
              child &&
              typeof child.props?.className === "string" &&
              child.props.className.includes("language-mermaid")
            ) {
              return <>{child}</>;
            }
            return <pre>{children}</pre>;
          },
        }}
      >
        {normalizeScientificMarkdown(hideEvidenceAnnotations ? stripPaperEvidenceAnnotations(content) : content)}
      </ReactMarkdown>
  );

  if (inline) {
    return <span className="markdown-content markdown-inline">{markdown}</span>;
  }

  return (
    <div className="markdown-content">
      {markdown}
    </div>
  );
}
