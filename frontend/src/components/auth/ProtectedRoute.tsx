'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const loading = status === "loading";
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && status !== "loading") {
            if (!session) {
                console.log('Redirecting to sign-in...');
                router.push('/sign-in');
            }
        }
    }, [session, status, router, mounted]);

    if (!mounted || loading) {
        return <div className="flex items-center justify-center min-h-screen bg-[#0B0C0E]"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
    }

    if (!session) {
        return null;
    }

    return <>{children}</>;
}
