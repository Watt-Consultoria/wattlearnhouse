"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyCodeForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) {
      router.push(`/certificates/verify/${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código de verificação (ex: WLXX-XXXX-XX)"
        className="flex-1 font-mono uppercase"
        required
      />
      <Button type="submit" className="min-h-11 shrink-0">
        <Search className="size-4" />
        Consultar
      </Button>
    </form>
  );
}
