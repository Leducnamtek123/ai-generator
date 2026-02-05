import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Icon Generator - Create Custom Icons | Creator Studio',
    description: 'Generate custom icons with AI. Create app icons, logos, and vector graphics in any style.',
    alternates: { canonical: '/creator/icon-generator' },
    robots: { index: true, follow: true },
};

export default function IconGeneratorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
