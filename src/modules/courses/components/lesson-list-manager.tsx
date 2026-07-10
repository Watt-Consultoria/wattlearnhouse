"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLesson, reorderLesson } from "@/modules/courses/authoring-actions";

type LessonItem = { id: string; title: string; order: number };

export function LessonListManager({
  courseId,
  moduleId,
  lessons,
}: {
  courseId: string;
  moduleId: string;
  lessons: LessonItem[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-sm font-bold text-foreground">Aulas</h2>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href={`/teacher/courses/${courseId}/modules/${moduleId}/lessons/new`} />}
        >
          <Plus className="size-3.5" />
          Nova aula
        </Button>
      </div>

      {lessons.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma aula criada ainda.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {lessons.map((lesson, index) => (
            <LessonRow
              key={lesson.id}
              courseId={courseId}
              moduleId={moduleId}
              lesson={lesson}
              isFirst={index === 0}
              isLast={index === lessons.length - 1}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function LessonRow({
  courseId,
  moduleId,
  lesson,
  isFirst,
  isLast,
}: {
  courseId: string;
  moduleId: string;
  lesson: LessonItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const isPending = isReordering || isDeleting;

  function handleReorder(direction: "up" | "down") {
    setError(null);
    startReorderTransition(async () => {
      const result = await reorderLesson(lesson.id, direction);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Tem certeza que deseja excluir a aula "${lesson.title}"?`)) {
      return;
    }
    setError(null);
    startDeleteTransition(async () => {
      const result = await deleteLesson(lesson.id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
          {String(lesson.order).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {lesson.title}
        </span>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Mover para cima"
          onClick={() => handleReorder("up")}
          disabled={isPending || isFirst}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Mover para baixo"
          onClick={() => handleReorder("down")}
          disabled={isPending || isLast}
        >
          <ChevronDown className="size-3.5" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          aria-label="Excluir aula"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={
            <Link
              href={`/teacher/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}
            />
          }
        >
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </li>
  );
}
