import prisma from "@/infra/database";

class QuizService {
  /** Perguntas sem `correctIndex`/`explanation` — seguras para a tela de resposta. */
  async getQuizForTaking(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: { include: { course: { select: { id: true, title: true } } } },
        questions: {
          orderBy: { order: "asc" },
          select: { id: true, question: true, options: true, order: true },
        },
      },
    });
    if (!quiz) {
      return null;
    }

    return {
      id: quiz.id,
      moduleId: quiz.moduleId,
      module: { id: quiz.module.id, title: quiz.module.title },
      course: quiz.module.course,
      questions: quiz.questions,
    };
  }

  /** Inclui `correctIndex`/`explanation` — uso restrito ao servidor para correção. */
  async getQuizWithAnswers(quizId: string) {
    return prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        module: { select: { id: true, courseId: true } },
        questions: { orderBy: { order: "asc" } },
      },
    });
  }

  async getAttemptHistory(quizId: string, userId: string) {
    return prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

const quizService = new QuizService();

export default quizService;
