import Image from "next/image";
import { ISSUER_NAME, ISSUER_CNPJ } from "@/modules/certificates/issuer";

export function IssuerHeader({ className }: { className?: string }) {
  return (
    <div className={className ?? "mb-8 flex flex-col items-center text-center"}>
      <Image
        src="/icon-192.svg"
        alt={`Logo ${ISSUER_NAME}`}
        width={56}
        height={56}
        unoptimized
        className="mb-3"
      />
      <p className="font-heading text-lg font-bold tracking-tight text-foreground uppercase">
        {ISSUER_NAME}
      </p>
      <p className="text-xs text-muted-foreground">CNPJ {ISSUER_CNPJ}</p>
    </div>
  );
}
