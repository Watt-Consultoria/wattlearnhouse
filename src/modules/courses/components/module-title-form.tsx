"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateModule } from "@/modules/courses/authoring-actions";

export function ModuleTitleForm({ moduleId, title: initialTitle }: { moduleId: string; title: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateModule(moduleId, title);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  const dirty = title !== initialTitle;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 font-heading text-sm font-bold text-foreground">Título do módulo</h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" required />
        <Button type="submit" className="min-h-11 shrink-0" disabled={isPending || !dirty}>
          {isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
