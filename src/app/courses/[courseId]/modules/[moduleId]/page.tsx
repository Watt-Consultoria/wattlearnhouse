import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, HelpCircle, ChevronRight, CheckCheck } from "lucide-react";
import authService from "@/modules/auth/auth.service";
import coursesService from "@/modules/courses/courses.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { cn } from "@/lib/utils";

export default async function ModulePage({
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
  if (!courseModule) {
    notFound();
  }
  if (!courseModule.unlocked) {
    redirect(`/courses/${courseId}`);
  }

  const completedLessons = courseModule.lessons.filter((l) => l.completed).length;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: "Cursos", href: "/courses" },
              { label: courseModule.course.title, href: `/courses/${courseId}` },
              { label: courseModule.title },
            ]}
          />
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
              Módulo {String(courseModule.order).padStart(2, "0")}
            </span>
          </div>
          <h1 className="font-heading text-2xl leading-tight font-extrabold text-foreground sm:text-3xl">
            {courseModule.title}
          </h1>
        </div>

        <div className="mb-8 flex items-center justify-between rounded-xl bg-muted p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-gold/10">
              <CheckCheck className="size-[18px] text-brand-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {completedLessons} de {courseModule.lessons.length} lições concluídas
              </p>
              <p className="text-xs text-muted-foreground">
                {courseModule.lessons.length - completedLessons} restantes para completar o módulo
              </p>
            </div>
          </div>
          <span className="font-heading text-2xl font-extrabold text-brand-gold">
            {courseModule.progressPercent}%
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {courseModule.lessons.map((lesson, index) => {
            const isNext = lesson.id === courseModule.nextLessonId;
            return (
              <Link
                key={lesson.id}
                href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
                className={cn(
                  "group overflow-hidden rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isNext
                    ? "border-brand-gold bg-card shadow-md shadow-brand-gold/10"
                    : "border-border bg-card hover:border-brand-navy/20 hover:shadow-sm",
                )}
              >
                {isNext && <div className="h-0.5 bg-brand-gold" />}
                <div className="flex items-center gap-4 p-4">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      lesson.completed
                        ? "border-emerald-500 bg-emerald-500"
                        : isNext
                          ? "border-brand-gold bg-brand-gold/10"
                          : "border-border bg-muted",
                    )}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className="size-4 text-white" />
                    ) : (
                      <span
                        className={cn(
                          "font-mono text-xs",
                          isNext ? "text-brand-gold" : "text-border",
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {isNext && (
                      <p className="mb-0.5 text-xs font-semibold text-brand-gold">Próxima</p>
                    )}
                    <p className="truncate font-heading text-sm font-semibold text-foreground">
                      {lesson.title}
                    </p>
                  </div>

                  <ChevronRight className="size-4 shrink-0 text-border transition-colors group-hover:text-brand-navy" />
                </div>
              </Link>
            );
          })}

          {courseModule.quiz && (
            <Link
              href={`/courses/${courseId}/modules/${moduleId}/quiz`}
              className="flex items-center gap-4 rounded-xl border border-dashed border-brand-gold/50 bg-brand-gold/5 p-4 transition-colors hover:border-brand-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HelpCircle className="size-5 shrink-0 text-brand-gold" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-sm font-semibold text-foreground">
                  Quiz do módulo
                </p>
                <p className="text-xs text-muted-foreground">
                  {courseModule.quiz.questionCount}{" "}
                  {courseModule.quiz.questionCount === 1 ? "questão" : "questões"}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  courseModule.quiz.passed
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-brand-gold/15 text-brand-gold-dark",
                )}
              >
                {courseModule.quiz.passed ? "Aprovado" : "Fazer quiz"}
              </span>
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
