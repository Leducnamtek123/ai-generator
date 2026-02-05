'use client';

import { Copy, Sparkles } from 'lucide-react';

export default function VariationsPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Copy className="w-10 h-10 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Variations</h1>
                <p className="text-white/50 mb-8">
                    Generate multiple variations of your images with AI. Create different styles, colors, and compositions.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> New Feature
                </div>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
