"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/infra/database";
import authService from "@/modules/auth/auth.service";
import type { User } from "@/generated/prisma/client";
import authoringService from "./authoring.service";
import { isCourseCategory } from "./categories";

export type AuthoringActionResult = { ok: true } | { ok: false; error: string };
export type CreateCourseResult = { ok: true; courseId: string } | { ok: false; error: string };
export type CreateLessonResult = { ok: true; lessonId: string } | { ok: false; error: string };
export type CreateQuizResult = { ok: true; quizId: string } | { ok: false; error: string };
export type CreateQuizQuestionResult =
  | { ok: true; questionId: string }
  | { ok: false; error: string };

export type QuizQuestionInput = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const ACCESS_DENIED_ERROR = "Acesso negado.";
type ReorderDirection = "up" | "down";

async function requireTeacher() {
  const user = await authService.getCurrentUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    return null;
  }
  return user;
}

/** Admin edita qualquer curso; teacher só o que possui (ver platform-admin). */
async function requireCourseOwnership(courseId: string, user: User): Promise<boolean> {
  if (user.role === "admin") {
    return true;
  }
  const ownerId = await authoringService.getCourseTeacherId(courseId);
  return ownerId === user.id;
}

async function requireModuleOwnership(moduleId: string, user: User) {
  const ownership = await authoringService.resolveModuleOwnership(moduleId);
  if (!ownership || (user.role !== "admin" && ownership.teacherId !== user.id)) {
    return null;
  }
  return ownership;
}

async function requireLessonOwnership(lessonId: string, user: User) {
  const ownership = await authoringService.resolveLessonOwnership(lessonId);
  if (!ownership || (user.role !== "admin" && ownership.teacherId !== user.id)) {
    return null;
  }
  return ownership;
}

async function requireQuizOwnership(quizId: string, user: User) {
  const ownership = await authoringService.resolveQuizOwnership(quizId);
  if (!ownership || (user.role !== "admin" && ownership.teacherId !== user.id)) {
    return null;
  }
  return ownership;
}

async function requireQuizQuestionOwnership(questionId: string, user: User) {
  const ownership = await authoringService.resolveQuizQuestionOwnership(questionId);
  if (!ownership || (user.role !== "admin" && ownership.teacherId !== user.id)) {
    return null;
  }
  return ownership;
}

export type CourseInput = {
  title: string;
  description: string;
  category: string;
  coverImageUrl: string;
};

export async function createCourse(input: CourseInput): Promise<CreateCourseResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  if (!input.title.trim() || !input.category.trim()) {
    return { ok: false, error: "Título e categoria são obrigatórios." };
  }
  if (!isCourseCategory(input.category)) {
    return { ok: false, error: "Categoria inválida." };
  }

  const course = await prisma.course.create({
    data: {
      teacherId: user.id,
      title: input.title.trim(),
      description: input.description.trim() || null,
      category: input.category.trim(),
      coverImageUrl: input.coverImageUrl.trim() || null,
    },
  });

  revalidatePath("/teacher/courses");
  return { ok: true, courseId: course.id };
}

export async function updateCourse(
  courseId: string,
  input: CourseInput,
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  if (!(await requireCourseOwnership(courseId, user))) {
    return { ok: false, error: "Você não tem permissão para editar este curso." };
  }
  if (!input.title.trim() || !input.category.trim()) {
    return { ok: false, error: "Título e categoria são obrigatórios." };
  }
  if (!isCourseCategory(input.category)) {
    return { ok: false, error: "Categoria inválida." };
  }

  await prisma.course.update({
    where: { id: courseId },
    data: {
      title: input.title.trim(),
      description: input.description.trim() || null,
      category: input.category.trim(),
      coverImageUrl: input.coverImageUrl.trim() || null,
    },
  });

  revalidatePath("/teacher/courses");
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}

export async function deleteCourse(courseId: string): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  if (!(await requireCourseOwnership(courseId, user))) {
    return { ok: false, error: "Você não tem permissão para excluir este curso." };
  }

  await prisma.course.delete({ where: { id: courseId } });

  revalidatePath("/teacher/courses");
  revalidatePath("/courses");
  return { ok: true };
}

