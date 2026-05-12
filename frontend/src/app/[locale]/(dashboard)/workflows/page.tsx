'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function WorkflowsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/creator/workflow-editor');
    }, [router]);

    return <div className="min-h-screen bg-background text-foreground" aria-live="polite" />;
}
