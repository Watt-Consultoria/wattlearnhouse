"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeLesson } from "@/modules/courses/actions";

export function LessonActionsBar({
  lessonId,
  completed,
  courseId,
  moduleId,
  previousLessonId,
  nextLessonId,
  isLastLesson,
  quizId,
}: {
  lessonId: string;
  completed: boolean;
  courseId: string;
  moduleId: string;
  previousLessonId: string | null;
  nextLessonId: string | null;
  isLastLesson: boolean;
  quizId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const continueHref = nextLessonId
    ? `/courses/${courseId}/modules/${moduleId}/lessons/${nextLessonId}`
    : quizId
      ? `/courses/${courseId}/modules/${moduleId}/quiz`
      : `/courses/${courseId}/modules/${moduleId}`;

  function handleComplete() {
    startTransition(async () => {
      const result = await completeLesson(lessonId);
      if (result.ok) {
        router.push(continueHref);
      }
    });
  }

  return (
    <div className="sticky bottom-0 z-30 flex min-h-16 items-center justify-between gap-2 border-t border-border bg-background/95 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {previousLessonId ? (
        <Button
          variant="outline"
          size="lg"
          className="min-h-11"
          nativeButton={false}
          render={
            <Link
              href={`/courses/${courseId}/modules/${moduleId}/lessons/${previousLessonId}`}
            />
          }
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
      ) : (
        <span aria-hidden />
      )}

      {completed ? (
        <Button size="lg" className="min-h-11" nativeButton={false} render={<Link href={continueHref} />}>
          {isLastLesson && !quizId ? "Concluído" : "Continuar"}
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Button
          variant="accent"
          size="lg"
          className="min-h-11"
          onClick={handleComplete}
          disabled={isPending}
        >
          <CheckCircle2 className="size-4" />
          {isPending ? "Salvando..." : "Concluir aula"}
        </Button>
      )}
    </div>
  );
}
