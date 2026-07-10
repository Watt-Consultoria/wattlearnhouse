import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";

function isYoutubeMarker(children: ReactNode): boolean {
  if (typeof children === "string") {
    return children === "youtube_video";
  }
  if (Array.isArray(children)) {
    return children.length === 1 && children[0] === "youtube_video";
  }
  return false;
}

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.replace("/embed/", "");
      }
    }
    return null;
  } catch {
    return null;
  }
}

const markdownComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mt-8 mb-3 font-heading text-2xl font-bold text-foreground first:mt-0", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-8 mb-3 font-heading text-xl font-bold text-foreground first:mt-0", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-6 mb-2 font-heading text-lg font-bold text-foreground first:mt-0", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("mb-4 leading-relaxed text-foreground", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "mb-4 list-disc space-y-1.5 pl-8 text-foreground marker:text-foreground [&>li]:pl-3",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "mb-4 list-decimal space-y-1.5 pl-8 text-foreground marker:text-foreground [&>li]:pl-3",
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="mb-4 overflow-x-auto rounded-xl border border-border">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => <thead className={cn("bg-muted", className)} {...props} />,
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border-b border-border px-4 py-2.5 text-left font-heading font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border-b border-border px-4 py-2.5 text-foreground last:border-0", className)} {...props} />
  ),
  code: ({ className, ...props }: ComponentPropsWithoutRef<"code">) => (
    <code
      className={cn(
        "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "mb-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm text-foreground",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn("mb-4 border-l-2 border-brand-gold pl-4 text-muted-foreground italic", className)}
      {...props}
    />
  ),
  img: ({ src, alt }) => {
    if (typeof src !== "string") return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        decoding="async"
        className="mx-auto my-4 block max-h-[32rem] w-auto max-w-full rounded-lg border border-border object-contain"
      />
    );
  },
  a: ({ href, children }) => {
    if (href && isYoutubeMarker(children)) {
      const videoId = extractYoutubeId(href);
      if (videoId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Vídeo incorporado da aula"
            className="my-4 aspect-video w-full rounded-lg border-0 bg-muted"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
};

export function LessonContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("text-sm sm:text-base", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
