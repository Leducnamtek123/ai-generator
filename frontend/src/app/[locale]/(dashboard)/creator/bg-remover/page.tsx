'use client';

import { Eraser } from 'lucide-react';

export default function BgRemoverPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-6">
                    <Eraser className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-3">Background Remover</h1>
                <p className="text-muted-foreground mb-8">
                    Remove backgrounds from images instantly with AI. Perfect for product photos and portraits.
                </p>
                <p className="text-xs text-muted-foreground/50 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