export async function createModule(
  courseId: string,
  title: string,
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  if (!(await requireCourseOwnership(courseId, user))) {
    return { ok: false, error: "Você não tem permissão para editar este curso." };
  }
  if (!title.trim()) {
    return { ok: false, error: "Título do módulo é obrigatório." };
  }

  const lastModule = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await prisma.module.create({
    data: { courseId, title: title.trim(), order: (lastModule?.order ?? 0) + 1 },
  });

  revalidatePath(`/teacher/courses/${courseId}`);
  return { ok: true };
}

export async function updateModule(
  moduleId: string,
  title: string,
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireModuleOwnership(moduleId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para editar este módulo." };
  }
  if (!title.trim()) {
    return { ok: false, error: "Título do módulo é obrigatório." };
  }

  await prisma.module.update({ where: { id: moduleId }, data: { title: title.trim() } });

  revalidatePath(`/teacher/courses/${ownership.courseId}`);
  return { ok: true };
}

export async function deleteModule(moduleId: string): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireModuleOwnership(moduleId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para excluir este módulo." };
  }

  await prisma.module.delete({ where: { id: moduleId } });

  revalidatePath(`/teacher/courses/${ownership.courseId}`);
  revalidatePath(`/courses/${ownership.courseId}`);
  return { ok: true };
}

export async function reorderModule(
  moduleId: string,
  direction: ReorderDirection,
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireModuleOwnership(moduleId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para reordenar este módulo." };
  }

  const current = await prisma.module.findUniqueOrThrow({
    where: { id: moduleId },
    select: { order: true },
  });
  const targetOrder = direction === "up" ? current.order - 1 : current.order + 1;
  const sibling = await prisma.module.findFirst({
    where: { courseId: ownership.courseId, order: targetOrder },
  });
  if (!sibling) {
    return { ok: false, error: "Não há módulo adjacente para trocar de posição." };
  }

  await prisma.$transaction([
    prisma.module.update({ where: { id: moduleId }, data: { order: sibling.order } }),
    prisma.module.update({ where: { id: sibling.id }, data: { order: current.order } }),
  ]);

  revalidatePath(`/teacher/courses/${ownership.courseId}`);
  return { ok: true };
}

export async function createLesson(
  moduleId: string,
  input: { title: string; content: string },
): Promise<CreateLessonResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireModuleOwnership(moduleId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para editar este módulo." };
  }
  if (!input.title.trim() || !input.content.trim()) {
    return { ok: false, error: "Título e conteúdo são obrigatórios." };
  }

  const lastLesson = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title: input.title.trim(),
      content: input.content,
      order: (lastLesson?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${moduleId}`);
  revalidatePath(`/courses/${ownership.courseId}`);
  return { ok: true, lessonId: lesson.id };
}

export async function updateLesson(
  lessonId: string,
  input: { title: string; content: string },
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireLessonOwnership(lessonId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para editar esta aula." };
  }
  if (!input.title.trim() || !input.content.trim()) {
    return { ok: false, error: "Título e conteúdo são obrigatórios." };
  }

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { title: input.title.trim(), content: input.content },
  });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  revalidatePath(
    `/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}/lessons/${lessonId}`,
  );
  revalidatePath(`/courses/${ownership.courseId}`);
  return { ok: true };
}

export async function deleteLesson(lessonId: string): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireLessonOwnership(lessonId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para excluir esta aula." };
  }

  await prisma.lesson.delete({ where: { id: lessonId } });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  revalidatePath(`/courses/${ownership.courseId}`);
  return { ok: true };
}

export async function reorderLesson(
  lessonId: string,
  direction: ReorderDirection,
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireLessonOwnership(lessonId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para reordenar esta aula." };
  }

  const current = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    select: { order: true },
  });
  const targetOrder = direction === "up" ? current.order - 1 : current.order + 1;
  const sibling = await prisma.lesson.findFirst({
    where: { moduleId: ownership.moduleId, order: targetOrder },
  });
  if (!sibling) {
    return { ok: false, error: "Não há aula adjacente para trocar de posição." };
  }

  await prisma.$transaction([
    prisma.lesson.update({ where: { id: lessonId }, data: { order: sibling.order } }),
    prisma.lesson.update({ where: { id: sibling.id }, data: { order: current.order } }),
  ]);

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  return { ok: true };
}

function validateQuizQuestionInput(input: QuizQuestionInput): string | null {
  if (!input.question.trim()) {
    return "O enunciado da pergunta é obrigatório.";
  }
  const options = input.options.map((option) => option.trim());
  if (options.length < 2) {
    return "A pergunta precisa de ao menos 2 alternativas.";
  }
  if (options.some((option) => !option)) {
    return "Todas as alternativas precisam de um texto.";
  }
  if (!Number.isInteger(input.correctIndex) || input.correctIndex < 0 || input.correctIndex >= options.length) {
    return "Selecione qual alternativa é a correta.";
  }
  if (!input.explanation.trim()) {
    return "A explicação da resposta é obrigatória.";
  }
  return null;
}

export async function createQuiz(moduleId: string): Promise<CreateQuizResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireModuleOwnership(moduleId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para editar este módulo." };
  }

  const existing = await prisma.quiz.findUnique({ where: { moduleId }, select: { id: true } });
  if (existing) {
    return { ok: false, error: "Este módulo já possui um quiz." };
  }

  const quiz = await prisma.quiz.create({ data: { moduleId } });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${moduleId}`);
  return { ok: true, quizId: quiz.id };
}

