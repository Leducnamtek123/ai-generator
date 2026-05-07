import "next-auth";

type SessionRole = {
  id?: string | number | null;
  name?: string | null;
};

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      accessToken?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: SessionRole | null;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    tokenExpires?: number | string;
    role?: SessionRole | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    tokenExpires?: number | string;
    userId?: string;
    role?: SessionRole | null;
    error?: string;
  }
}
