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
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!typedSession || !hasAccessToken || hasAuthError) {
        return null;
    }

    return <>{children}</>;
}
