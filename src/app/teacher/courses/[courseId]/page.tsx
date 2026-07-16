import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import authService from "@/modules/auth/auth.service";
import authoringService from "@/modules/courses/authoring.service";
import certificatesService from "@/modules/certificates/certificates.service";
import { Navbar } from "@/modules/courses/components/navbar";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { CourseMetadataForm } from "@/modules/courses/components/course-metadata-form";
import { ModuleListManager } from "@/modules/courses/components/module-list-manager";
import { IssueAuthorshipCertificatePanel } from "@/modules/certificates/components/issue-authorship-certificate-panel";

export default async function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await authService.getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "teacher" && user.role !== "admin") {
    redirect("/courses");
  }

  const { courseId } = await params;
  const course = await authoringService.getCourseForTeacher(courseId, user.id, user.role);
  if (!course) {
    redirect("/teacher/courses");
  }

  // Certificado de autoria atesta que o próprio usuário criou/lecionou o curso — só
  // faz sentido para o dono real, mesmo que um admin também possa editar este curso.
  const isActualOwner = course.teacherId === user.id;
  const authorshipCertificate = isActualOwner
    ? await certificatesService.getCertificateForUserCourse(course.id, user.id, "teacher_authorship")
    : null;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <Breadcrumb
            items={[{ label: "Meus cursos", href: "/teacher/courses" }, { label: course.title }]}
          />
          <div className="flex flex-wrap items-start justify-end gap-2">
            {isActualOwner && (
              <IssueAuthorshipCertificatePanel
                courseId={course.id}
                hasCertificate={!!authorshipCertificate}
              />
            )}
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/teacher/courses/${course.id}/stats`} />}
            >
              <BarChart3 className="size-4" />
              Estatísticas
            </Button>
          </div>
        </div>

        <CourseMetadataForm course={course} />
        <ModuleListManager courseId={course.id} modules={course.modules} />
      </main>
    </>
  );
}
