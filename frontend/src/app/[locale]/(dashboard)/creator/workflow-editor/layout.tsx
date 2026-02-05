import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Workflow Editor - Visual AI Pipeline Builder | Creator Studio',
    description: 'Build complex AI pipelines visually with our drag-and-drop workflow editor. Connect text, image, video, and audio AI models to create powerful automation workflows.',
    keywords: [
        'AI workflow editor',
        'visual AI builder',
        'AI pipeline',
        'node-based editor',
        'AI automation',
        'workflow automation',
        'AI node editor',
        'creative workflow',
        'AI tools pipeline',
        'visual programming AI'
    ],
    openGraph: {
        title: 'Workflow Editor - Visual AI Pipeline Builder',
        description: 'Build complex AI pipelines visually with our drag-and-drop workflow editor.',
        type: 'website',
        images: [
            {
                url: '/og/workflow-editor.png',
                width: 1200,
                height: 630,
                alt: 'Workflow Editor Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Workflow Editor - Visual AI Pipeline Builder',
        description: 'Build complex AI pipelines visually with our drag-and-drop workflow editor.',
        images: ['/og/workflow-editor.png'],
    },
    alternates: {
        canonical: '/creator/workflow-editor',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function WorkflowEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
