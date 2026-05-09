"use client";

import React, { createContext, use, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    role?: {
        id?: string | number | null;
        name?: string | null;
    } | null;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthSessionUser = {
    id?: string;
    username?: string;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
    name?: string | null;
    accessToken?: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: User["role"];
};

type AuthSessionLike = {
    error?: string;
    accessToken?: string;
    user?: AuthSessionUser;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const { push } = useRouter();
    const authSession = session as AuthSessionLike | null | undefined;
    const hasAuthError = Boolean(authSession?.error);
    const hasAccessToken = Boolean(authSession?.accessToken || authSession?.user?.accessToken);

    const user = useMemo(() => {
        if (!session?.user || !hasAccessToken || hasAuthError) return null;
        const u = authSession?.user;
        if (!u) return null;
        return {
            id: u.id || "",
            username: u.username || u.email || "",
            email: u.email || "",
            avatar: u.image || u.avatar || `https://ui-avatars.com/api/?name=${u.name || u.email}`,
            firstName: u.firstName ?? undefined,
            lastName: u.lastName ?? undefined,
            role: u.role ?? null,
        };
    }, [authSession, hasAccessToken, hasAuthError, session]);

    const login = () => {
        // With NextAuth, login is handled by signIn() in the pages
        // This remains for backward compatibility if needed
        console.warn("login() called via AuthProvider. Use signIn() from next-auth/react instead.");
        push("/dashboard");
    };

    const logout = async () => {
        await signOut({ redirect: false });
        push("/");
    };

    const isLoading = status === "loading";

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = use(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
