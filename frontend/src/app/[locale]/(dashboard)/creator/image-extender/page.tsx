'use client';

import { Maximize } from 'lucide-react';

export default function ImageExtenderPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-6">
                    <Maximize className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-3">Image Extender</h1>
                <p className="text-muted-foreground mb-8">
                    Extend your images beyond their original boundaries with AI outpainting. Perfect for expanding backgrounds.
                </p>
                <p className="text-xs text-muted-foreground/50 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
