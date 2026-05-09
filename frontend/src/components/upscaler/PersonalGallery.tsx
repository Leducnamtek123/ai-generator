import { Button } from '@/ui/button';
import { Grid3X3, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GALLERY_TABS } from '@/components/layouts/navigation-data';

export function PersonalGallery() {
    return (
        <div className="flex-1 p-6 overflow-y-auto w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    {GALLERY_TABS.map((tab, index) => (
                        <Button
                            key={tab}
                            variant={index === 0 ? 'secondary' : 'ghost'}
                            size="sm"
                            className={cn(
                                'rounded-full font-medium px-4',
                                index === 0
                                    ? 'bg-foreground text-background hover:bg-foreground/90'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {tab}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 rounded-lg gap-2">
                        <Grid3X3 className="size-3.5" />
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
                                        <ImageIcon className="size-8 text-muted-foreground/30" />
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
                                        <ImageIcon className="size-8 text-muted-foreground/30" />
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
