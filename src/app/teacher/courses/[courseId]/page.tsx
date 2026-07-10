import { redirect } from "next/navigation";
import authService from "@/modules/auth/auth.service";
import authoringService from "@/modules/courses/authoring.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { CourseMetadataForm } from "@/modules/courses/components/course-metadata-form";
import { ModuleListManager } from "@/modules/courses/components/module-list-manager";

export default async function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher") {
    redirect("/courses");
  }

  const { courseId } = await params;
  const course = await authoringService.getCourseForTeacher(courseId, user.id);
  if (!course) {
    redirect("/teacher/courses");
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Breadcrumb
          items={[{ label: "Meus cursos", href: "/teacher/courses" }, { label: course.title }]}
        />

        <CourseMetadataForm course={course} />
        <ModuleListManager courseId={course.id} modules={course.modules} />
      </main>
    </>
  );
}
