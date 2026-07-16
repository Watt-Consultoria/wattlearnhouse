import crypto from "node:crypto";
import prisma from "@/infra/database";
import type { CertificateKind } from "@/generated/prisma/client";
import { computeModulesProgress } from "@/modules/courses/progress";
import authoringService from "@/modules/courses/authoring.service";

// Sem caracteres ambíguos (0/O, 1/I/L) para facilitar digitação manual.
const VERIFICATION_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const VERIFICATION_CODE_LENGTH = 10;

export type ModuleSnapshot = {
  title: string;
  lessons: { title: string }[];
};

class CertificatesService {
  async isCourseComplete(courseId: string, userId: string): Promise<boolean> {
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: {
        id: true,
        lessons: { select: { id: true } },
        quiz: { select: { id: true } },
      },
    });
    if (modules.length === 0) {
      return false;
    }

    const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    const quizIds = modules.map((m) => m.quiz?.id).filter((id): id is string => !!id);

    const [completedLessons, passedAttempts] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds } },
        select: { lessonId: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId, quizId: { in: quizIds }, passed: true },
        select: { quizId: true },
      }),
    ]);

    const completedLessonIds = new Set(completedLessons.map((l) => l.lessonId));
    const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));

    const progress = computeModulesProgress(
      modules.map((m) => ({
        id: m.id,
        lessonIds: m.lessons.map((l) => l.id),
        quizId: m.quiz?.id ?? null,
      })),
      completedLessonIds,
      passedQuizIds,
    );

    return progress.every((m) => m.complete);
  }

  async isCourseOwner(courseId: string, userId: string): Promise<boolean> {
    const teacherId = await authoringService.getCourseTeacherId(courseId);
    return teacherId === userId;
  }

  async getCertificateForUserCourse(
    courseId: string,
    userId: string,
    kind: CertificateKind = "student_completion",
  ) {
    return prisma.certificate.findUnique({
      where: { userId_courseId_kind: { userId, courseId, kind } },
    });
  }

  async getCertificateByVerificationCode(code: string) {
    return prisma.certificate.findUnique({
      where: { verificationCode: code.trim().toUpperCase() },
    });
  }

  async issueCertificate(courseId: string, userId: string) {
    const existing = await this.getCertificateForUserCourse(
      courseId,
      userId,
      "student_completion",
    );
    if (existing) {
      return existing;
    }

    const [user, course, complete] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      this.findCourseWithCurriculum(courseId),
      this.isCourseComplete(courseId, userId),
    ]);

    if (!user?.fullName || !user?.cpf || !course || !complete) {
      return null;
    }

    return this.upsertCertificate({
      userId,
      courseId,
      kind: "student_completion",
      fullName: user.fullName,
      cpf: user.cpf,
      course,
    });
  }

  /** Certificado emitido para o professor dono do curso, atestando autoria/instrução — não exige conclusão. */
  async issueAuthorshipCertificate(courseId: string, userId: string) {
    const existing = await this.getCertificateForUserCourse(
      courseId,
      userId,
      "teacher_authorship",
    );
    if (existing) {
      return existing;
    }

    const [user, course, isOwner] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      this.findCourseWithCurriculum(courseId),
      this.isCourseOwner(courseId, userId),
    ]);

    if (!user?.fullName || !user?.cpf || !course || !isOwner) {
      return null;
    }

    return this.upsertCertificate({
      userId,
      courseId,
      kind: "teacher_authorship",
      fullName: user.fullName,
      cpf: user.cpf,
      course,
    });
  }

  private async findCourseWithCurriculum(courseId: string) {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" }, select: { title: true } } },
        },
      },
    });
  }

  private async upsertCertificate(input: {
    userId: string;
    courseId: string;
    kind: CertificateKind;
    fullName: string;
    cpf: string;
    course: { title: string; modules: { title: string; lessons: { title: string }[] }[] };
  }) {
    const { userId, courseId, kind, fullName, cpf, course } = input;

    const modulesSnapshot: ModuleSnapshot[] = course.modules.map((courseModule) => ({
      title: courseModule.title,
      lessons: courseModule.lessons.map((lesson) => ({ title: lesson.title })),
    }));

    const verificationCode = await this.generateUniqueVerificationCode();

    // upsert em vez de create: sob corrida, duas emissões concorrentes convergem
    // para o mesmo registro (mesma garantia de idempotência usada por enroll()).
    return prisma.certificate.upsert({
      where: { userId_courseId_kind: { userId, courseId, kind } },
      update: {},
      create: {
        userId,
        courseId,
        kind,
        verificationCode,
        fullNameSnapshot: fullName,
        cpfSnapshot: cpf,
        courseTitleSnapshot: course.title,
        modulesSnapshot,
      },
    });
  }

  private generateVerificationCode(): string {
    const bytes = crypto.randomBytes(VERIFICATION_CODE_LENGTH);
    let code = "";
    for (let i = 0; i < VERIFICATION_CODE_LENGTH; i++) {
      code += VERIFICATION_CODE_ALPHABET[bytes[i] % VERIFICATION_CODE_ALPHABET.length];
    }
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 10)}`;
  }

  private async generateUniqueVerificationCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.generateVerificationCode();
      const existing = await prisma.certificate.findUnique({
        where: { verificationCode: code },
        select: { id: true },
      });
      if (!existing) {
        return code;
      }
    }
    throw new Error("Não foi possível gerar um código de verificação único.");
  }
}

const certificatesService = new CertificatesService();

export default certificatesService;
