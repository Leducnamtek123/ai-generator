import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Video Upscaler - Enhance Video Quality | Creator Studio',
    description: 'Upscale your videos to 4K or higher resolution with AI. Enhance quality and reduce noise.',
    alternates: { canonical: '/creator/video-upscaler' },
    robots: { index: true, follow: true },
};

export default function VideoUpscalerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