export async function deleteQuiz(quizId: string): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireQuizOwnership(quizId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para excluir este quiz." };
  }

  await prisma.quiz.delete({ where: { id: quizId } });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  revalidatePath(`/courses/${ownership.courseId}`);
  return { ok: true };
}

export async function createQuizQuestion(
  quizId: string,
  input: QuizQuestionInput,
): Promise<CreateQuizQuestionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireQuizOwnership(quizId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para editar este quiz." };
  }
  const validationError = validateQuizQuestionInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const lastQuestion = await prisma.quizQuestion.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const question = await prisma.quizQuestion.create({
    data: {
      quizId,
      question: input.question.trim(),
      options: input.options.map((option) => option.trim()),
      correctIndex: input.correctIndex,
      explanation: input.explanation.trim(),
      order: (lastQuestion?.order ?? 0) + 1,
    },
  });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  return { ok: true, questionId: question.id };
}

export async function updateQuizQuestion(
  questionId: string,
  input: QuizQuestionInput,
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireQuizQuestionOwnership(questionId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para editar esta pergunta." };
  }
  const validationError = validateQuizQuestionInput(input);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  await prisma.quizQuestion.update({
    where: { id: questionId },
    data: {
      question: input.question.trim(),
      options: input.options.map((option) => option.trim()),
      correctIndex: input.correctIndex,
      explanation: input.explanation.trim(),
    },
  });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  return { ok: true };
}

export async function deleteQuizQuestion(questionId: string): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireQuizQuestionOwnership(questionId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para excluir esta pergunta." };
  }

  await prisma.quizQuestion.delete({ where: { id: questionId } });

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  return { ok: true };
}

export async function reorderQuizQuestion(
  questionId: string,
  direction: ReorderDirection,
): Promise<AuthoringActionResult> {
  const user = await requireTeacher();
  if (!user) {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }
  const ownership = await requireQuizQuestionOwnership(questionId, user);
  if (!ownership) {
    return { ok: false, error: "Você não tem permissão para reordenar esta pergunta." };
  }

  const current = await prisma.quizQuestion.findUniqueOrThrow({
    where: { id: questionId },
    select: { order: true },
  });
  const targetOrder = direction === "up" ? current.order - 1 : current.order + 1;
  const sibling = await prisma.quizQuestion.findFirst({
    where: { quizId: ownership.quizId, order: targetOrder },
  });
  if (!sibling) {
    return { ok: false, error: "Não há pergunta adjacente para trocar de posição." };
  }

  await prisma.$transaction([
    prisma.quizQuestion.update({ where: { id: questionId }, data: { order: sibling.order } }),
    prisma.quizQuestion.update({ where: { id: sibling.id }, data: { order: current.order } }),
  ]);

  revalidatePath(`/teacher/courses/${ownership.courseId}/modules/${ownership.moduleId}`);
  return { ok: true };
}
