import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Video Generator - Create Videos from Text & Images | Creator Studio',
    description: 'Generate stunning AI videos from text prompts or images. Use Runway, Sora, Pika, and Kling AI models to create cinematic videos, animations, and visual effects.',
    keywords: [
        'AI video generator',
        'text to video',
        'image to video',
        'Runway Gen-3',
        'Sora alternative',
        'Pika Labs',
        'Kling AI',
        'AI video creator',
        'generate videos with AI',
        'AI animation',
        'video AI tools'
    ],
    openGraph: {
        title: 'AI Video Generator - Create Videos from Text & Images',
        description: 'Generate stunning AI videos from text prompts or images using Runway, Sora, Pika, and Kling AI models.',
        type: 'website',
        images: [
            {
                url: '/og/video-generator.png',
                width: 1200,
                height: 630,
                alt: 'AI Video Generator Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Video Generator - Create Videos from Text & Images',
        description: 'Generate stunning AI videos from text prompts or images using Runway, Sora, Pika, and Kling AI models.',
        images: ['/og/video-generator.png'],
    },
    alternates: {
        canonical: '/creator/video-generator',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function VideoGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
