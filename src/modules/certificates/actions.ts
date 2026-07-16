"use server";

import prisma from "@/infra/database";
import authService from "@/modules/auth/auth.service";
import authoringService from "@/modules/courses/authoring.service";
import { isValidCpf } from "./cpf";
import certificatesService from "./certificates.service";

export type SaveCertificateProfileResult = { ok: true } | { ok: false; error: string };

export async function saveCertificateProfile(
  fullName: string,
  cpf: string,
): Promise<SaveCertificateProfileResult> {
  const user = await authService.getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sessão inválida." };
  }

  const trimmedName = fullName.trim();
  if (trimmedName.length < 3) {
    return { ok: false, error: "Informe o nome completo." };
  }

  if (!isValidCpf(cpf)) {
    return { ok: false, error: "CPF inválido." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { fullName: trimmedName, cpf: cpf.replace(/\D/g, "") },
  });

  return { ok: true };
}

export type IssueCertificateResult =
  | { ok: true; verificationCode: string }
  | { ok: false; error: string; needsProfile?: boolean };

export async function issueCourseCertificate(
  courseId: string,
): Promise<IssueCertificateResult> {
  const user = await authService.getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sessão inválida." };
  }

  if (!user.fullName || !user.cpf) {
    return { ok: false, error: "Preencha nome completo e CPF antes de emitir.", needsProfile: true };
  }

  const complete = await certificatesService.isCourseComplete(courseId, user.id);
  if (!complete) {
    return { ok: false, error: "Este curso ainda não foi totalmente concluído." };
  }

  const certificate = await certificatesService.issueCertificate(courseId, user.id);
  if (!certificate) {
    return { ok: false, error: "Não foi possível emitir o certificado." };
  }

  return { ok: true, verificationCode: certificate.verificationCode };
}

export async function issueAuthorshipCertificate(
  courseId: string,
): Promise<IssueCertificateResult> {
  const user = await authService.getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sessão inválida." };
  }

  if (!user.fullName || !user.cpf) {
    return { ok: false, error: "Preencha nome completo e CPF antes de emitir.", needsProfile: true };
  }

  const teacherId = await authoringService.getCourseTeacherId(courseId);
  if (teacherId !== user.id) {
    return { ok: false, error: "Você não é o professor responsável por este curso." };
  }

  const certificate = await certificatesService.issueAuthorshipCertificate(courseId, user.id);
  if (!certificate) {
    return { ok: false, error: "Não foi possível emitir o certificado." };
  }

  return { ok: true, verificationCode: certificate.verificationCode };
}
