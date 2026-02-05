import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Video Editor - Edit Videos with AI | Creator Studio',
    description: 'Professional video editing with AI-powered tools. Cut, trim, merge, and enhance your videos.',
    alternates: { canonical: '/creator/video-editor' },
    robots: { index: true, follow: true },
};

export default function VideoEditorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
