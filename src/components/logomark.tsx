import { cn } from "@/lib/utils";

export function Logomark({
  variant = "solid",
  className,
}: {
  variant?: "solid" | "translucent";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md font-heading font-extrabold",
        variant === "solid" ? "bg-brand-navy text-brand-gold" : "bg-white/10 text-brand-gold",
        className,
      )}
    >
      W
    </span>
  );
}
