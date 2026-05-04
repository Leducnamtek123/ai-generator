import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import axios from "axios";

const API_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api/v1"
).replace(/\/+$/, "");

function toEpochMs(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;

  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;

  // Convert seconds to ms if needed.
  return num < 10_000_000_000 ? num * 1000 : num;
}

async function refreshAccessToken(refreshToken: string) {
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data = res.data;
    return {
      accessToken: data.token as string,
      refreshToken: data.refreshToken as string,
      tokenExpires: data.tokenExpires as number | string,
    };
  } catch {
    return null;
  }
}

export const { handlers, auth } = NextAuth({
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
          const res = await axios.post(`${API_URL}/auth/email/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          const data = res.data;
          console.debug("[Auth] Backend login success:", {
            hasToken: !!data.token,
            hasUser: !!data.user,
          });

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
    async jwt({ token, user, account }) {
      // If logging in via Google OAuth, exchange id_token for backend tokens.
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await axios.post(`${API_URL}/auth/google/login`, {
            idToken: account.id_token,
          });

          const data = res.data;
          token.accessToken = data.token;
          token.refreshToken = data.refreshToken;
          token.tokenExpires = data.tokenExpires;
          token.userId = String(data.user?.id || user?.id);
          token.error = undefined;
          return token;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error("Google login failed", error.response?.data);
          } else {
            console.error("Google login error", error);
          }
          token.error = "GoogleLoginFailed";
        }
      }

      // Initial sign-in from credentials provider.
      const userAccessToken = (user as Record<string, unknown> | undefined)
        ?.accessToken as string | undefined;

      if (user && userAccessToken) {
        token.accessToken = userAccessToken;
        token.refreshToken = (user as Record<string, unknown>).refreshToken as
          | string
          | undefined;
        token.tokenExpires = (user as Record<string, unknown>).tokenExpires as
          | number
          | string
          | undefined;
        token.userId = user.id;
        token.error = undefined;
        return token;
      }

      const expiresMs = toEpochMs(token.tokenExpires);
      const hasAccessToken = Boolean(token.accessToken);
      const refreshSkewMs = 15_000;

      // Keep current token when it is still valid.
      if (hasAccessToken && expiresMs && Date.now() < expiresMs - refreshSkewMs) {
        token.error = undefined;
        return token;
      }

      // If expiry is missing/invalid but access token exists, do not force-refresh.
      if (hasAccessToken && !expiresMs) {
        token.error = undefined;
        return token;
      }

      // Token is missing or expired, attempt refresh.
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
      token.error = undefined;
      return token;
    },
    async session({ session, token }) {
      console.debug(
        "[Auth] Mapping token to session. Token has accessToken:",
        !!token.accessToken
      );
      session.accessToken = token.accessToken as string;
      if (session.user) {
        session.user.id = token.userId as string;
        // Keep token accessible in both locations for legacy consumers.
        session.user.accessToken = token.accessToken as string;
      }
      // Pass error to client so it can force re-login.
      if (token.error) {
        console.warn("[Auth] Session carries error:", token.error);
        (session as { error?: string }).error = token.error as string;
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
