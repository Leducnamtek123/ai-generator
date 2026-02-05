import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Design Editor - Create Designs with AI | Creator Studio',
    description: 'Create stunning designs with AI assistance. Templates, layouts, and smart design suggestions.',
    alternates: { canonical: '/creator/design-editor' },
    robots: { index: true, follow: true },
};

export default function DesignEditorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
