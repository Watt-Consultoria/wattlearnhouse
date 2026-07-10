import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  size = "md",
  className,
}: {
  value: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const roundedValue = Math.round(value);
  const indicatorColor =
    roundedValue === 100 ? "bg-emerald-500" : roundedValue > 0 ? "bg-brand-gold" : "bg-border";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span
            className={cn(
              "font-mono font-medium tabular-nums",
              roundedValue === 100 && "text-emerald-600",
            )}
          >
            {roundedValue}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={roundedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progresso"}
        className={cn(
          "w-full overflow-hidden rounded-full bg-secondary",
          size === "sm" ? "h-1" : "h-1.5",
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", indicatorColor)}
          style={{ width: `${roundedValue}%` }}
        />
      </div>
    </div>
  );
}
