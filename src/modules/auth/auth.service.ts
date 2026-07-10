import { cookies } from "next/headers";
import prisma from "@/infra/database";

class AuthService {
  async getCurrentUser() {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return null;
    }

    return prisma.user.findUnique({ where: { id: sessionId } });
  }

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
