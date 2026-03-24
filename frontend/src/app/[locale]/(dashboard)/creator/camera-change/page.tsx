'use client';

import { Camera, Sparkles } from 'lucide-react';

export default function CameraChangePage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-6">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-3">Change Camera</h1>
                <p className="text-muted-foreground mb-8">
                    Change camera angles and perspectives in your images with AI. Transform viewpoints instantly.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> New Feature
                </div>
                <p className="text-xs text-muted-foreground/50 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
