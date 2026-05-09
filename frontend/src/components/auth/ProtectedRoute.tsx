'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

type SessionWithAccessToken = Session & {
    accessToken?: string;
    user?: Session['user'] & {
        accessToken?: string;
    };
};

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const typedSession = session as SessionWithAccessToken | null;
    const loading = status === "loading";
    const hasAccessToken = Boolean(
        typedSession?.accessToken || typedSession?.user?.accessToken
    );
    const hasAuthError = Boolean(typedSession?.error);

    useEffect(() => {
        if (status === 'loading') return;
        if (!typedSession || !hasAccessToken || hasAuthError) {
            const nextPath = `${window.location.pathname}${window.location.search}`;
            window.location.replace(`/sign-in?next=${encodeURIComponent(nextPath)}`);
        }
    }, [typedSession, status, hasAccessToken, hasAuthError]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-[#0B0C0E]"><div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
    }

    if (!typedSession || !hasAccessToken || hasAuthError) {
        return null;
    }

    return <>{children}</>;
}
