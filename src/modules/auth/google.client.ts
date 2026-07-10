interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfoResponse {
  id: string;
  email: string;
  name: string;
  picture: string;
}

class GoogleClient {
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: process.env.GOAUTH_CLIENT_ID!,
      redirect_uri: process.env.GOAUTH_REDIRECT_URI!,
      response_type: "code",
      scope: "openid email profile",
      access_type: "online",
      prompt: "select_account",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async getUserInfo(code: string) {
    const accessToken = await this.exchangeCodeForToken(code);
    return this.fetchUserInfo(accessToken);
  }

  private async exchangeCodeForToken(code: string) {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOAUTH_CLIENT_ID!,
        client_secret: process.env.GOAUTH_CLIENT_SECRET!,
        redirect_uri: process.env.GOAUTH_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Falha ao trocar o código pelo token do Google: ${response.status} ${await response.text()}`,
      );
    }

    const data: GoogleTokenResponse = await response.json();
    return data.access_token;
  }

  private async fetchUserInfo(accessToken: string) {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Falha ao buscar informações do usuário no Google: ${response.status} ${await response.text()}`,
      );
    }

    const data: GoogleUserInfoResponse = await response.json();

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.picture,
    };
  }
}

const googleClient = new GoogleClient();

export default googleClient;
