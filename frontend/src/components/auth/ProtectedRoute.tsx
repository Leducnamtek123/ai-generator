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

    useEffect(() => {
        if (status === 'loading') return;
        if (!typedSession || !hasAccessToken) {
            window.location.replace('/sign-in');
        }
    }, [typedSession, status, hasAccessToken]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-[#0B0C0E]"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
    }

    if (!typedSession || !hasAccessToken) {
        return null;
    }

    return <>{children}</>;
}
