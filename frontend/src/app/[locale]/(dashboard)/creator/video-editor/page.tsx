'use client';

import { Film, Layers, Scissors } from 'lucide-react';

export default function VideoEditorPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Film className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Video Project Editor</h1>
                <p className="text-white/50 mb-8">
                    Professional video editing with AI-powered tools. Cut, trim, merge, and enhance your videos.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-2"><Scissors className="w-4 h-4" /> Cut</span>
                    <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Timeline</span>
                </div>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
