import { redirect } from "next/navigation";
import authService from "@/modules/auth/auth.service";
import authoringService from "@/modules/courses/authoring.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { ModuleTitleForm } from "@/modules/courses/components/module-title-form";
import { LessonListManager } from "@/modules/courses/components/lesson-list-manager";
import { QuizManager } from "@/modules/courses/components/quiz-manager";

export default async function TeacherModuleDetailPage({
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
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[
            { label: "Meus cursos", href: "/teacher/courses" },
            { label: courseModule.course.title, href: `/teacher/courses/${courseId}` },
            { label: courseModule.title },
          ]}
        />

        <div className="flex flex-col gap-6">
          <ModuleTitleForm moduleId={courseModule.id} title={courseModule.title} />
          <LessonListManager
            courseId={courseId}
            moduleId={courseModule.id}
            lessons={courseModule.lessons}
          />
          <QuizManager moduleId={courseModule.id} quiz={courseModule.quiz} />
        </div>
      </main>
    </>
  );
}
