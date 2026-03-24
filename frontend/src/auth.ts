import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      accessToken: data.token as string,
      refreshToken: data.refreshToken as string,
      tokenExpires: data.tokenExpires as number,
    };
  } catch {
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_URL}/auth/email/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const data = await res.json();
          // Backend returns: { token, refreshToken, tokenExpires, user }
          return {
            id: String(data.user.id),
            name:
              data.user.firstName && data.user.lastName
                ? `${data.user.firstName} ${data.user.lastName}`
                : data.user.email,
            email: data.user.email,
            image: data.user.photo?.path || undefined,
            accessToken: data.token,
            refreshToken: data.refreshToken,
            tokenExpires: data.tokenExpires,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in — persist tokens from authorize()
      if (user) {
        token.accessToken = (user as unknown as Record<string, unknown>).accessToken as string;
        token.refreshToken = (user as unknown as Record<string, unknown>).refreshToken as string;
        token.tokenExpires = (user as unknown as Record<string, unknown>).tokenExpires as number;
        token.userId = user.id;
        return token;
      }

      // Token still valid — return as-is
      const expires = token.tokenExpires as number | undefined;
      if (expires && Date.now() < expires) {
        return token;
      }

      // Token expired — attempt refresh
      const refreshToken = token.refreshToken as string | undefined;
      if (!refreshToken) {
        token.error = "RefreshTokenMissing";
        return token;
      }

      const refreshed = await refreshAccessToken(refreshToken);
      if (!refreshed) {
        token.error = "RefreshTokenExpired";
        return token;
      }

      token.accessToken = refreshed.accessToken;
      token.refreshToken = refreshed.refreshToken;
      token.tokenExpires = refreshed.tokenExpires;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.userId as string;
      }
      // Pass error to client so it can force re-login
      if (token.error) {
        (session as unknown as Record<string, unknown>).error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
});
