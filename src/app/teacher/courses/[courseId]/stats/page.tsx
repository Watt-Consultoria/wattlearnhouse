import { redirect } from "next/navigation";
import { Users, CheckCircle2 } from "lucide-react";
import authService from "@/modules/auth/auth.service";
import statsService from "@/modules/courses/stats.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProgressBar } from "@/components/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function CourseStatsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/courses");
  }

  const { courseId } = await params;
  const canView = await statsService.canViewStats(courseId, user);
  if (!canView) {
    redirect("/teacher/courses");
  }

  const stats = await statsService.getCourseStats(courseId);
  if (!stats) {
    redirect("/teacher/courses");
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: "Meus cursos", href: "/teacher/courses" },
            { label: stats.courseTitle, href: `/teacher/courses/${courseId}` },
            { label: "Estatísticas" },
          ]}
        />

        <div>
          <h1 className="mb-2 font-heading text-2xl leading-tight font-extrabold text-foreground sm:text-3xl">
            Estatísticas de {stats.courseTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            Dados calculados em tempo real a partir dos alunos matriculados.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                Matriculados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-extrabold text-foreground">
                {stats.enrolledCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="size-4" />
                Concluíram o curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-extrabold text-foreground">
                {stats.overallCompletionPercent}%
              </p>
            </CardContent>
          </Card>
        </div>

        <section>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
            Conclusão por módulo
          </h2>
          <div className="flex flex-col gap-3">
            {stats.modules.map((module) => (
              <Card key={module.id} size="sm">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {module.title}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {module.completedCount}/{module.enrolledCount}
                    </span>
                  </div>
                  <ProgressBar value={module.completionPercent} size="sm" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {stats.quizzes.length > 0 && (
          <section>
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
              Acerto por questão de quiz
            </h2>
            <div className="flex flex-col gap-6">
              {stats.quizzes.map((quiz) => (
                <div key={quiz.id}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Quiz — {quiz.moduleTitle}
                  </p>
                  <Card size="sm">
                    <CardContent className="flex flex-col divide-y divide-border p-0">
                      {quiz.questions.map((question) => (
                        <div key={question.id} className="flex flex-col gap-1.5 px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <p className="min-w-0 flex-1 text-sm text-foreground">
                              {question.question}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 font-mono text-xs font-semibold",
                                question.totalAttempts === 0
                                  ? "text-muted-foreground"
                                  : question.correctPercent >= 70
                                    ? "text-emerald-600"
                                    : "text-destructive",
                              )}
                            >
                              {question.totalAttempts === 0
                                ? "sem tentativas"
                                : `${question.correctPercent}% acertos`}
                            </span>
                          </div>
                          {question.totalAttempts > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {question.correctCount} acertaram · {question.incorrectCount}{" "}
                              erraram (primeira tentativa de cada aluno)
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
