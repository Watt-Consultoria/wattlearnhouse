import { redirect } from "next/navigation";
import authService from "@/modules/auth/auth.service";
import authoringService from "@/modules/courses/authoring.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { LessonEditor } from "@/modules/courses/components/lesson-editor";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/courses");
  }

  const { courseId, moduleId, lessonId } = await params;
  const lesson = await authoringService.getLessonForTeacher(lessonId, user.id, user.role);
  if (!lesson || lesson.module.id !== moduleId || lesson.module.courseId !== courseId) {
    redirect("/teacher/courses");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: "Meus cursos", href: "/teacher/courses" },
            { label: lesson.module.courseTitle, href: `/teacher/courses/${courseId}` },
            {
              label: lesson.module.title,
              href: `/teacher/courses/${courseId}/modules/${moduleId}`,
            },
            { label: lesson.title },
          ]}
        />

        <LessonEditor
          mode="edit"
          courseId={courseId}
          moduleId={moduleId}
          moduleTitle={lesson.module.title}
          lessonId={lesson.id}
          initialTitle={lesson.title}
          initialContent={lesson.content}
        />
      </main>
    </div>
  );
}
