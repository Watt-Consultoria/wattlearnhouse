import Link from "next/link";
import { BookOpen } from "lucide-react";
import { CourseCover } from "./course-cover";
import { cn } from "@/lib/utils";
import type { CourseSummary } from "../courses.service";

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block h-full overflow-hidden rounded-xl border border-border bg-card ring-1 ring-foreground/5 transition-all duration-200 hover:border-brand-navy/30 hover:shadow-lg hover:shadow-brand-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CourseCover title={course.title} coverImageUrl={course.coverImageUrl}>
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {course.category}
          </span>
        </div>

        {course.progressPercent > 0 && (
          <div className="absolute right-3 bottom-3 left-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-white">
                {course.progressPercent === 100 ? "Concluído" : "Em progresso"}
              </span>
              <span className="font-mono text-xs text-white">{course.progressPercent}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  "h-full rounded-full",
                  course.progressPercent === 100 ? "bg-emerald-500" : "bg-brand-gold",
                )}
                style={{ width: `${course.progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CourseCover>

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-heading text-[15px] leading-snug font-bold text-foreground">
          {course.title}
        </h3>
        {course.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <BookOpen className="size-3" />
          {course.moduleCount} {course.moduleCount === 1 ? "módulo" : "módulos"}
        </div>
      </div>
    </Link>
  );
}
