import { cache } from "react";
import { cookies } from "next/headers";
import prisma from "@/infra/database";
import sessionService from "./session.service";

class AuthService {
  getCurrentUser = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionService.cookieName)?.value;
    const session = await sessionService.decrypt(token);

    if (!session) {
      return null;
    }

    return prisma.user.findUnique({ where: { id: session.userId } });
  });

  async validateGoogleUser(googleUserInfo: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  }) {
    const { id: googleId, email, name, avatarUrl } = googleUserInfo;

    const user = await prisma.user.upsert({
      where: { googleId },
      update: { name, avatarUrl },
      create: { googleId, email, name, avatarUrl },
    });

    return user;
  }
}

const authService = new AuthService();

export default authService;
