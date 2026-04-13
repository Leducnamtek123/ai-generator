'use client';

import * as React from 'react';
import { ArrowRight } from 'lucide-react';

export function ConnectionInfo({ accepts, outputs }: { accepts: string[], outputs: string }) {
    return (
        <div className="p-3 bg-white/5 border border-white/5 rounded-lg space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Connections</p>
            <div className="flex items-center gap-2 text-xs">
                <div className="flex-1">
                    <p className="text-white/30 text-[10px] mb-1">Accepts</p>
                    <div className="flex flex-wrap gap-1">
                        {accepts.map(a => (
                            <span key={a} className="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded text-[10px]">{a}</span>
                        ))}
                    </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20" />
                <div className="flex-1">
                    <p className="text-white/30 text-[10px] mb-1">Outputs</p>
                    <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">{outputs}</span>
                </div>
            </div>
        </div>
    );
}
