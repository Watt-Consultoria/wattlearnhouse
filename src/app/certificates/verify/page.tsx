import { ShieldCheck } from "lucide-react";
import { VerifyHeader } from "@/modules/certificates/components/verify-header";
import { VerifyCodeForm } from "@/modules/certificates/components/verify-code-form";
import { IssuerHeader } from "@/modules/certificates/components/issuer-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyCertificateSearchPage() {
  return (
    <>
      <VerifyHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-14 sm:px-6 sm:py-20">
        <IssuerHeader />
        <p className="-mt-6 mb-10 text-center text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Portal de verificação de certificados
        </p>

        <Card className="w-full max-w-md border-0 shadow-lg ring-1 ring-border">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-secondary text-brand-navy">
              <ShieldCheck className="size-6" />
            </div>
            <CardTitle className="font-heading text-xl font-bold tracking-tight">
              Verificar certificado
            </CardTitle>
            <CardDescription>
              Informe o código de verificação impresso no certificado para confirmar sua
              autenticidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VerifyCodeForm />
          </CardContent>
        </Card>

        <p className="mt-8 max-w-sm text-center text-xs text-muted-foreground">
          O código de verificação está impresso na parte inferior de todo certificado
          emitido pela plataforma WattLearnHouse.
        </p>
      </main>
    </>
  );
}
