import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/email/login`, {
                        method: "POST",
                        body: JSON.stringify(credentials),
                        headers: { "Content-Type": "application/json" },
                    });

                    const data = await res.json();

                    if (res.ok && data.token) {
                        return {
                            id: data.user.id,
                            name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim() || data.user.email,
                            email: data.user.email,
                            accessToken: data.token,
                            refreshToken: data.refreshToken,
                            expires: data.tokenExpires,
                            user: data.user
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
                token.refreshToken = (user as any).refreshToken;
                token.user = (user as any).user;
            }
            return token;
        },
        async session({ session, token }) {
            (session as any).accessToken = token.accessToken;
            (session as any).user = token.user as any;
            return session;
        },
    },
    pages: {
        signIn: "/sign-in",
    },
    secret: process.env.AUTH_SECRET,
});
