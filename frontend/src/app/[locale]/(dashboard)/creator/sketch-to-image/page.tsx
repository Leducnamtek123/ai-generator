'use client';

import { PenTool } from 'lucide-react';

export default function SketchToImagePage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-6">
                    <PenTool className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-3">Sketch to Image</h1>
                <p className="text-muted-foreground mb-8">
                    Transform your sketches and drawings into realistic images with AI. From doodles to masterpieces.
                </p>
                <p className="text-xs text-muted-foreground/50 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
