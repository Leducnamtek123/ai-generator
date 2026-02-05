import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Image Editor - Edit Images with AI | Creator Studio',
    description: 'Edit and enhance your images with AI-powered tools. Crop, adjust colors, retouch, and transform your photos.',
    alternates: { canonical: '/creator/image-editor' },
    robots: { index: true, follow: true },
};

export default function ImageEditorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
