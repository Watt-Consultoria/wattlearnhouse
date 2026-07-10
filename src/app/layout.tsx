import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/modules/auth/auth.context";
import authService from "@/modules/auth/auth.service";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WattLearnHouse",
  description: "Plataforma de treinamento técnico WattLearnHouse",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await authService.getCurrentUser();

  return (
    <html
      lang="pt-br"
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        plusJakartaSans.variable,
        jetBrainsMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider
          user={
            user && {
              id: user.id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
              role: user.role,
            }
          }
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
