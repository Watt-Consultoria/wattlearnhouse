"use client";

import { createContext, useContext } from "react";
import type { User } from "@/generated/prisma/client";

export type AuthUser = Pick<User, "id" | "name" | "email" | "avatarUrl" | "role">;

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
