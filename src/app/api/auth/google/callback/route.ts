import { NextRequest, NextResponse } from "next/server";
import googleClient from "@/modules/auth/google.client";
import authService from "@/modules/auth/auth.service";
import sessionService from "@/modules/auth/session.service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code não fornecido" }, { status: 400 });
  }

  try {
    const googleUser = await googleClient.getUserInfo(code);

    const user = await authService.validateGoogleUser(googleUser);

    const response = NextResponse.redirect(new URL("/", request.url));

    const token = await sessionService.encrypt({ userId: user.id });

    response.cookies.set(sessionService.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionService.cookieMaxAge,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Erro na autenticação" },
      { status: 500 },
    );
  }
}
