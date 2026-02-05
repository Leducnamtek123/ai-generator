import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Image Extender - Outpainting with AI | Creator Studio',
    description: 'Extend your images beyond their original boundaries with AI outpainting technology.',
    alternates: { canonical: '/creator/image-extender' },
    robots: { index: true, follow: true },
};

export default function ImageExtenderLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
