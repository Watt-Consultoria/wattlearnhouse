import { notFound, redirect } from "next/navigation";
import authService from "@/modules/auth/auth.service";
import coursesService from "@/modules/courses/courses.service";
import quizService from "@/modules/quiz/quiz.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { QuizRunner } from "@/modules/quiz/components/quiz-runner";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { courseId, moduleId } = await params;
  const courseModule = await coursesService.getModuleDetail(moduleId, user.id);
  if (!courseModule || !courseModule.quiz) {
    notFound();
  }
  if (!courseModule.unlocked) {
    redirect(`/courses/${courseId}`);
  }

  const quiz = await quizService.getQuizForTaking(courseModule.quiz.id);
  if (!quiz) {
    notFound();
  }

  if (quiz.questions.length === 0) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
          <Breadcrumb
            items={[
              { label: "Cursos", href: "/courses" },
              { label: quiz.course.title, href: `/courses/${courseId}` },
              {
                label: courseModule.title,
                href: `/courses/${courseId}/modules/${moduleId}`,
              },
              { label: "Quiz" },
            ]}
          />
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Este quiz ainda não tem perguntas cadastradas. Volte em breve.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Cursos", href: "/courses" },
              { label: quiz.course.title, href: `/courses/${courseId}` },
              {
                label: courseModule.title,
                href: `/courses/${courseId}/modules/${moduleId}`,
              },
              { label: "Quiz" },
            ]}
          />
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-brand-gold/10 px-2 py-0.5 font-mono text-xs font-semibold text-brand-gold">
              QUIZ
            </span>
            <span className="text-xs text-muted-foreground">
              {quiz.questions.length} {quiz.questions.length === 1 ? "questão" : "questões"}
            </span>
          </div>
          <h1 className="mb-2 font-heading text-2xl font-extrabold text-foreground sm:text-3xl">
            Teste seus conhecimentos
          </h1>
          <p className="text-sm text-muted-foreground">
            Responda todas as questões e envie para receber seu resultado. Você precisa de 70%
            para avançar.
          </p>
        </div>

        <QuizRunner
          quizId={quiz.id}
          questions={quiz.questions}
          courseId={courseId}
          moduleId={moduleId}
        />
      </main>
    </>
  );
}
