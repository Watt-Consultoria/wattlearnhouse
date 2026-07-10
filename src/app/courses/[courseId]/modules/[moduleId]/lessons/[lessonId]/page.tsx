import { notFound, redirect } from "next/navigation";
import { ChevronDown } from "lucide-react";
import authService from "@/modules/auth/auth.service";
import coursesService from "@/modules/courses/courses.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { LessonContent } from "@/modules/courses/components/lesson-content";
import { LessonSidebarList } from "@/modules/courses/components/lesson-sidebar-list";
import { LessonActionsBar } from "@/modules/courses/components/lesson-actions-bar";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { courseId, moduleId, lessonId } = await params;
  const lesson = await coursesService.getLessonDetail(lessonId, user.id);
  if (!lesson) {
    notFound();
  }
  if (!lesson.unlocked) {
    redirect(`/courses/${courseId}`);
  }

  const lessonIndex = lesson.siblingLessons.findIndex((l) => l.id === lessonId);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="sticky top-14 z-30 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 py-3">
          <Breadcrumb
            items={[
              { label: "Cursos", href: "/courses" },
              { label: lesson.course.title, href: `/courses/${courseId}` },
              {
                label: lesson.module.title,
                href: `/courses/${courseId}/modules/${moduleId}`,
              },
              { label: lesson.title },
            ]}
          />
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
              {lessonIndex + 1}/{lesson.siblingLessons.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
          <details className="rounded-xl border border-border lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground">
              Aulas deste módulo
              <ChevronDown className="size-4 text-muted-foreground" />
            </summary>
            <div className="border-t border-border p-2">
              <LessonSidebarList
                courseId={courseId}
                moduleId={moduleId}
                currentLessonId={lessonId}
                lessons={lesson.siblingLessons}
              />
            </div>
          </details>

          <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
            <article className="min-w-0">
              <h1 className="mb-6 font-heading text-2xl leading-tight font-extrabold text-foreground sm:text-3xl">
                {lesson.title}
              </h1>
              <LessonContent content={lesson.content} />
            </article>

            <aside className="hidden lg:block">
              <div className="sticky top-32 overflow-hidden rounded-xl border border-border">
                <div className="border-b border-border bg-muted px-4 py-3">
                  <p className="text-xs font-semibold tracking-wide text-foreground uppercase">
                    {lesson.module.title}
                  </p>
                </div>
                <LessonSidebarList
                  courseId={courseId}
                  moduleId={moduleId}
                  currentLessonId={lessonId}
                  lessons={lesson.siblingLessons}
                />
              </div>
            </aside>
          </div>
        </div>

        <LessonActionsBar
          lessonId={lesson.id}
          completed={lesson.completed}
          courseId={courseId}
          moduleId={moduleId}
          previousLessonId={lesson.previousLessonId}
          nextLessonId={lesson.nextLessonId}
          isLastLesson={lesson.isLastLesson}
          quizId={lesson.quizId}
        />
      </div>
    </div>
  );
}
