import { Button } from '@/ui/button';
import { Grid3X3, ImageIcon, Clock, Repeat, FileText, Video, Sparkles, Folder, Download, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PersonalGallery() {
    return (
        <div className="flex-1 p-6 overflow-y-auto w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium px-4">
                        Personal
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full font-medium text-muted-foreground hover:text-foreground px-4">
                        Community
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full font-medium text-muted-foreground hover:text-foreground px-4">
                        Tutorials
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-lg gap-2">
                        <Grid3X3 className="w-3.5 h-3.5" />
                        All
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* This Week */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This week</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="group cursor-pointer space-y-3">
                                <div className="aspect-[4/3] rounded-xl bg-muted border border-border overflow-hidden relative">
                                    {/* Placeholder Image */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-accent/20">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-foreground truncate">Untitled Project {i}</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1">Upscaled 4x • Creative</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Previous */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Previous</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[4, 5, 6].map(i => (
                            <div key={i} className="group cursor-pointer space-y-3">
                                <div className="aspect-[4/3] rounded-xl bg-muted border border-border overflow-hidden relative">
                                    {/* Placeholder Image */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-accent/20">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-foreground truncate">Restoration Project {i}</h4>
                                    <p className="text-[10px] text-muted-foreground mt-1">Upscaled 2x • Precision</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
