import Link from "next/link";
import { Logomark } from "@/components/logomark";

export function VerifyHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4 sm:px-6">
        <Link href="/certificates/verify" className="flex items-center gap-2.5">
          <Logomark className="size-7 text-sm" />
          <span className="truncate font-heading text-[15px] font-bold tracking-tight text-foreground">
            WattLearn<span className="text-brand-gold">House</span>
          </span>
        </Link>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          Verificação de certificado
        </span>
      </div>
    </header>
  );
}
