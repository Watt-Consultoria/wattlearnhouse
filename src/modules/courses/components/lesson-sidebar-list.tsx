import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarLesson = {
  id: string;
  title: string;
  order: number;
  completed: boolean;
};

export function LessonSidebarList({
  courseId,
  moduleId,
  currentLessonId,
  lessons,
}: {
  courseId: string;
  moduleId: string;
  currentLessonId: string;
  lessons: SidebarLesson[];
}) {
  return (
    <ol className="divide-y divide-border">
      {lessons.map((lesson, index) => {
        const isCurrent = lesson.id === currentLessonId;
        return (
          <li key={lesson.id}>
            <Link
              href={`/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
              className={cn(
                "flex min-h-11 items-center gap-3 px-4 py-3 transition-colors",
                isCurrent ? "bg-brand-gold/10" : "hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  lesson.completed
                    ? "border-emerald-500 bg-emerald-500"
                    : isCurrent
                      ? "border-brand-gold bg-brand-gold/10"
                      : "border-border bg-background",
                )}
              >
                {lesson.completed ? (
                  <Check className="size-3 text-white" />
                ) : (
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      isCurrent ? "text-brand-gold" : "text-muted-foreground/50",
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "truncate text-xs leading-snug",
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {lesson.title}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
