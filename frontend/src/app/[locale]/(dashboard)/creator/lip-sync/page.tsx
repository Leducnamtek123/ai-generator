'use client';

import { Mic } from 'lucide-react';

export default function LipSyncPage() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-6">
                    <Mic className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold mb-3">Lip Sync</h1>
                <p className="text-muted-foreground mb-8">
                    Create realistic lip-synced videos with AI. Match audio to video with perfect synchronization.
                </p>
                <p className="text-xs text-muted-foreground/50 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
