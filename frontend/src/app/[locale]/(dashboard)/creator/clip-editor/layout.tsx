import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Clip Editor - Quick Video Editing | Creator Studio',
    description: 'Quick and easy clip editing. Trim, cut, and rearrange video clips with precision.',
    alternates: { canonical: '/creator/clip-editor' },
    robots: { index: true, follow: true },
};

export default function ClipEditorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
