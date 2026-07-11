import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock, CheckCircle2, HelpCircle, BookOpen, ChevronRight } from "lucide-react";
import authService from "@/modules/auth/auth.service";
import coursesService from "@/modules/courses/courses.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProgressBar } from "@/components/progress-bar";
import { EnrollButton } from "@/modules/courses/components/enroll-button";
import { cn } from "@/lib/utils";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { courseId } = await params;
  const course = await coursesService.getCourseDetail(courseId, user.id);
  if (!course) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Cursos", href: "/courses" }, { label: course.title }]} />
        </div>

        <div className="relative mb-8 overflow-hidden rounded-2xl bg-brand-navy">
          {course.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary teacher-supplied URL, not restricted to next.config.ts remotePatterns
            <img
              src={course.coverImageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-20"
            />
          )}
          <div className="relative p-6 sm:p-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-medium text-white/60">{course.category}</span>
            </div>
            <h1 className="mb-2 font-heading text-2xl leading-tight font-extrabold text-white sm:text-3xl">
              {course.title}
            </h1>
            {course.description && (
              <p className="max-w-lg text-sm leading-relaxed text-white/70">
                {course.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                {course.modules.length} módulos · {course.totalLessons} lições
              </span>
            </div>

            {!course.isEnrolled && (
              <div className="mt-5">
                <EnrollButton courseId={course.id} />
              </div>
            )}

            {course.progressPercent > 0 && (
              <div className="mt-5 rounded-xl bg-white/10 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Seu progresso</span>
                  <span className="font-mono text-sm font-semibold text-brand-gold">
                    {course.completedLessons}/{course.totalLessons} lições
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      course.progressPercent === 100 ? "bg-emerald-500" : "bg-brand-gold",
                    )}
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">
            Conteúdo do curso
          </h2>
          <ol className="flex flex-col gap-3">
            {course.modules.map((module, index) => (
              <li key={module.id}>
                <ModuleListItem courseId={course.id} module={module} index={index} />
              </li>
            ))}
          </ol>
        </div>
      </main>
    </>
  );
}

type ModuleListItemProps = {
  courseId: string;
  index: number;
  module: {
    id: string;
    title: string;
    lessonCount: number;
    lessons: { id: string; title: string; order: number }[];
    hasQuiz: boolean;
    progressPercent: number;
    locked: boolean;
  };
};

function ModuleListItem({ courseId, index, module }: ModuleListItemProps) {
  const isComplete = !module.locked && module.progressPercent === 100;
  const inProgress = !module.locked && module.progressPercent > 0 && !isComplete;

  const content = (
    <div
      className={cn(
        "group flex items-start gap-4 rounded-xl border p-4 transition-all duration-200 sm:p-5",
        module.locked
          ? "cursor-not-allowed border-border bg-muted/60 opacity-60"
          : "border-border bg-card hover:border-brand-navy/30 hover:shadow-md hover:shadow-brand-navy/5",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold",
          isComplete
            ? "bg-emerald-50 text-emerald-600"
            : inProgress
              ? "bg-brand-gold/10 text-brand-gold"
              : module.locked
                ? "bg-muted text-muted-foreground/40"
                : "bg-secondary text-brand-navy",
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="size-4" />
        ) : module.locked ? (
          <Lock className="size-3.5" />
        ) : (
          String(index + 1).padStart(2, "0")
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate font-heading text-[15px] font-semibold text-foreground">
              {module.title}
            </p>
            {module.hasQuiz && <HelpCircle className="size-3.5 shrink-0 text-muted-foreground" />}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {module.lessonCount} {module.lessonCount === 1 ? "aula" : "aulas"}
          </span>
        </div>
        {!module.locked && <ProgressBar value={module.progressPercent} size="sm" />}
        {module.locked && module.lessons.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5">
            {module.lessons.map((lesson) => (
              <li key={lesson.id} className="truncate text-xs text-muted-foreground">
                {lesson.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!module.locked && (
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-border transition-colors group-hover:text-brand-navy" />
      )}
    </div>
  );

  if (module.locked) {
    return (
      <div aria-disabled="true" role="group" aria-label={`${module.title} (bloqueado)`}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/courses/${courseId}/modules/${module.id}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  );
}
