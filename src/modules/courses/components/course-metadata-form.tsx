"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateCourse, deleteCourse } from "@/modules/courses/authoring-actions";
import type { TeacherCourseDetail } from "@/modules/courses/authoring.service";
import { COURSE_CATEGORIES } from "@/modules/courses/categories";

export function CourseMetadataForm({ course }: { course: TeacherCourseDetail }) {
  const router = useRouter();
  const [title, setTitle] = useState(course.title);
  const [category, setCategory] = useState(course.category);
  const [description, setDescription] = useState(course.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(course.coverImageUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSaveTransition(async () => {
      const result = await updateCourse(course.id, { title, category, description, coverImageUrl });
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Tem certeza que deseja excluir "${course.title}"? Todos os módulos e aulas serão removidos permanentemente.`)) {
      return;
    }
    setError(null);
    startDeleteTransition(async () => {
      const result = await deleteCourse(course.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/teacher/courses");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 font-heading text-sm font-bold text-foreground">Dados do curso</h2>
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

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button type="submit" className="min-h-11" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="min-h-11"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="size-4" />
          {isDeleting ? "Excluindo..." : "Excluir curso"}
        </Button>
      </div>
    </form>
  );
}
