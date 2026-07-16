-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "full_name" TEXT;

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "verification_code" TEXT NOT NULL,
    "full_name_snapshot" TEXT NOT NULL,
    "cpf_snapshot" TEXT NOT NULL,
    "course_title_snapshot" TEXT NOT NULL,
    "modules_snapshot" JSONB NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");

-- CreateIndex
CREATE INDEX "idx_certificates_course_id" ON "certificates"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_certificates_user_course" ON "certificates"("user_id", "course_id");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
