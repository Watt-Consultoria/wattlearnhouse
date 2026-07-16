"use client";

import { useState, useTransition } from "react";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCpf } from "@/modules/certificates/cpf";
import { saveCertificateProfile, type IssueCertificateResult } from "@/modules/certificates/actions";

/** Diálogo de nome completo/CPF reaproveitado por qualquer fluxo de emissão de certificado. */
export function CertificateProfileDialog({
  open,
  onOpenChange,
  onIssue,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssue: () => Promise<IssueCertificateResult>;
  onSuccess: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const profileResult = await saveCertificateProfile(fullName, cpf);
      if (!profileResult.ok) {
        setError(profileResult.error);
        return;
      }

      const issueResult = await onIssue();
      if (issueResult.ok) {
        onOpenChange(false);
        onSuccess();
        return;
      }
      setError(issueResult.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-secondary text-brand-navy">
            <GraduationCap className="size-5" />
          </div>
          <DialogTitle>Dados para o certificado</DialogTitle>
          <DialogDescription>
            Seu nome completo e CPF vão constar no certificado. Esses dados ficam salvos no
            seu perfil para as próximas emissões.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="certificate-full-name">Nome completo</Label>
            <Input
              id="certificate-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Maria da Silva Santos"
              autoComplete="name"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="certificate-cpf">CPF</Label>
            <Input
              id="certificate-cpf"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              maxLength={14}
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" variant="accent" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Emitindo..." : "Salvar e emitir certificado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
