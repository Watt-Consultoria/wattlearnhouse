"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/modules/auth/auth.context";

export function HomeView() {
  const user = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-muted">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Olá, {user?.name}!
            </CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            Você está autenticado.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
