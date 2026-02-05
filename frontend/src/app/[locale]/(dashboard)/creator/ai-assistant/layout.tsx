import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Assistant - Intelligent Creative Helper | Creator Studio',
    description: 'Get AI-powered assistance for your creative projects. Generate prompts, enhance ideas, and get suggestions for images, videos, and music with our intelligent assistant.',
    keywords: [
        'AI assistant',
        'creative AI helper',
        'AI prompt generator',
        'AI idea enhancer',
        'creative assistant',
        'AI suggestions',
        'prompt engineering',
        'AI creative tools',
        'intelligent assistant',
        'AI content assistant'
    ],
    openGraph: {
        title: 'AI Assistant - Intelligent Creative Helper',
        description: 'Get AI-powered assistance for your creative projects with intelligent suggestions.',
        type: 'website',
        images: [
            {
                url: '/og/ai-assistant.png',
                width: 1200,
                height: 630,
                alt: 'AI Assistant Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Assistant - Intelligent Creative Helper',
        description: 'Get AI-powered assistance for your creative projects with intelligent suggestions.',
        images: ['/og/ai-assistant.png'],
    },
    alternates: {
        canonical: '/creator/ai-assistant',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function AIAssistantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
