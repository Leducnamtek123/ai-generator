'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ChevronLeft, ArrowRight, Ghost } from 'lucide-react';
import { Button } from '@/ui/button';

export function NotFoundUI() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0C0E] text-white selection:bg-blue-500/30 overflow-hidden relative p-6">
            {/* Background Luxury Glows */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03] -z-10" />
            <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-500/10 blur-[130px] rounded-full" />
            <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-purple-500/10 blur-[130px] rounded-full" />

            <div className="max-w-[500px] w-full text-center space-y-12">
                <div className="space-y-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                        className="relative inline-block"
                    >
                        <h1 className="text-[140px] md:text-[180px] font-black leading-none tracking-tighter bg-gradient-to-b from-white via-white/80 to-transparent bg-clip-text text-transparent select-none">
                            404
                        </h1>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="absolute -top-4 -right-4 w-12 h-12 bg-blue-500/20 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl"
                        >
                            <Ghost className="w-6 h-6 text-blue-400" />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Dimension Not Found</h2>
                        <p className="text-white/40 text-sm md:text-base leading-relaxed font-medium max-w-[380px] mx-auto">
                            The page you're looking for has drifted into the void or never existed in this workspace.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button
                        asChild
                        className="w-full sm:w-auto bg-white text-black hover:bg-white/90 rounded-2xl px-8 h-14 font-black text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95 group shadow-xl shadow-white/5"
                    >
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Back to Safety
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>

                    <Button
                        variant="ghost"
                        className="w-full sm:w-auto text-white/40 hover:text-white hover:bg-white/5 rounded-2xl h-14 px-8 font-bold text-xs uppercase tracking-widest border border-white/5"
                        onClick={() => typeof window !== 'undefined' && window.history.back()}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous Orbit
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
