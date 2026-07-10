"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createCourse } from "@/modules/courses/authoring-actions";
import { COURSE_CATEGORIES } from "@/modules/courses/categories";

export function CourseCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCourse({ title, category, description, coverImageUrl });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/teacher/courses/${result.courseId}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-xl border border-dashed border-border bg-muted/40 p-4 sm:p-5"
    >
      <h2 className="mb-3 font-heading text-sm font-bold text-foreground">Criar novo curso</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do curso"
          required
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          aria-label="Categoria do curso"
        >
          <option value="" disabled>
            Categoria
          </option>
          {COURSE_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className="sm:col-span-2"
        />
        <Input
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="URL da imagem de capa (opcional)"
          className="sm:col-span-2"
        />
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-4 min-h-11" disabled={isPending}>
        <Plus className="size-4" />
        {isPending ? "Criando..." : "Criar curso"}
      </Button>
    </form>
  );
}
