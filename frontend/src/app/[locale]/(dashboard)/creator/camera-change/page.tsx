'use client';

import { Camera, RotateCcw, Sparkles } from 'lucide-react';

export default function CameraChangePage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Camera className="w-10 h-10 text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Change Camera</h1>
                <p className="text-white/50 mb-8">
                    Change camera angles and perspectives in your images with AI. Transform viewpoints instantly.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> New Feature
                </div>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
