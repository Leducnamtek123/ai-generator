import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Music Generator - Create Original Music with AI | Creator Studio',
    description: 'Generate royalty-free music, soundtracks, and audio with AI. Create custom songs, background music, and sound effects for videos, games, and podcasts.',
    keywords: [
        'AI music generator',
        'text to music',
        'AI song generator',
        'music AI',
        'generate music with AI',
        'AI soundtrack',
        'royalty-free music generator',
        'AI audio generator',
        'create music online',
        'AI composer'
    ],
    openGraph: {
        title: 'AI Music Generator - Create Original Music with AI',
        description: 'Generate royalty-free music, soundtracks, and audio with AI for videos, games, and podcasts.',
        type: 'website',
        images: [
            {
                url: '/og/music-generator.png',
                width: 1200,
                height: 630,
                alt: 'AI Music Generator Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Music Generator - Create Original Music with AI',
        description: 'Generate royalty-free music, soundtracks, and audio with AI for videos, games, and podcasts.',
        images: ['/og/music-generator.png'],
    },
    alternates: {
        canonical: '/creator/music-generator',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function MusicGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
