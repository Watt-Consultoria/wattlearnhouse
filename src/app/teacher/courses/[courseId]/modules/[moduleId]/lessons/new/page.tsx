import { redirect } from "next/navigation";
import authService from "@/modules/auth/auth.service";
import authoringService from "@/modules/courses/authoring.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { LessonEditor } from "@/modules/courses/components/lesson-editor";

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher") {
    redirect("/courses");
  }

  const { courseId, moduleId } = await params;
  const courseModule = await authoringService.getModuleForTeacher(moduleId, user.id);
  if (!courseModule || courseModule.course.id !== courseId) {
    redirect("/teacher/courses");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: "Meus cursos", href: "/teacher/courses" },
            { label: courseModule.course.title, href: `/teacher/courses/${courseId}` },
            {
              label: courseModule.title,
              href: `/teacher/courses/${courseId}/modules/${moduleId}`,
            },
            { label: "Nova aula" },
          ]}
        />

        <LessonEditor
          mode="create"
          courseId={courseId}
          moduleId={moduleId}
          moduleTitle={courseModule.title}
        />
      </main>
    </div>
  );
}
