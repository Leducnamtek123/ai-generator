import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Lip Sync - Realistic Video Lip Syncing | Creator Studio',
    description: 'Create realistic lip-synced videos with AI. Match audio to video with perfect synchronization.',
    alternates: { canonical: '/creator/lip-sync' },
    robots: { index: true, follow: true },
};

export default function LipSyncLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
