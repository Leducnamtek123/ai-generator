'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, Variants } from 'framer-motion';
import {
  Sparkles, Search, ImageIcon, Video, Mic, LayoutGrid,
  ChevronRight, Globe, TrendingUp, Filter, Play,
  Download, Heart, Share2, MoreHorizontal, X,
  ArrowRight, CheckCircle2, User, Lock, Mail
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/providers';

// --- MOCK DATA FOR SHOWCASE ---
const SHOWCASE_ASSETS = [
  { id: 1, type: 'video', url: 'https://cdn.pixabay.com/video/2021/04/12/70796-538181236_tiny.mp4', title: 'Cyberpunk Landscape', category: 'AI Video', size: 'col-span-2 row-span-2' },
  { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop', title: 'Abstract 3D Shape', category: '3D Render', size: 'col-span-1 row-span-1' },
  { id: 3, type: 'image', url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800&auto=format&fit=crop', title: 'Future UI Elements', category: 'Vectors', size: 'col-span-1 row-span-2' },
  { id: 4, type: 'video', url: 'https://cdn.pixabay.com/video/2022/07/26/125608-733909180_tiny.mp4', title: 'Neon Portrait', category: 'AI Realism', size: 'col-span-1 row-span-1' },
  { id: 5, type: 'image', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop', title: 'Surreal Nature', category: 'Illustration', size: 'col-span-2 row-span-1' },
  { id: 6, type: 'image', url: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=800&auto=format&fit=crop', title: 'Vibrant Textures', category: 'Patterns', size: 'col-span-1 row-span-1' },
];

const CATEGORIES = [
  { name: 'AI Generator', icon: Sparkles, color: 'text-purple-400' },
  { name: 'Photos', icon: ImageIcon, color: 'text-blue-400' },
  { name: 'Videos', icon: Video, color: 'text-red-400' },
  { name: 'Vectors', icon: LayoutGrid, color: 'text-orange-400' },
  { name: 'Audio', icon: Mic, color: 'text-green-400' },
];

export default function LandingPage() {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState<number | null>(null);

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "circOut" as any } }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-white selection:bg-blue-500/30">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-blue-600 origin-left z-[100]" style={{ scaleX }} />

      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 border-b border-white/5 bg-[#0B0C0E]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-blue-500/20 p-1 bg-white/5 border border-white/10">
              <Image src="/logo.svg" alt="PaintAI Logo" fill className="object-contain" sizes="40px" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase leading-none">PaintAI</span>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Your paint, your choice</span>
            </div>
          </motion.div>

          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-white/40 uppercase tracking-widest">
            {['Assets', 'AI Tools', 'Collections', 'Pricing'].map((link) => (
              <Link key={link} href="/" className="hover:text-blue-400 transition-colors">{link}</Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-bold hover:bg-white/5 px-6">Log in</Button>
            </Link>
            <Link href="/sign-up">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-white text-black hover:bg-white/90 rounded-full px-8 font-black h-11">Join Free</Button>
              </motion.div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[800px] bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent blur-[120px] rounded-full -z-10" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center space-y-12"
        >
          <div className="space-y-6">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-[0.2em]">
              <TrendingUp className="w-3 h-3" /> Leading AI Asset Deck
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
              Your paint, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-400">your choice.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl text-white/40 max-w-2xl mx-auto font-medium">
              You are the artist. AI is your master brush. Co-create stunning assets with the world's most advanced AI creative engine.
            </motion.p>
          </div>

          {/* Infinite Search Bar */}
          <motion.div variants={itemVariants} className="max-w-3xl mx-auto">
            <div className="relative group p-1 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center bg-white rounded-[1.8rem] h-16 md:h-20 p-2 overflow-hidden">
                <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-gray-950/5 hover:bg-gray-950/10 rounded-2xl cursor-pointer text-black transition-colors shrink-0">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-black uppercase tracking-wider">Assets</span>
                </div>
                <input
                  type="text"
                  placeholder="Search for images, videos, vectors..."
                  className="flex-1 bg-transparent border-none outline-none px-6 text-black text-lg md:text-xl placeholder:text-black/30 font-medium"
                />
                <Button className="bg-blue-600 hover:bg-blue-700 h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-3xl shrink-0 shadow-xl shadow-blue-500/40">
                  <Search className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Animated Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {['Artificial Intelligence', 'Neon Textures', '3D UI Kit', 'Cinematic LUTs', 'Minimal Logos'].map((tag, idx) => (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + (idx * 0.1) }}
                  className="text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white bg-white/5 border border-white/5 px-4 py-2 rounded-xl transition-all hover:bg-blue-600 hover:border-blue-500"
                >
                  {tag}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Dynamic Asset Grid - The "Wow" Factor */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-4">
            <div className="text-blue-500 text-xs font-black uppercase tracking-[0.3em]">Fresh inspiration</div>
            <h2 className="text-4xl font-black tracking-tighter uppercase">Recently Generated</h2>
          </div>
          <Button variant="ghost" className="text-white/40 hover:text-white group font-black uppercase text-xs tracking-widest">
            View all assets <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[250px]">
          {SHOWCASE_ASSETS.map((asset, idx) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onMouseEnter={() => setIsHovered(asset.id)}
              onMouseLeave={() => setIsHovered(null)}
              className={cn(
                "group relative rounded-3xl overflow-hidden bg-[#151619] border border-white/5 cursor-pointer",
                asset.size
              )}
            >
              {/* Media Content */}
              {asset.type === 'video' ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                >
                  <source src={asset.url} type="video/mp4" />
                </video>
              ) : (
                <Image
                  src={asset.url}
                  alt={asset.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              )}

              {/* Overlay UI */}
              <motion.div
                initial={false}
                animate={{ opacity: isHovered === asset.id ? 1 : 0 }}
                className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent z-10 flex flex-col justify-between p-6"
              >
                <div className="flex justify-end gap-2">
                  <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white">AI Gen</span>
                    <span className="text-[10px] font-bold text-white/60">{asset.category}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-black tracking-tight text-lg">{asset.title}</h3>
                    <button className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-blue-400 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Asset Indicators (Constant) */}
              {asset.type === 'video' && (
                <div className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-gray-950/40 backdrop-blur-md flex items-center justify-center group-hover:opacity-0 transition-opacity">
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Showcase: AI Transformation */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-[0.4em]">
              <Sparkles className="w-4 h-4" /> Infinite Possibilities
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
              Text to <br />
              Everything.
            </h2>
            <p className="text-xl text-white/40 leading-relaxed font-medium">
              Generate unique images, high-definition videos, and high-fidelity audio assets with just a single prompt. No professional skills required.
            </p>

            <ul className="space-y-4 pt-4">
              {[
                'Next-gen Stable Diffusion 3.5 Models',
                'Short Video Production in 4K',
                'SVG & Vector Generation',
                'AI Object Removal & Editing'
              ].map((text) => (
                <li key={text} className="flex items-center gap-3 text-white/60 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="pt-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="h-16 px-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-black text-xl shadow-2xl shadow-blue-500/20">
                  Start Creating Now
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Bento Style UI Preview */}
            <div className="relative grid grid-cols-2 gap-4">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
              >
                <Image src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800" alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
                className="space-y-4"
              >
                <div className="aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center p-8">
                  <Sparkles className="w-full h-full text-white/20" />
                </div>
                <div className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                  <video autoPlay muted loop className="w-full h-full object-cover" src="https://cdn.pixabay.com/video/2021/04/12/70796-538181236_tiny.mp4" />
                </div>
              </motion.div>
            </div>

            {/* Floating Tooltips */}
            <motion.div
              animate={{ x: [0, 15, 0], y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute top-1/2 -left-12 px-6 py-3 bg-[#1A1B1F] border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400"><Download className="w-4 h-4" /></div>
              <div className="text-xs font-black uppercase tracking-widest">Asset Ready</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section className="max-w-7xl mx-auto px-6 py-32">
        <motion.div
          whileInView={{ scale: [0.95, 1], opacity: [0, 1] }}
          className="relative rounded-[3rem] p-12 md:p-24 overflow-hidden border border-white/10 text-center space-y-10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-transparent -z-10" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10 -z-10" />

          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">
            Elevate your <br />
            <span className="text-blue-500">Design Game.</span>
          </h2>
          <p className="text-xl text-white/60 max-w-xl mx-auto font-medium">
            Join 2M+ creators who are building the future with PaintAI. Get started for free today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button className="h-16 px-12 rounded-2xl bg-white text-black font-black text-xl hover:scale-105 active:scale-95 transition-all">
                Create Account
              </Button>
            </Link>
            <Button variant="ghost" className="h-16 px-8 rounded-2xl border border-white/10 font-black uppercase text-xs tracking-widest hover:bg-white/5">
              Check Pricing
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 opacity-40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-1 bg-white/5 border border-white/10">
              <Image src="/logo.svg" alt="Logo" fill className="object-contain" sizes="32px" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tighter uppercase leading-none">PaintAI</span>
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-tight">Your paint, your choice</span>
            </div>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.3em]">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Cookies</span>
            <span>Support</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em]">
            © 2026 PaintAI. Your paint, your choice.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Utility function for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
