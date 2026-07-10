import { redirect } from "next/navigation";
import authService from "@/modules/auth/auth.service";
import coursesService from "@/modules/courses/courses.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { CourseCatalog } from "@/modules/courses/components/course-catalog";
import { cn } from "@/lib/utils";

export default async function CoursesPage() {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courses = await coursesService.listCourses(user.id);
  const firstName = user.name.split(" ")[0];
  const inProgressCount = courses.filter(
    (c) => c.progressPercent > 0 && c.progressPercent < 100,
  ).length;
  const completedCount = courses.filter((c) => c.progressPercent === 100).length;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
          <p className="mb-3 font-mono text-xs font-semibold tracking-widest text-brand-gold uppercase">
            Plataforma de capacitações
          </p>
          <h1 className="mb-3 font-heading text-3xl leading-tight font-extrabold text-foreground sm:text-4xl">
            Olá, {firstName}. Pronto para
            <br className="hidden sm:block" /> continuar aprendendo?
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Aprofunde suas habilidades em engenharia elétrica e automação com os cursos da
            WattLearnHouse.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: "Em progresso", value: inProgressCount, color: "text-brand-gold" },
            { label: "Concluídos", value: completedCount, color: "text-emerald-600" },
            { label: "Disponíveis", value: courses.length, color: "text-brand-navy" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-muted p-4 sm:p-5">
              <p className={cn("mb-0.5 font-heading text-2xl font-extrabold sm:text-3xl", stat.color)}>
                {stat.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <CourseCatalog courses={courses} />
      </main>
    </>
  );
}
