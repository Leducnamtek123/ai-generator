'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function SocialDashboardPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/social');
    }, [router]);

    return <div className="min-h-screen bg-background text-foreground" aria-live="polite" />;
}
