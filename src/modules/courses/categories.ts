export const COURSE_CATEGORIES = ["Automação", "Elétrica", "Marketing", "Comercial"] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

export function isCourseCategory(value: string): value is CourseCategory {
  return (COURSE_CATEGORIES as readonly string[]).includes(value);
}
