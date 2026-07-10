import { NextRequest, NextResponse } from "next/server";
import googleClient from "@/modules/auth/google.client";
import authService from "@/modules/auth/auth.service";

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

    response.cookies.set("session_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Erro na autenticação" },
      { status: 500 },
    );
  }
}
