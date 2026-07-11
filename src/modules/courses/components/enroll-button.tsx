"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrollInCourse } from "@/modules/courses/actions";

export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleEnroll() {
    startTransition(async () => {
      const result = await enrollInCourse(courseId);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <Button variant="accent" size="lg" onClick={handleEnroll} disabled={isPending}>
      <GraduationCap className="size-4" />
      {isPending ? "Matriculando..." : "Matricular-se"}
    </Button>
  );
}
