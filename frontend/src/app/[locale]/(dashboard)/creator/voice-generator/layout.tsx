import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Voice Generator - Text to Speech | Creator Studio',
    description: 'Generate realistic human voices with AI. Text-to-speech, voice cloning, and multilingual support.',
    alternates: { canonical: '/creator/voice-generator' },
    robots: { index: true, follow: true },
};

export default function VoiceGeneratorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
