export type ModuleProgressInput = {
  id: string;
  lessonIds: string[];
  quizId: string | null;
};

export type ModuleProgressResult = {
  id: string;
  progressPercent: number;
  lessonsComplete: boolean;
  quizPassed: boolean | null;
  complete: boolean;
  unlocked: boolean;
};

/**
 * Regra de desbloqueio: o módulo 0 é sempre acessível; um módulo N só é
 * desbloqueado quando o módulo N-1 está 100% completo (todas as aulas
 * concluídas e, se houver quiz, aprovado). Reutilizada tanto na renderização
 * (para desenhar o cadeado) quanto nas Server Actions (checagem no servidor).
 */
export function computeModulesProgress(
  modules: ModuleProgressInput[],
  completedLessonIds: ReadonlySet<string>,
  passedQuizIds: ReadonlySet<string>,
): ModuleProgressResult[] {
  const results: ModuleProgressResult[] = [];
  let previousComplete = true;

  for (const courseModule of modules) {
    const total = courseModule.lessonIds.length;
    const completedCount = courseModule.lessonIds.filter((id) =>
      completedLessonIds.has(id),
    ).length;
    const lessonsComplete = total === 0 || completedCount === total;
    const quizPassed = courseModule.quizId
      ? passedQuizIds.has(courseModule.quizId)
      : null;
    const complete =
      lessonsComplete && (courseModule.quizId ? quizPassed === true : true);

    results.push({
      id: courseModule.id,
      progressPercent: total === 0 ? 100 : Math.round((completedCount / total) * 100),
      lessonsComplete,
      quizPassed,
      complete,
      unlocked: previousComplete,
    });

    previousComplete = complete;
  }

  return results;
}

export function computeCourseProgress(
  modules: { lessonIds: string[] }[],
  completedLessonIds: ReadonlySet<string>,
): number {
  const totalLessons = modules.reduce((sum, module) => sum + module.lessonIds.length, 0);
  if (totalLessons === 0) {
    return 0;
  }

  const completedLessons = modules.reduce(
    (sum, module) =>
      sum + module.lessonIds.filter((id) => completedLessonIds.has(id)).length,
    0,
  );

  return Math.round((completedLessons / totalLessons) * 100);
}
