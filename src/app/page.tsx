import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import authService from "@/modules/auth/auth.service";

export default async function HomePage() {
  const user = await authService.getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-muted">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Olá, {user.name}!
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Você está autenticado.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
