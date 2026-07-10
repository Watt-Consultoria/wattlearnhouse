import prisma from "@/infra/database";

export type TeacherCourseSummary = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  coverImageUrl: string | null;
  moduleCount: number;
};

export type TeacherCourseDetail = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  coverImageUrl: string | null;
  modules: {
    id: string;
    title: string;
    order: number;
    lessonCount: number;
  }[];
};

export type TeacherQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  order: number;
};

export type TeacherQuiz = {
  id: string;
  questions: TeacherQuizQuestion[];
};

export type TeacherModuleDetail = {
  id: string;
  title: string;
  order: number;
  course: { id: string; title: string };
  lessons: { id: string; title: string; order: number }[];
  quiz: TeacherQuiz | null;
};

export type TeacherLessonDetail = {
  id: string;
  title: string;
  content: string;
  order: number;
  module: { id: string; title: string; courseId: string; courseTitle: string };
};

export type ModuleOwnership = { courseId: string; teacherId: string };
export type LessonOwnership = { moduleId: string; courseId: string; teacherId: string };
export type QuizOwnership = { moduleId: string; courseId: string; teacherId: string };
export type QuizQuestionOwnership = {
  quizId: string;
  moduleId: string;
  courseId: string;
  teacherId: string;
};

class AuthoringService {
  async listCoursesByTeacher(teacherId: string): Promise<TeacherCourseSummary[]> {
    const courses = await prisma.course.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      include: { modules: { select: { id: true } } },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      coverImageUrl: course.coverImageUrl,
      moduleCount: course.modules.length,
    }));
  }

  async getCourseForTeacher(
    courseId: string,
    teacherId: string,
  ): Promise<TeacherCourseDetail | null> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { select: { id: true } } },
        },
      },
    });
    if (!course || course.teacherId !== teacherId) {
      return null;
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      coverImageUrl: course.coverImageUrl,
      modules: course.modules.map((courseModule) => ({
        id: courseModule.id,
        title: courseModule.title,
        order: courseModule.order,
        lessonCount: courseModule.lessons.length,
      })),
    };
  }

  async getModuleForTeacher(
    moduleId: string,
    teacherId: string,
  ): Promise<TeacherModuleDetail | null> {
    const courseModule = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: { select: { id: true, title: true, teacherId: true } },
        lessons: { orderBy: { order: "asc" } },
        quiz: { include: { questions: { orderBy: { order: "asc" } } } },
      },
    });
    if (!courseModule || courseModule.course.teacherId !== teacherId) {
      return null;
    }

    return {
      id: courseModule.id,
      title: courseModule.title,
      order: courseModule.order,
      course: { id: courseModule.course.id, title: courseModule.course.title },
      lessons: courseModule.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
      })),
      quiz: courseModule.quiz
        ? {
            id: courseModule.quiz.id,
            questions: courseModule.quiz.questions.map((question) => ({
              id: question.id,
              question: question.question,
              options: question.options,
              correctIndex: question.correctIndex,
              explanation: question.explanation,
              order: question.order,
            })),
          }
        : null,
    };
  }

  async getLessonForTeacher(
    lessonId: string,
    teacherId: string,
  ): Promise<TeacherLessonDetail | null> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: { course: { select: { id: true, title: true, teacherId: true } } },
        },
      },
    });
    if (!lesson || lesson.module.course.teacherId !== teacherId) {
      return null;
    }

    return {
      id: lesson.id,
      title: lesson.title,
      content: lesson.content,
      order: lesson.order,
      module: {
        id: lesson.module.id,
        title: lesson.module.title,
        courseId: lesson.module.course.id,
        courseTitle: lesson.module.course.title,
      },
    };
  }

  async getCourseTeacherId(courseId: string): Promise<string | null> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { teacherId: true },
    });
    return course?.teacherId ?? null;
  }

  async resolveModuleOwnership(moduleId: string): Promise<ModuleOwnership | null> {
    const courseModule = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { courseId: true, course: { select: { teacherId: true } } },
    });
    if (!courseModule) {
      return null;
    }
    return { courseId: courseModule.courseId, teacherId: courseModule.course.teacherId };
  }

  async resolveLessonOwnership(lessonId: string): Promise<LessonOwnership | null> {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        moduleId: true,
        module: { select: { courseId: true, course: { select: { teacherId: true } } } },
      },
    });
    if (!lesson) {
      return null;
    }
    return {
      moduleId: lesson.moduleId,
      courseId: lesson.module.courseId,
      teacherId: lesson.module.course.teacherId,
    };
  }

  async resolveQuizOwnership(quizId: string): Promise<QuizOwnership | null> {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        moduleId: true,
        module: { select: { courseId: true, course: { select: { teacherId: true } } } },
      },
    });
    if (!quiz) {
      return null;
    }
    return {
      moduleId: quiz.moduleId,
      courseId: quiz.module.courseId,
      teacherId: quiz.module.course.teacherId,
    };
  }

  async resolveQuizQuestionOwnership(questionId: string): Promise<QuizQuestionOwnership | null> {
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      select: {
        quizId: true,
        quiz: {
          select: {
            moduleId: true,
            module: { select: { courseId: true, course: { select: { teacherId: true } } } },
          },
        },
      },
    });
    if (!question) {
      return null;
    }
    return {
      quizId: question.quizId,
      moduleId: question.quiz.moduleId,
      courseId: question.quiz.module.courseId,
      teacherId: question.quiz.module.course.teacherId,
    };
  }
}

const authoringService = new AuthoringService();

export default authoringService;
