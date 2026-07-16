import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import authService from "@/modules/auth/auth.service";
import certificatesService, {
  type ModuleSnapshot,
} from "@/modules/certificates/certificates.service";
import { formatCpf } from "@/modules/certificates/cpf";
import { ISSUER_NAME, ISSUER_CNPJ } from "@/modules/certificates/issuer";
import { IssuerHeader } from "@/modules/certificates/components/issuer-header";
import { PrintButton } from "@/modules/certificates/components/print-button";
import { AutoPrint } from "@/modules/certificates/components/auto-print";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { FormattedDate } from "@/components/formatted-date";

export default async function CourseCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { courseId } = await params;
  const { print } = await searchParams;
  // Escopado sempre ao usuário da sessão — não há como visitar o certificado
  // de outra pessoa apenas trocando o courseId na URL.
  const certificate = await certificatesService.getCertificateForUserCourse(
    courseId,
    user.id,
  );
  if (!certificate) {
    notFound();
  }

  const modules = certificate.modulesSnapshot as unknown as ModuleSnapshot[];
  const verifyUrl = `${process.env.BASE_URL}/certificates/verify/${certificate.verificationCode}`;

  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      {print === "1" && <AutoPrint />}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6 print:max-w-none print:px-12 print:py-10">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Breadcrumb
            items={[
              { label: "Cursos", href: "/courses" },
              {
                label: certificate.courseTitleSnapshot,
                href: `/courses/${courseId}`,
              },
              { label: "Certificado" },
            ]}
          />
          <PrintButton />
        </div>

        <div className="rounded-2xl border-2 border-brand-navy/15 bg-card p-8 shadow-sm sm:p-12 print:border-0 print:shadow-none">
          <IssuerHeader />

          <p className="text-center text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Certificado de conclusão de curso
          </p>

          <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
            A <strong>{ISSUER_NAME}</strong>, empresa devidamente inscrita sob o
            CNPJ {ISSUER_CNPJ}, certifica, para os devidos fins, que
          </p>
          <h1 className="mt-2 text-center font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
            {certificate.fullNameSnapshot}
          </h1>
          <p className="mt-1 text-center font-mono text-sm text-muted-foreground">
            portador(a) do CPF nº {formatCpf(certificate.cpfSnapshot)}
          </p>

          <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
            concluiu integralmente, com aproveitamento em todos os módulos e
            aulas, o curso
          </p>
          <p className="mt-1 text-center font-heading text-xl font-bold text-brand-navy">
            {certificate.courseTitleSnapshot}
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            conforme conteúdo programático relacionado a seguir, em{" "}
            <FormattedDate value={certificate.issuedAt.toISOString()} />.
          </p>

          <div className="mt-10 border-t border-border pt-6">
            <h2 className="mb-3 font-heading text-sm font-bold text-foreground">
              Conteúdo programático concluído
            </h2>
            <ol className="flex flex-col gap-3">
              {modules.map((courseModule, index) => (
                <li key={`${courseModule.title}-${index}`}>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {String(index + 1).padStart(2, "0")}. {courseModule.title}
                  </p>
                  <ul className="mt-1 ml-6 list-disc text-sm text-muted-foreground">
                    {courseModule.lessons.map((lesson, lessonIndex) => (
                      <li key={`${lesson.title}-${lessonIndex}`}>
                        {lesson.title}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10 flex flex-col items-center gap-1 border-t border-border pt-6 text-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Código de verificação
            </div>
            <p className="font-mono text-sm font-semibold text-foreground">
              {certificate.verificationCode}
            </p>
            <p className="text-xs text-muted-foreground">
              Autenticidade verificável em{" "}
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground"
              >
                {verifyUrl}
              </a>
            </p>
            <p className="mt-3 max-w-md text-[11px] leading-relaxed text-muted-foreground">
              Documento emitido eletronicamente por {ISSUER_NAME}, CNPJ{" "}
              {ISSUER_CNPJ}, através da plataforma WattLearnHouse.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
