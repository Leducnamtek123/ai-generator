import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Mockup Generator - Product Mockups with AI | Creator Studio',
    description: 'Generate professional product mockups with AI. Perfect for presentations and marketing materials.',
    alternates: { canonical: '/creator/mockup-generator' },
    robots: { index: true, follow: true },
};

export default function MockupGeneratorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
