import { NextRequest, NextResponse } from "next/server";
import googleClient from "@/modules/auth/google.client";
import authService from "@/modules/auth/auth.service";
import sessionService from "@/modules/auth/session.service";

const REQUIRED_ENV_VARS = [
  "GOAUTH_CLIENT_ID",
  "GOAUTH_CLIENT_SECRET",
  "GOAUTH_REDIRECT_URI",
  "SESSION_SECRET",
] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missingEnvVars.length > 0) {
    console.error(
      `[auth/google/callback] Variáveis de ambiente ausentes: ${missingEnvVars.join(", ")}. ` +
        `redirect_uri configurado: ${process.env.GOAUTH_REDIRECT_URI ?? "(não definido)"}`,
    );
  }

  if (oauthError) {
    console.error(`[auth/google/callback] Google retornou erro no redirect: ${oauthError}`);
    return NextResponse.json({ error: "Erro na autenticação" }, { status: 400 });
  }

  if (!code) {
    console.error("[auth/google/callback] Callback chamado sem o parâmetro 'code'.");
    return NextResponse.json({ error: "Code não fornecido" }, { status: 400 });
  }

  let stage = "troca de código / busca de dados do usuário no Google";
  try {
    const googleUser = await googleClient.getUserInfo(code);

    stage = "validação/criação do usuário no banco";
    const user = await authService.validateGoogleUser(googleUser);

    stage = "geração da sessão";
    const token = await sessionService.encrypt({ userId: user.id });

    const response = NextResponse.redirect(new URL("/", request.url));

    response.cookies.set(sessionService.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionService.cookieMaxAge,
    });

    return response;
  } catch (error) {
    console.error(
      `[auth/google/callback] Falha na etapa "${stage}" | redirect_uri: ${process.env.GOAUTH_REDIRECT_URI ?? "(não definido)"} |`,
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    return NextResponse.json(
      { error: "Erro na autenticação" },
      { status: 500 },
    );
  }
}
