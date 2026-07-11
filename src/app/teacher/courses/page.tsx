import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import authService from "@/modules/auth/auth.service";
import authoringService from "@/modules/courses/authoring.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { CourseCover } from "@/modules/courses/components/course-cover";
import { CourseCreateForm } from "@/modules/courses/components/course-create-form";

export default async function TeacherCoursesPage() {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/courses");
  }

  const isAdmin = user.role === "admin";
  const courses = await authoringService.listCoursesByTeacher(user.id, user.role);

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="mb-3 font-mono text-xs font-semibold tracking-widest text-brand-gold uppercase">
            {isAdmin ? "Área administrativa" : "Área do professor"}
          </p>
          <h1 className="mb-3 font-heading text-3xl leading-tight font-extrabold text-foreground sm:text-4xl">
            {isAdmin ? "Todos os cursos" : "Meus cursos"}
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            {isAdmin
              ? "Edite qualquer curso da plataforma e acompanhe as estatísticas de qualquer professor."
              : "Crie e gerencie seus próprios cursos, módulos e aulas."}
          </p>
        </div>

        <CourseCreateForm />

        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Nenhum curso foi criado na plataforma ainda." : "Você ainda não criou nenhum curso."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/teacher/courses/${course.id}`}
                  className="group block h-full overflow-hidden rounded-xl border border-border bg-card ring-1 ring-foreground/5 transition-all duration-200 hover:border-brand-navy/30 hover:shadow-lg hover:shadow-brand-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CourseCover title={course.title} coverImageUrl={course.coverImageUrl}>
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {course.category}
                      </span>
                    </div>
                  </CourseCover>
                  <div className="flex flex-col gap-1.5 p-4">
                    <h3 className="line-clamp-2 font-heading text-[15px] leading-snug font-bold text-foreground">
                      {course.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="size-3" />
                      {course.moduleCount} {course.moduleCount === 1 ? "módulo" : "módulos"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
