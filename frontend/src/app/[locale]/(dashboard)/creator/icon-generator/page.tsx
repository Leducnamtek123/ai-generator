'use client';

import { Shapes } from 'lucide-react';

export default function IconGeneratorPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <Shapes className="w-10 h-10 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Icon Generator</h1>
                <p className="text-white/50 mb-8">
                    Generate custom icons with AI. Create app icons, logos, and vector graphics in any style.
                </p>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
