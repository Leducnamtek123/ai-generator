'use client';

import { Mic, Volume2, Wand2 } from 'lucide-react';

export default function VoiceGeneratorPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Mic className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Voice Generator</h1>
                <p className="text-white/50 mb-8">
                    Generate realistic human voices with AI. Text-to-speech, voice cloning, and multilingual support.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> TTS</span>
                    <span className="flex items-center gap-2"><Wand2 className="w-4 h-4" /> Clone</span>
                </div>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
