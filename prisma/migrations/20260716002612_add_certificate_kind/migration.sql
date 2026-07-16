-- CreateEnum
CREATE TYPE "CertificateKind" AS ENUM ('student_completion', 'teacher_authorship');

-- DropIndex
DROP INDEX "idx_certificates_user_course";

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "kind" "CertificateKind" NOT NULL DEFAULT 'student_completion';

-- CreateIndex
CREATE UNIQUE INDEX "idx_certificates_user_course_kind" ON "certificates"("user_id", "course_id", "kind");
