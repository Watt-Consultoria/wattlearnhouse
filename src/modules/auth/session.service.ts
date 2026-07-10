import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = "7d";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionPayload extends JWTPayload {
  userId: string;
}

class SessionService {
  readonly cookieName = SESSION_COOKIE_NAME;
  readonly cookieMaxAge = SESSION_DURATION_MS / 1000;

  async encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(SESSION_DURATION)
      .sign(this.secretKey());
  }

  async decrypt(token: string | undefined) {
    if (!token) {
      return null;
    }

    try {
      const { payload } = await jwtVerify<SessionPayload>(
        token,
        this.secretKey(),
        { algorithms: ["HS256"] },
      );
      return payload;
    } catch {
      return null;
    }
  }

  private secretKey() {
    const secret = process.env.SESSION_SECRET;

    if (!secret) {
      throw new Error("SESSION_SECRET não está configurado");
    }

    return new TextEncoder().encode(secret);
  }
}

const sessionService = new SessionService();

export default sessionService;
