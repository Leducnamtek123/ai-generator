import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Skin Enhancer - Portrait Retouching | Creator Studio',
    description: 'Enhance and retouch skin in photos with AI. Natural-looking results for portrait photography.',
    alternates: { canonical: '/creator/skin-enhancer' },
    robots: { index: true, follow: true },
};

export default function SkinEnhancerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
