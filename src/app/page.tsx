import { redirect } from "next/navigation";
import authService from "@/modules/auth/auth.service";

export default async function HomePage() {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect("/courses");
}
