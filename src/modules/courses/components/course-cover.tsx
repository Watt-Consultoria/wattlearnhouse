"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { initials } from "../format";

export function CourseCover({
  title,
  coverImageUrl,
  className,
  children,
}: {
  title: string;
  coverImageUrl: string | null;
  className?: string;
  children?: ReactNode;
}) {
  const [errored, setErrored] = useState(false);
  const showFallback = !coverImageUrl || errored;

  return (
    <div
      className={cn(
        "group/cover relative aspect-video w-full overflow-hidden rounded-t-xl bg-brand-navy",
        className,
      )}
    >
      {showFallback ? (
        <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-white/25">
          {initials(title)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary teacher-supplied URLs, not restricted to next.config.ts remotePatterns
        <img
          src={coverImageUrl}
          alt={title}
          className="absolute inset-0 size-full object-cover opacity-70 transition-transform duration-500 group-hover/cover:scale-105"
          onError={() => setErrored(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent" />
      {children}
    </div>
  );
}
