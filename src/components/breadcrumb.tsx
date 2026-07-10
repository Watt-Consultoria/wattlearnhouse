import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const previous = items.length > 1 ? items[items.length - 2] : undefined;
  const current = items[items.length - 1];

  return (
    <nav aria-label="Trilha de navegação" className={cn("min-w-0", className)}>
      <ol className="hidden min-w-0 flex-wrap items-center gap-1 text-sm text-muted-foreground md:flex">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-border" />}
              {item.href && !isLast ? (
                <Link href={item.href} className="truncate transition-colors hover:text-brand-navy">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn("truncate", isLast && "font-medium text-foreground")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex min-w-0 items-center gap-2 md:hidden">
        {previous?.href ? (
          <Link
            href={previous.href}
            className="flex min-h-11 shrink-0 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4 shrink-0" />
            Voltar
          </Link>
        ) : null}
        <span className="truncate text-sm font-medium text-foreground">
          {current.label}
        </span>
      </div>
    </nav>
  );
}
