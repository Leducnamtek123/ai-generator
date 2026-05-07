'use client';

import * as React from 'react';
import { Upload, X, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import { ConnectionInfo } from './ConnectionInfo';
import { NodePanelProps } from '../NodePanels';
import { FileMediaType } from '../types';

export function MediaNodePanel({ nodeData, onChange }: NodePanelProps) {
    const mediaUrl = nodeData.mediaUrl as string | undefined;
    const mediaName = (nodeData.mediaName as string) || 'media';

    const handleOpen = () => {
        if (!mediaUrl) return;
        window.open(mediaUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDownload = () => {
        if (!mediaUrl) return;
        const anchor = document.createElement('a');
        anchor.href = mediaUrl;
        anchor.download = mediaName || 'media';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    };

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

            {mediaUrl && (
                <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Current Media</div>
                    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                        <p className="text-xs text-foreground truncate">{mediaName || ''}</p>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleOpen} className="flex-1 gap-1 bg-background/70 hover:bg-accent rounded text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                                <ExternalLink className="w-3 h-3" /> Open
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleDownload} className="flex-1 gap-1 bg-background/70 hover:bg-accent rounded text-[10px] text-muted-foreground hover:text-foreground transition-colors">
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
                <div className="text-xs font-medium text-muted-foreground">Media Type Filter</div>
                <div className="grid grid-cols-3 gap-2">
                    {[FileMediaType.ANY, FileMediaType.IMAGE, FileMediaType.VIDEO].map((type) => (
                        <Button
                            key={type}
                            variant={(nodeData.mediaType || FileMediaType.ANY) === type ? 'default' : 'outline'}
                            onClick={() => onChange('mediaType', type)}
                            className={cn(
                                "h-9 text-xs font-medium capitalize",
                                (nodeData.mediaType || FileMediaType.ANY) === type ? "bg-cyan-600 hover:bg-cyan-500 border-none" : "bg-background border-border hover:bg-accent text-muted-foreground"
                            )}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Max File Size</div>
                <select
                    value={(nodeData.maxSize as string) || '10mb'}
                    onChange={(e) => onChange('maxSize', e.target.value)}
                    className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/50 appearance-none"
                >
                    <option value="5mb">5 MB</option>
                    <option value="10mb">10 MB</option>
                    <option value="25mb">25 MB</option>
                    <option value="50mb">50 MB</option>
                </select>
            </div>
        </div>
    );
}
