import prisma from "@/infra/database";
import { computeCourseProgress, computeModulesProgress } from "./progress";

export type CourseSummary = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  coverImageUrl: string | null;
  moduleCount: number;
  progressPercent: number;
};

export type CourseDetailLesson = {
  id: string;
  title: string;
  order: number;
};

class CoursesService {
  async listCourses(userId: string): Promise<CourseSummary[]> {
    const courses = await prisma.course.findMany({
      orderBy: { title: "asc" },
      include: {
        modules: { include: { lessons: { select: { id: true } } } },
      },
    });

    const lessonIds = courses.flatMap((course) =>
      course.modules.flatMap((courseModule) => courseModule.lessons.map((lesson) => lesson.id)),
    );
    const completedLessons = await prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true },
    });
    const completedLessonIds = new Set(completedLessons.map((l) => l.lessonId));

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      coverImageUrl: course.coverImageUrl,
      moduleCount: course.modules.length,
      progressPercent: computeCourseProgress(
        course.modules.map((m) => ({ lessonIds: m.lessons.map((l) => l.id) })),
        completedLessonIds,
      ),
    }));
  }

  async getCourseDetail(courseId: string, userId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return null;
    }

    const { modules, moduleProgress, completedLessonIds, isEnrolled } =
      await this.computeCourseModuleProgress(courseId, userId);

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
      0,
    );

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      coverImageUrl: course.coverImageUrl,
      isEnrolled,
      totalLessons,
      completedLessons,
      progressPercent: computeCourseProgress(
        modules.map((m) => ({ lessonIds: m.lessons.map((l) => l.id) })),
        completedLessonIds,
      ),
      modules: modules.map((courseModule, index) => {
        const progress = moduleProgress[index];
        return {
          id: courseModule.id,
          title: courseModule.title,
          order: courseModule.order,
          lessonCount: courseModule.lessons.length,
          lessons: courseModule.lessons
            .map((lesson) => ({ id: lesson.id, title: lesson.title, order: lesson.order }))
            .sort((a, b) => a.order - b.order),
          hasQuiz: !!courseModule.quiz,
          progressPercent: progress.progressPercent,
          // Um módulo só é navegável quando o aluno está matriculado E a sequência
          // de desbloqueio já liberou esse módulo (ver computeCourseModuleProgress).
          locked: !progress.unlocked,
        };
      }),
    };
  }

  async isEnrolled(courseId: string, userId: string): Promise<boolean> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });
    return enrollment !== null;
  }

  async enroll(courseId: string, userId: string): Promise<void> {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });
  }

  async getModuleDetail(moduleId: string, userId: string) {
    const courseModule = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: { select: { id: true, title: true } },
        lessons: { orderBy: { order: "asc" } },
        quiz: { include: { questions: { select: { id: true } } } },
      },
    });
    if (!courseModule) {
      return null;
    }

    const { moduleProgress, completedLessonIds } = await this.computeCourseModuleProgress(
      courseModule.course.id,
      userId,
    );
    const progress = moduleProgress.find((m) => m.id === moduleId);
    if (!progress) {
      return null;
    }

    const lessons = courseModule.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      completed: completedLessonIds.has(lesson.id),
    }));

    return {
      id: courseModule.id,
      title: courseModule.title,
      order: courseModule.order,
      course: courseModule.course,
      unlocked: progress.unlocked,
      progressPercent: progress.progressPercent,
      lessonsComplete: progress.lessonsComplete,
      lessons,
      nextLessonId: lessons.find((l) => !l.completed)?.id ?? null,
      quiz: courseModule.quiz
        ? {
            id: courseModule.quiz.id,
            questionCount: courseModule.quiz.questions.length,
            passed: progress.quizPassed === true,
          }
        : null,
    };
  }

  async getLessonDetail(lessonId: string, userId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: { select: { id: true, title: true } },
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, order: true },
            },
            quiz: { select: { id: true } },
          },
        },
      },
    });
    if (!lesson) {
      return null;
    }

    const { moduleProgress, completedLessonIds } = await this.computeCourseModuleProgress(
      lesson.module.course.id,
      userId,
    );
    const progress = moduleProgress.find((m) => m.id === lesson.moduleId);

    const siblingLessons = lesson.module.lessons.map((sibling) => ({
      id: sibling.id,
      title: sibling.title,
      order: sibling.order,
      completed: completedLessonIds.has(sibling.id),
    }));

    const currentIndex = siblingLessons.findIndex((l) => l.id === lessonId);
    const previousLesson = currentIndex > 0 ? siblingLessons[currentIndex - 1] : null;
    const nextLesson =
      currentIndex >= 0 && currentIndex < siblingLessons.length - 1
        ? siblingLessons[currentIndex + 1]
        : null;

    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      completed: completedLessonIds.has(lesson.id),
      course: lesson.module.course,
      module: { id: lesson.module.id, title: lesson.module.title },
      unlocked: progress?.unlocked ?? false,
      siblingLessons,
      previousLessonId: previousLesson?.id ?? null,
      nextLessonId: nextLesson?.id ?? null,
      isLastLesson: currentIndex === siblingLessons.length - 1,
      quizId: lesson.module.quiz?.id ?? null,
    };
  }

  async isModuleUnlockedForUser(moduleId: string, userId: string): Promise<boolean> {
    const courseModule = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true },
    });
    if (!courseModule) {
      return false;
    }

    const { moduleProgress } = await this.computeCourseModuleProgress(
      courseModule.courseId,
      userId,
    );
    return moduleProgress.find((m) => m.id === moduleId)?.unlocked ?? false;
  }

  private async computeCourseModuleProgress(courseId: string, userId: string) {
    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
        quiz: { select: { id: true } },
      },
    });

    const lessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
    const quizIds = modules
      .map((m) => m.quiz?.id)
      .filter((id): id is string => !!id);

    const [completedLessons, passedAttempts, enrollment] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds } },
        select: { lessonId: true },
      }),
      prisma.quizAttempt.findMany({
        where: { userId, quizId: { in: quizIds }, passed: true },
        select: { quizId: true },
      }),
      prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { id: true },
      }),
    ]);

    const completedLessonIds = new Set(completedLessons.map((l) => l.lessonId));
    const passedQuizIds = new Set(passedAttempts.map((a) => a.quizId));
    const isEnrolled = enrollment !== null;

    // A grade (títulos de módulo/aula) é visível a qualquer usuário autenticado
    // (ver course-enrollment), mas navegar para dentro de um módulo exige matrícula
    // além do desbloqueio sequencial — por isso `unlocked` já sai combinado aqui,
    // de forma que toda tela e Server Action que consome esse resultado (módulo,
    // aula, quiz, completeLesson, submitQuizAttempt) herda a checagem de matrícula
    // automaticamente, sem duplicar a regra em cada lugar.
    const moduleProgress = computeModulesProgress(
      modules.map((m) => ({
        id: m.id,
        lessonIds: m.lessons.map((l) => l.id),
        quizId: m.quiz?.id ?? null,
      })),
      completedLessonIds,
      passedQuizIds,
    ).map((progress) => ({ ...progress, unlocked: progress.unlocked && isEnrolled }));

    return { modules, moduleProgress, completedLessonIds, passedQuizIds, isEnrolled };
  }
}

const coursesService = new CoursesService();

export default coursesService;
