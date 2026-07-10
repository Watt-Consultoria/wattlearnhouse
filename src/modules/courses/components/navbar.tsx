"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth/auth.context";
import { Logomark } from "@/components/logomark";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function Navbar() {
  const user = useAuth();
  const pathname = usePathname();
  const onCourses = pathname?.startsWith("/courses") ?? false;
  const onTeacher = pathname?.startsWith("/teacher") ?? false;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/courses" className="group flex min-h-11 items-center gap-2.5">
          <Logomark className="size-7 text-sm" />
          <span className="truncate font-heading text-[15px] font-bold tracking-tight text-foreground">
            WattLearn<span className="text-brand-gold">House</span>
          </span>
        </Link>

        <nav className="flex min-h-11 items-center gap-1">
          <Link
            href="/courses"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              onCourses
                ? "bg-secondary text-brand-navy"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            Cursos
          </Link>

          {user?.role === "teacher" && (
            <Link
              href="/teacher/courses"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                onTeacher
                  ? "bg-secondary text-brand-navy"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Meus Cursos
            </Link>
          )}

          {user && (
            <>
              <div className="mx-1.5 h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="size-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                    {initials(user.name)}
                  </span>
                )}
                <span className="hidden max-w-40 truncate text-sm font-medium text-foreground sm:inline">
                  {user.name}
                </span>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
