'use client';

import { ZoomIn, Video } from 'lucide-react';

export default function VideoUpscalerPage() {
    return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
                    <ZoomIn className="w-10 h-10 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-3">Video Upscaler</h1>
                <p className="text-white/50 mb-8">
                    Upscale your videos to 4K or higher resolution with AI. Enhance quality and reduce noise.
                </p>
                <p className="text-xs text-white/30 mt-8">Coming Soon</p>
            </div>
        </div>
    );
}
