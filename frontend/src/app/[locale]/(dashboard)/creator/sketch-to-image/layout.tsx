import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Sketch to Image - Transform Drawings | Creator Studio',
    description: 'Transform your sketches and drawings into realistic images with AI. From doodles to masterpieces.',
    alternates: { canonical: '/creator/sketch-to-image' },
    robots: { index: true, follow: true },
};

export default function SketchToImageLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
