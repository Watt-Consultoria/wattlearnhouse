-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "wattlearnhouse";

-- CreateEnum
CREATE TYPE "wattlearnhouse"."UserRole" AS ENUM ('student', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "wattlearnhouse"."CertificateKind" AS ENUM ('student_completion', 'teacher_authorship');

-- CreateTable
CREATE TABLE "wattlearnhouse"."users" (
    "id" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "full_name" TEXT,
    "cpf" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "role" "wattlearnhouse"."UserRole" NOT NULL DEFAULT 'student',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."courses" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."certificates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "kind" "wattlearnhouse"."CertificateKind" NOT NULL DEFAULT 'student_completion',
    "verification_code" TEXT NOT NULL,
    "full_name_snapshot" TEXT NOT NULL,
    "cpf_snapshot" TEXT NOT NULL,
    "course_title_snapshot" TEXT NOT NULL,
    "modules_snapshot" JSONB NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."lessons" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."quizzes" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."quiz_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correct_index" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."quiz_attempts" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wattlearnhouse"."lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "wattlearnhouse"."users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "wattlearnhouse"."users"("email");

-- CreateIndex
CREATE INDEX "idx_courses_teacher_id" ON "wattlearnhouse"."courses"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_enrollments_course_id" ON "wattlearnhouse"."enrollments"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_enrollments_user_course" ON "wattlearnhouse"."enrollments"("user_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "wattlearnhouse"."certificates"("verification_code");

-- CreateIndex
CREATE INDEX "idx_certificates_course_id" ON "wattlearnhouse"."certificates"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_certificates_user_course_kind" ON "wattlearnhouse"."certificates"("user_id", "course_id", "kind");

-- CreateIndex
CREATE INDEX "idx_modules_course_id" ON "wattlearnhouse"."modules"("course_id");

-- CreateIndex
CREATE INDEX "idx_lessons_module_id" ON "wattlearnhouse"."lessons"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_module_id_key" ON "wattlearnhouse"."quizzes"("module_id");

-- CreateIndex
CREATE INDEX "idx_quiz_questions_quiz_id" ON "wattlearnhouse"."quiz_questions"("quiz_id");

-- CreateIndex
CREATE INDEX "idx_quiz_attempts_quiz_id" ON "wattlearnhouse"."quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "idx_quiz_attempts_user_id" ON "wattlearnhouse"."quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_lesson_progress_lesson_id" ON "wattlearnhouse"."lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_lesson_progress_user_lesson" ON "wattlearnhouse"."lesson_progress"("user_id", "lesson_id");

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "wattlearnhouse"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wattlearnhouse"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "wattlearnhouse"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wattlearnhouse"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "wattlearnhouse"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "wattlearnhouse"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "wattlearnhouse"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."quizzes" ADD CONSTRAINT "quizzes_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "wattlearnhouse"."modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "wattlearnhouse"."quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "wattlearnhouse"."quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wattlearnhouse"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "wattlearnhouse"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wattlearnhouse"."lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "wattlearnhouse"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
