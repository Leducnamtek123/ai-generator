import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Background Remover - Remove Backgrounds Instantly | Creator Studio',
    description: 'Remove backgrounds from images instantly with AI. Perfect for product photos and portraits.',
    alternates: { canonical: '/creator/bg-remover' },
    robots: { index: true, follow: true },
};

export default function BgRemoverLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
