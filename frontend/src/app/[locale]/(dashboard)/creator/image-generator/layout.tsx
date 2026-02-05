import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Image Generator - Create Stunning Images with AI | Creator Studio',
    description: 'Generate high-quality images using AI models like FLUX, Imagen 3, Midjourney, and DALL-E 3. Create professional artwork, product photos, and creative visuals in seconds.',
    keywords: [
        'AI image generator',
        'text to image',
        'AI art generator',
        'FLUX AI',
        'Imagen 3',
        'Midjourney alternative',
        'DALL-E 3',
        'AI artwork',
        'generate images with AI',
        'AI photo generator',
        'creative AI tools'
    ],
    openGraph: {
        title: 'AI Image Generator - Create Stunning Images with AI',
        description: 'Generate high-quality images using AI models like FLUX, Imagen 3, Midjourney, and DALL-E 3.',
        type: 'website',
        images: [
            {
                url: '/og/image-generator.png',
                width: 1200,
                height: 630,
                alt: 'AI Image Generator Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AI Image Generator - Create Stunning Images with AI',
        description: 'Generate high-quality images using AI models like FLUX, Imagen 3, Midjourney, and DALL-E 3.',
        images: ['/og/image-generator.png'],
    },
    alternates: {
        canonical: '/creator/image-generator',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function ImageGeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
