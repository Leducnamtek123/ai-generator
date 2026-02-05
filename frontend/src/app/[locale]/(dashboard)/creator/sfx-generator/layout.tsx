import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Sound Effect Generator - Create SFX with AI | Creator Studio',
    description: 'Create custom sound effects with AI. From footsteps to explosions, generate any sound you need.',
    alternates: { canonical: '/creator/sfx-generator' },
    robots: { index: true, follow: true },
};

export default function SfxGeneratorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
