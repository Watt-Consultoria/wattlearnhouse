import prisma from "@/infra/database";
import authoringService from "./authoring.service";

export type ModuleStat = {
  id: string;
  title: string;
  order: number;
  completedCount: number;
  enrolledCount: number;
  completionPercent: number;
};

export type QuizQuestionStat = {
  id: string;
  question: string;
  order: number;
  correctCount: number;
  incorrectCount: number;
  totalAttempts: number;
  correctPercent: number;
};

export type QuizStat = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestionStat[];
};

export type CourseStats = {
  courseId: string;
  courseTitle: string;
  enrolledCount: number;
  overallCompletionPercent: number;
  modules: ModuleStat[];
  quizzes: QuizStat[];
};

type StoredAnswer = { questionId: string; selectedIndex: number };

class StatsService {
  /** Dono do curso (teacher) ou admin — ver platform-admin/course-statistics. */
  async canViewStats(courseId: string, user: { id: string; role: string }): Promise<boolean> {
    if (user.role === "admin") {
      return true;
    }
    if (user.role !== "teacher") {
      return false;
    }
    const teacherId = await authoringService.getCourseTeacherId(courseId);
    return teacherId === user.id;
  }

  async getCourseStats(courseId: string): Promise<CourseStats | null> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: { select: { id: true } },
            quiz: { include: { questions: { orderBy: { order: "asc" } } } },
          },
        },
      },
    });
    if (!course) {
      return null;
    }
    const modulesWithRelations = course.modules;

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
    });
    const enrolledUserIds = enrollments.map((e) => e.userId);
    const enrolledCount = enrolledUserIds.length;

    const lessonIds = modulesWithRelations.flatMap((m) => m.lessons.map((l) => l.id));
    const quizIds = modulesWithRelations
      .map((m) => m.quiz?.id)
      .filter((id): id is string => !!id);

    const [lessonProgress, passedAttempts, quizAttempts] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId: { in: enrolledUserIds }, lessonId: { in: lessonIds } },
        select: { userId: true, lessonId: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId: { in: enrolledUserIds }, quizId: { in: quizIds }, passed: true },
        select: { userId: true, quizId: true },
      }),
      prisma.quizAttempt.findMany({
        where: { quizId: { in: quizIds } },
        select: { quizId: true, userId: true, answers: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const completedLessonsByUser = new Map<string, Set<string>>();
    for (const progress of lessonProgress) {
      const set = completedLessonsByUser.get(progress.userId) ?? new Set<string>();
      set.add(progress.lessonId);
      completedLessonsByUser.set(progress.userId, set);
    }

    const passedQuizzesByUser = new Map<string, Set<string>>();
    for (const attempt of passedAttempts) {
      const set = passedQuizzesByUser.get(attempt.userId) ?? new Set<string>();
      set.add(attempt.quizId);
      passedQuizzesByUser.set(attempt.userId, set);
    }

    function isModuleCompleteForUser(
      module: (typeof modulesWithRelations)[number],
      userId: string,
    ): boolean {
      const completedLessons = completedLessonsByUser.get(userId);
      const lessonIdsForModule = module.lessons.map((l) => l.id);
      const lessonsComplete =
        lessonIdsForModule.length === 0 ||
        lessonIdsForModule.every((id) => completedLessons?.has(id));
      const quizId = module.quiz?.id ?? null;
      const quizPassed = quizId ? (passedQuizzesByUser.get(userId)?.has(quizId) ?? false) : true;
      return lessonsComplete && quizPassed;
    }

    const modules: ModuleStat[] = modulesWithRelations.map((courseModule) => {
      const completedCount = enrolledUserIds.filter((userId) =>
        isModuleCompleteForUser(courseModule, userId),
      ).length;

      return {
        id: courseModule.id,
        title: courseModule.title,
        order: courseModule.order,
        completedCount,
        enrolledCount,
        completionPercent:
          enrolledCount === 0 ? 0 : Math.round((completedCount / enrolledCount) * 100),
      };
    });

    const courseCompletedCount = enrolledUserIds.filter((userId) =>
      modulesWithRelations.every((courseModule) => isModuleCompleteForUser(courseModule, userId)),
    ).length;
    const overallCompletionPercent =
      enrolledCount === 0 ? 0 : Math.round((courseCompletedCount / enrolledCount) * 100);

    // Primeira tentativa de cada aluno por quiz (ver course-statistics: tentativas
    // subsequentes não influenciam o acerto/erro por questão).
    const firstAttemptByQuizUser = new Map<string, (typeof quizAttempts)[number]>();
    for (const attempt of quizAttempts) {
      const key = `${attempt.quizId}:${attempt.userId}`;
      if (!firstAttemptByQuizUser.has(key)) {
        firstAttemptByQuizUser.set(key, attempt);
      }
    }

    const quizzes: QuizStat[] = modulesWithRelations
      .filter((courseModule) => courseModule.quiz)
      .map((courseModule) => {
        const quiz = courseModule.quiz!;
        const firstAttempts = [...firstAttemptByQuizUser.values()].filter(
          (attempt) => attempt.quizId === quiz.id,
        );

        const questions: QuizQuestionStat[] = quiz.questions.map((question) => {
          let correctCount = 0;
          let incorrectCount = 0;

          for (const attempt of firstAttempts) {
            const answers = attempt.answers as unknown as StoredAnswer[];
            const answer = answers.find((a) => a.questionId === question.id);
            if (!answer) {
              continue;
            }
            if (answer.selectedIndex === question.correctIndex) {
              correctCount += 1;
            } else {
              incorrectCount += 1;
            }
          }

          const totalAttempts = correctCount + incorrectCount;
          return {
            id: question.id,
            question: question.question,
            order: question.order,
            correctCount,
            incorrectCount,
            totalAttempts,
            correctPercent:
              totalAttempts === 0 ? 0 : Math.round((correctCount / totalAttempts) * 100),
          };
        });

        return {
          id: quiz.id,
          moduleId: courseModule.id,
          moduleTitle: courseModule.title,
          questions,
        };
      });

    return {
      courseId: course.id,
      courseTitle: course.title,
      enrolledCount,
      overallCompletionPercent,
      modules,
      quizzes,
    };
  }
}

const statsService = new StatsService();

export default statsService;
