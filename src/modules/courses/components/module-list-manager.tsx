"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createModule,
  updateModule,
  deleteModule,
  reorderModule,
} from "@/modules/courses/authoring-actions";

type ModuleItem = { id: string; title: string; order: number; lessonCount: number };

export function ModuleListManager({
  courseId,
  modules,
}: {
  courseId: string;
  modules: ModuleItem[];
}) {
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    startCreateTransition(async () => {
      const result = await createModule(courseId, newTitle);
      if (!result.ok) {
        setCreateError(result.error);
        return;
      }
      setNewTitle("");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 font-heading text-sm font-bold text-foreground">Módulos</h2>

      {modules.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">Nenhum módulo criado ainda.</p>
      ) : (
        <ol className="mb-4 flex flex-col gap-2">
          {modules.map((courseModule, index) => (
            <ModuleRow
              key={courseModule.id}
              courseId={courseId}
              module={courseModule}
              isFirst={index === 0}
              isLast={index === modules.length - 1}
            />
          ))}
        </ol>
      )}

      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título do novo módulo"
          className="flex-1"
          required
        />
        <Button type="submit" className="min-h-11 shrink-0" disabled={isCreating}>
          <Plus className="size-4" />
          {isCreating ? "Adicionando..." : "Adicionar módulo"}
        </Button>
      </form>
      {createError && <p className="mt-2 text-sm text-destructive">{createError}</p>}
    </div>
  );
}

function ModuleRow({
  courseId,
  module: courseModule,
  isFirst,
  isLast,
}: {
  courseId: string;
  module: ModuleItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [title, setTitle] = useState(courseModule.title);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isReordering, startReorderTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const isPending = isSaving || isReordering || isDeleting;
  const dirty = title !== courseModule.title;

  function handleRename() {
    setError(null);
    startSaveTransition(async () => {
      const result = await updateModule(courseModule.id, title);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleReorder(direction: "up" | "down") {
    setError(null);
    startReorderTransition(async () => {
      const result = await reorderModule(courseModule.id, direction);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o módulo "${courseModule.title}"? As aulas dele serão removidas permanentemente.`,
      )
    ) {
      return;
    }
    setError(null);
    startDeleteTransition(async () => {
      const result = await deleteModule(courseModule.id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
          {String(courseModule.order).padStart(2, "0")}
        </span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-0 flex-1"
        />
        {dirty && (
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Salvar título"
            onClick={handleRename}
            disabled={isPending}
          >
            <Save className="size-3.5" />
          </Button>
        )}
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
          aria-label="Excluir módulo"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/teacher/courses/${courseId}/modules/${courseModule.id}`} />}
        >
          {courseModule.lessonCount} {courseModule.lessonCount === 1 ? "aula" : "aulas"}
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </li>
  );
}
