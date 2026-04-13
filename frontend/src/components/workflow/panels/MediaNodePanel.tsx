'use client';

import * as React from 'react';
import { Upload, X, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';
import { FileMediaType } from '../types';

export function MediaNodePanel({ nodeData, onChange }: NodePanelProps) {
    return (
        <div className="space-y-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                    <Upload className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-cyan-300 font-medium">Media Upload</p>
                        <p className="text-[10px] text-cyan-300/60 mt-1">
                            Upload images or videos to use in your workflow.
                        </p>
                    </div>
                </div>
            </div>

            <ConnectionInfo accepts={['None (Input Node)']} outputs="Image/Video" />

            {(nodeData.mediaUrl as string) && (
                <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Current Media</label>
                    <div className="p-3 bg-black/20 rounded-lg space-y-2">
                        <p className="text-xs text-white truncate">{(nodeData.mediaName as string) || ''}</p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="flex-1 gap-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors">
                                <ExternalLink className="w-3 h-3" /> Open
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-1 gap-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors">
                                <Download className="w-3 h-3" /> Download
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { onChange('mediaUrl', ''); onChange('mediaName', ''); }}
                                className="h-8 w-8 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400 transition-colors p-0"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Media Type Filter</label>
                <div className="grid grid-cols-3 gap-2">
                    {[FileMediaType.ANY, FileMediaType.IMAGE, FileMediaType.VIDEO].map((type) => (
                        <Button
                            key={type}
                            variant={(nodeData.mediaType || FileMediaType.ANY) === type ? 'default' : 'outline'}
                            onClick={() => onChange('mediaType', type)}
                            className={cn(
                                "h-9 text-xs font-medium capitalize",
                                (nodeData.mediaType || FileMediaType.ANY) === type ? "bg-cyan-600 hover:bg-cyan-500 border-none" : "bg-white/5 border-white/10 hover:bg-white/10 text-white/60"
                            )}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-xs font-medium text-white/60">Max File Size</label>
                <select
                    value={(nodeData.maxSize as string) || '10mb'}
                    onChange={(e) => onChange('maxSize', e.target.value)}
                    className="w-full h-10 bg-black/20 border border-white/10 rounded-lg px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none"
                >
                    <option value="5mb" className="bg-[#1A1B1F]">5 MB</option>
                    <option value="10mb" className="bg-[#1A1B1F]">10 MB</option>
                    <option value="25mb" className="bg-[#1A1B1F]">25 MB</option>
                    <option value="50mb" className="bg-[#1A1B1F]">50 MB</option>
                </select>
            </div>
        </div>
    );
}
