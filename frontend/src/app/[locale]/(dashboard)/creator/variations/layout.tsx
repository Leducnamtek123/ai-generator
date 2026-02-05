import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Image Variations - Generate Image Variations | Creator Studio',
    description: 'Generate multiple variations of your images with AI. Create different styles and compositions.',
    alternates: { canonical: '/creator/variations' },
    robots: { index: true, follow: true },
};

export default function VariationsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
