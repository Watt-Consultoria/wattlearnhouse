import { ShieldCheck, ShieldX } from "lucide-react";
import certificatesService, { type ModuleSnapshot } from "@/modules/certificates/certificates.service";
import { maskCpf } from "@/modules/certificates/cpf";
import { ISSUER_NAME, ISSUER_CNPJ } from "@/modules/certificates/issuer";
import { IssuerHeader } from "@/modules/certificates/components/issuer-header";
import { VerifyHeader } from "@/modules/certificates/components/verify-header";
import { VerifyCodeForm } from "@/modules/certificates/components/verify-code-form";
import { FormattedDate } from "@/components/formatted-date";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const certificate = await certificatesService.getCertificateByVerificationCode(code);

  return (
    <>
      <VerifyHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
        {!certificate ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-10 text-center">
            <ShieldX className="mb-3 size-10 text-destructive" />
            <h1 className="mb-1 font-heading text-lg font-bold text-foreground">
              Código não encontrado
            </h1>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Não encontramos nenhum certificado com o código{" "}
              <span className="font-mono">{code}</span>. Confira se ele foi digitado
              corretamente.
            </p>
            <div className="w-full max-w-sm">
              <VerifyCodeForm />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <ShieldCheck className="mb-2 size-8 text-emerald-600" />
              <p className="font-heading text-base font-bold text-emerald-800">
                Certificado autêntico
              </p>
              <p className="text-sm text-emerald-700">
                Código {certificate.verificationCode}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <IssuerHeader className="mb-6 flex flex-col items-center text-center" />

              <p className="text-sm text-muted-foreground">
                {ISSUER_NAME} certifica, para os devidos fins, que
              </p>
              <h1 className="mt-1 font-heading text-xl font-extrabold text-foreground sm:text-2xl">
                {certificate.fullNameSnapshot}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                portador(a) do CPF {maskCpf(certificate.cpfSnapshot)}
              </p>

              <p className="mt-4 text-sm text-muted-foreground">
                {certificate.kind === "teacher_authorship"
                  ? "foi responsável pela criação, pela ministração e pela redação do conteúdo das aulas do curso"
                  : "concluiu integralmente, com aproveitamento em todos os módulos e aulas, o curso"}
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-brand-navy">
                {certificate.courseTitleSnapshot}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                em <FormattedDate value={certificate.issuedAt.toISOString()} />
              </p>

              <div className="mt-6 border-t border-border pt-5">
                <h2 className="mb-3 font-heading text-sm font-bold text-foreground">
                  {certificate.kind === "teacher_authorship"
                    ? "Conteúdo programático de autoria"
                    : "Conteúdo programático concluído"}
                </h2>
                <ol className="flex flex-col gap-3">
                  {(certificate.modulesSnapshot as unknown as ModuleSnapshot[]).map(
                    (courseModule, index) => (
                      <li key={`${courseModule.title}-${index}`}>
                        <p className="font-heading text-sm font-semibold text-foreground">
                          {String(index + 1).padStart(2, "0")}. {courseModule.title}
                        </p>
                        <ul className="mt-1 ml-6 list-disc text-sm text-muted-foreground">
                          {courseModule.lessons.map((lesson, lessonIndex) => (
                            <li key={`${lesson.title}-${lessonIndex}`}>{lesson.title}</li>
                          ))}
                        </ul>
                      </li>
                    ),
                  )}
                </ol>
              </div>

              <p className="mt-6 border-t border-border pt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
                Documento emitido eletronicamente por {ISSUER_NAME}, CNPJ {ISSUER_CNPJ}, através
                da plataforma WattLearnHouse.
              </p>
            </div>

            <div className="max-w-sm self-center">
              <VerifyCodeForm />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
