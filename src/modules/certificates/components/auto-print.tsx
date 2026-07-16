"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Dispara o diálogo de impressão/salvar-como-PDF uma única vez, logo após a emissão. */
export function AutoPrint() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    window.print();
    // Remove o `?print=1` da URL para que voltar/atualizar a página não reabra o diálogo.
    router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deve disparar só uma vez, no mount
  }, []);

  return null;
}
