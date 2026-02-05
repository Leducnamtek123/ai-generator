import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Image Upscaler - Enhance Images with AI | Creator Studio',
    description: 'Upscale and enhance your images up to 8x resolution with AI. Improve quality, reduce noise, and enhance faces automatically.',
    keywords: ['AI image upscaler', 'image enhancement', 'upscale image', 'enhance resolution', 'AI upscaling'],
    alternates: { canonical: '/creator/image-upscaler' },
    robots: { index: true, follow: true },
};

export default function ImageUpscalerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
