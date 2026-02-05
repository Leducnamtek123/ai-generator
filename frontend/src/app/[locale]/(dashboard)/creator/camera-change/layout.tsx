import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Camera Change - Transform Perspectives | Creator Studio',
    description: 'Change camera angles and perspectives in your images with AI. Transform viewpoints instantly.',
    alternates: { canonical: '/creator/camera-change' },
    robots: { index: true, follow: true },
};

export default function CameraChangeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
