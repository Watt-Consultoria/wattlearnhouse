import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TEACHER_GOOGLE_ID = "seed-teacher-google-id";
const COURSE_ID = "00000000-0000-0000-0000-000000000001";
const MODULE_ID = "00000000-0000-0000-0000-000000000002";
const LESSON_ID = "00000000-0000-0000-0000-000000000003";

async function main() {
  const teacherData = {
    googleId: TEACHER_GOOGLE_ID,
    name: "Professor de Teste",
    email: "professor.teste@wattlearn.dev",
    role: "teacher" as const,
  };
  const teacher = await prisma.user.upsert({
    where: { googleId: TEACHER_GOOGLE_ID },
    update: teacherData,
    create: teacherData,
  });

  const courseData = {
    teacherId: teacher.id,
    title: "Curso de Teste",
    description: "Curso criado pelo script de seed para fins de teste.",
  };
  const course = await prisma.course.upsert({
    where: { id: COURSE_ID },
    update: courseData,
    create: { id: COURSE_ID, ...courseData },
  });

  const moduleData = {
    courseId: course.id,
    title: "Módulo de Teste",
    order: 1,
  };
  const courseModule = await prisma.module.upsert({
    where: { id: MODULE_ID },
    update: moduleData,
    create: { id: MODULE_ID, ...moduleData },
  });

  const lessonData = {
    moduleId: courseModule.id,
    title: "Aula de Teste",
    content:
      "# Aula de teste\n\nConteúdo em **Markdown** de exemplo.\n\n[youtube_video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
    order: 1,
  };
  await prisma.lesson.upsert({
    where: { id: LESSON_ID },
    update: lessonData,
    create: { id: LESSON_ID, ...lessonData },
  });

  console.log("Seed concluído: 1 curso, 1 módulo e 1 aula de teste.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
