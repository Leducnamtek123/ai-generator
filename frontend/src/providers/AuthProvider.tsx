"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const hasAccessToken = Boolean(
        (session as any)?.accessToken || (session as any)?.user?.accessToken
    );

    const user = useMemo(() => {
        if (!session?.user || !hasAccessToken) return null;
        const u = session.user as any;
        return {
            id: u.id || "",
            username: u.username || u.email || "",
            email: u.email || "",
            avatar: u.image || u.avatar || `https://ui-avatars.com/api/?name=${u.name || u.email}`,
            firstName: u.firstName,
            lastName: u.lastName,
        };
    }, [session, hasAccessToken]);

    const login = (userData: User) => {
        // With NextAuth, login is handled by signIn() in the pages
        // This remains for backward compatibility if needed
        console.warn("login() called via AuthProvider. Use signIn() from next-auth/react instead.");
        router.push("/dashboard");
    };

    const logout = async () => {
        await signOut({ redirect: false });
        router.push("/");
    };

    const isLoading = status === "loading";

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
