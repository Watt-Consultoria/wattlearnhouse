"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CourseCard } from "./course-card";
import type { CourseSummary } from "../courses.service";

export function CourseCatalog({ courses }: { courses: CourseSummary[] }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(courses.map((c) => c.category))).sort((a, b) => a.localeCompare(b)),
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return courses.filter((course) => {
      if (category && course.category !== category) {
        return false;
      }
      if (term && !course.title.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [courses, search, category]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full shrink-0 self-start sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título..."
            aria-label="Buscar cursos"
            className="h-11 rounded-lg pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={category === null}
            onClick={() => setCategory(null)}
            activeClassName="bg-brand-navy text-white"
          >
            Todas categorias
          </FilterChip>
          {categories.map((courseCategory) => (
            <FilterChip
              key={courseCategory}
              active={category === courseCategory}
              onClick={() => setCategory(category === courseCategory ? null : courseCategory)}
              activeClassName="bg-brand-navy text-white"
            >
              {courseCategory}
            </FilterChip>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border py-20 text-center">
          <p className="font-medium text-foreground">Nenhum curso encontrado</p>
          <p className="text-sm text-muted-foreground">
            Tente ajustar a busca ou os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  activeClassName,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeClassName: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-11 shrink-0 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-all",
        active ? activeClassName : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
