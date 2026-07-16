"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, FileCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { issueAuthorshipCertificate } from "@/modules/certificates/actions";
import { CertificateProfileDialog } from "@/modules/certificates/components/certificate-profile-dialog";

export function IssueAuthorshipCertificatePanel({
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

  function goToCertificate() {
    router.push(`/teacher/courses/${courseId}/certificate?print=1`);
  }

  if (hasCertificate) {
    return (
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<Link href={`/teacher/courses/${courseId}/certificate`} />}
      >
        <FileCheck2 className="size-4" />
        Certificado de autoria
      </Button>
    );
  }

  function handleIssue() {
    setError(null);
    startTransition(async () => {
      const result = await issueAuthorshipCertificate(courseId);
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
      <div className="flex flex-col items-end gap-1">
        <Button variant="outline" size="sm" onClick={handleIssue} disabled={isPending}>
          <Award className="size-4" />
          {isPending ? "Emitindo..." : "Emitir certificado de autoria"}
        </Button>
        {error && !dialogOpen && (
          <p className="max-w-56 text-right text-xs text-destructive">{error}</p>
        )}
      </div>

      <CertificateProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onIssue={() => issueAuthorshipCertificate(courseId)}
        onSuccess={goToCertificate}
      />
    </>
  );
}
