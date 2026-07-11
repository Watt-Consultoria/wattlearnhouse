"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/infra/database";
import authService from "@/modules/auth/auth.service";
import quizService from "@/modules/quiz/quiz.service";
import coursesService from "./courses.service";

export type EnrollResult = { ok: true } | { ok: false; error: string };

export async function enrollInCourse(courseId: string): Promise<EnrollResult> {
  const user = await authService.getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sessão inválida." };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });
  if (!course) {
    return { ok: false, error: "Curso não encontrado." };
  }

  await coursesService.enroll(courseId, user.id);

  revalidatePath(`/courses/${courseId}`);
  return { ok: true };
}

export type CompleteLessonResult = { ok: true } | { ok: false; error: string };

export async function completeLesson(lessonId: string): Promise<CompleteLessonResult> {
  const user = await authService.getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sessão inválida." };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true, module: { select: { courseId: true } } },
  });
  if (!lesson) {
    return { ok: false, error: "Aula não encontrada." };
  }

  const unlocked = await coursesService.isModuleUnlockedForUser(lesson.moduleId, user.id);
  if (!unlocked) {
    return { ok: false, error: "Este módulo ainda está bloqueado." };
  }

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: {},
    create: { userId: user.id, lessonId },
  });

  revalidatePath(`/courses/${lesson.module.courseId}`);

  return { ok: true };
}

export type QuizAnswerInput = { questionId: string; selectedIndex: number };

export type QuizAttemptReview = {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  selectedIndex: number | null;
};

export type SubmitQuizAttemptResult =
  | {
      ok: true;
      attemptId: string;
      score: number;
      totalQuestions: number;
      passed: boolean;
      review: QuizAttemptReview[];
    }
  | { ok: false; error: string };

export async function submitQuizAttempt(
  quizId: string,
  answers: QuizAnswerInput[],
): Promise<SubmitQuizAttemptResult> {
  const user = await authService.getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sessão inválida." };
  }

  const quiz = await quizService.getQuizWithAnswers(quizId);
  if (!quiz) {
    return { ok: false, error: "Quiz não encontrado." };
  }

  const unlocked = await coursesService.isModuleUnlockedForUser(quiz.module.id, user.id);
  if (!unlocked) {
    return { ok: false, error: "Este módulo ainda está bloqueado." };
  }

  const answersByQuestionId = new Map(answers.map((a) => [a.questionId, a.selectedIndex]));
  const allAnswered = quiz.questions.every((question) =>
    answersByQuestionId.has(question.id),
  );
  if (!allAnswered) {
    return { ok: false, error: "Responda todas as questões antes de enviar." };
  }

  const totalQuestions = quiz.questions.length;
  const score = quiz.questions.filter(
    (question) => answersByQuestionId.get(question.id) === question.correctIndex,
  ).length;
  const passed = score / totalQuestions >= 0.7;

  const storedAnswers = quiz.questions.map((question) => ({
    questionId: question.id,
    selectedIndex: answersByQuestionId.get(question.id)!,
  }));

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      userId: user.id,
      score,
      totalQuestions,
      passed,
      answers: storedAnswers,
    },
  });

  revalidatePath(`/courses/${quiz.module.courseId}`);

  return {
    ok: true,
    attemptId: attempt.id,
    score,
    totalQuestions,
    passed,
    review: quiz.questions.map((question) => ({
      questionId: question.id,
      question: question.question,
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      selectedIndex: answersByQuestionId.get(question.id) ?? null,
    })),
  };
}
