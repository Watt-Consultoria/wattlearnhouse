import { redirect } from "next/navigation";
import { HomeView } from "@/view/home";
import authService from "@/modules/auth/auth.service";

export default async function HomePage() {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <HomeView />;
}
