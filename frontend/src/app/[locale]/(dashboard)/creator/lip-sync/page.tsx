'use client';

import { Mic, Video } from 'lucide-react';

export default function LipSyncPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Mic className="w-10 h-10 text-violet-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Lip Sync</h1>
                <p className="text-white/50 mb-8">
                    Create realistic lip-synced videos with AI. Match audio to video with perfect synchronization.
                </p>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
