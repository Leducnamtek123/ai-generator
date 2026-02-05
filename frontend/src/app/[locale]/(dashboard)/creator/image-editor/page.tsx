'use client';

import { Edit3, Layers, Crop, Palette, Sparkles } from 'lucide-react';

export default function ImageEditorPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Edit3 className="w-10 h-10 text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Image Editor</h1>
                <p className="text-white/50 mb-8">
                    Professional AI-powered image editing tools. Crop, adjust, retouch, and transform your images.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-2"><Crop className="w-4 h-4" /> Crop</span>
                    <span className="flex items-center gap-2"><Palette className="w-4 h-4" /> Adjust</span>
                    <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Layers</span>
                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Tools</span>
                </div>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
