'use client';

import Link from 'next/link';
import { m } from 'framer-motion';
import { Home, ChevronLeft, ArrowRight, Ghost } from 'lucide-react';
import { Button } from '@/ui/button';

export function NotFoundUI() {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6 text-foreground selection:bg-primary/20">
            {/* Background Luxury Glows */}
            <div className="absolute left-0 top-0 -z-10 h-full w-full bg-[url('/grid.svg')] opacity-[0.05]" />
            <div className="absolute left-[-12rem] top-1/4 size-[600px] rounded-full bg-primary/10 blur-[130px]" />
            <div className="absolute bottom-1/4 right-[-12rem] size-[600px] rounded-full bg-secondary/50 blur-[130px]" />

            <div className="max-w-[500px] w-full text-center space-y-12">
                <div className="space-y-8">
                    <m.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                        className="relative inline-block"
                    >
                        <h1 className="select-none text-[140px] font-semibold leading-none tracking-tighter text-foreground/90 md:text-[180px]">
                            404
                        </h1>
                        <m.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="absolute -right-4 -top-4 flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-primary/15 backdrop-blur-xl shadow-2xl"
                        >
                            <Ghost className="size-6 text-primary" />
                        </m.div>
                    </m.div>

                    <m.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Dimension not found</h2>
                        <p className="mx-auto max-w-[380px] text-sm font-medium leading-relaxed text-muted-foreground md:text-base">
                            The page you&apos;re looking for has drifted into the void or never existed in this workspace.
                        </p>
                    </m.div>
                </div>

                <m.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button
                        asChild
                        className="group h-14 w-full rounded-2xl bg-primary px-8 text-sm font-black text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 sm:w-auto"
                    >
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Home className="size-4" />
                            Back to Safety
                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>

                    <Button
                        variant="ghost"
                        className="h-14 w-full rounded-2xl border border-border/60 px-8 text-xs font-bold text-muted-foreground hover:bg-muted/60 hover:text-foreground sm:w-auto"
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                    >
                        <ChevronLeft className="size-4 mr-2" />
                        Previous Orbit
                    </Button>
                </m.div>
            </div>
        </div>
    );
}
