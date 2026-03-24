'use client';

import { Film, Layers, Scissors } from 'lucide-react';

export default function VideoEditorPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-6">
                    <Film className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-3">Video Project Editor</h1>
                <p className="text-muted-foreground mb-8">
                    Professional video editing with AI-powered tools. Cut, trim, merge, and enhance your videos.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2"><Scissors className="w-4 h-4" /> Cut</span>
                    <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Timeline</span>
                </div>
                <p className="text-xs text-muted-foreground/50 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
