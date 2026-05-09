import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import axios from "axios";
import type { JWT } from "next-auth/jwt";

const API_URL = (
  process.env.INTERNAL_API_URL ||
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost/api/v1"
).replace(/\/+$/, "");

function toEpochMs(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;

  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;

  // Convert seconds to ms if needed.
  return num < 10_000_000_000 ? num * 1000 : num;
}

function normalizeRole(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const role = value as { id?: string | number | null; name?: string | null };
  return {
    id: role.id ?? null,
    name: role.name ?? null,
  };
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

function clearAuthTokenState(token: JWT) {
  token.accessToken = undefined;
  token.refreshToken = undefined;
  token.tokenExpires = undefined;
}

export const { handlers } = NextAuth({
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
            role: normalizeRole(data.user?.role),
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
          token.role = normalizeRole(data.user?.role);
          token.error = undefined;
          return token;
        } catch (error) {
          clearAuthTokenState(token);
          token.userId = undefined;
          token.role = null;
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
        token.role = normalizeRole((user as Record<string, unknown>).role);
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
        clearAuthTokenState(token);
        token.error = "RefreshTokenMissing";
        return token;
      }

      const refreshed = await refreshAccessToken(refreshToken);
      if (!refreshed) {
        clearAuthTokenState(token);
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
      const hasAuthError = Boolean(token.error);
      session.accessToken = hasAuthError ? undefined : (token.accessToken as string);
      if (session.user) {
        if (!hasAuthError) {
          session.user.id = token.userId as string;
          session.user.role = normalizeRole(token.role);
        }
        // Keep token accessible in both locations for legacy consumers.
        session.user.accessToken = hasAuthError ? undefined : (token.accessToken as string);
      }
      // Pass error to client so it can force re-login.
      if (token.error) {
        (session as { error?: string }).error = token.error as string;
      } else {
        (session as { error?: string }).error = undefined;
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
