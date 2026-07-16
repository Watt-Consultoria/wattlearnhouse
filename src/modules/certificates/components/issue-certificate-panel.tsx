"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { issueCourseCertificate } from "@/modules/certificates/actions";
import { CertificateProfileDialog } from "@/modules/certificates/components/certificate-profile-dialog";

export function IssueCertificatePanel({
  courseId,
  hasCertificate,
}: {
  courseId: string;
  hasCertificate: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (hasCertificate) {
    return (
      <Button
        variant="accent"
        size="lg"
        nativeButton={false}
        render={<Link href={`/courses/${courseId}/certificate`} />}
      >
        <FileCheck2 className="size-4" />
        Ver certificado
      </Button>
    );
  }

  function goToCertificate() {
    router.push(`/courses/${courseId}/certificate?print=1`);
  }

  function handleIssue() {
    setError(null);
    startTransition(async () => {
      const result = await issueCourseCertificate(courseId);
      if (result.ok) {
        goToCertificate();
        return;
      }
      if (result.needsProfile) {
        setDialogOpen(true);
        return;
      }
      setError(result.error);
    });
  }

  return (
    <>
      <div>
        <Button variant="accent" size="lg" onClick={handleIssue} disabled={isPending}>
          <Award className="size-4" />
          {isPending ? "Emitindo..." : "Emitir certificado"}
        </Button>
        {error && !dialogOpen && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </div>

      <CertificateProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onIssue={() => issueCourseCertificate(courseId)}
        onSuccess={goToCertificate}
      />
    </>
  );
}
