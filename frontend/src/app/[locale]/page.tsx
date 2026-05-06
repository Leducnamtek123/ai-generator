'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Download,
  Layers3,
  MessageSquareQuote,
  Palette,
  Play,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import { motion, useScroll, useSpring } from 'framer-motion';

import { useRouter, Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/providers';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Workflow', href: '/workflow' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
];

const PROOF_POINTS = [
  { value: '2M+', label: 'creators' },
  { value: '18M+', label: 'exports' },
  { value: '98%', label: 'brand-safe output' },
];

const TRUSTED_BRAND_LOGOS = [
  {
    name: 'Microsoft',
    mark: 'M',
  },
  {
    name: 'NVIDIA',
    mark: 'N',
  },
  {
    name: 'Adobe',
    mark: 'A',
  },
  {
    name: 'Figma',
    mark: 'F',
  },
  {
    name: 'Lenovo',
    mark: 'L',
  },
] as const;

const TOOL_STATS = [
  { value: '2M+', label: 'creators' },
  { value: '18M+', label: 'exports' },
  { value: '98%', label: 'approval rate' },
];

const WORKFLOW_STEPS = [
  {
    icon: Sparkles,
    title: 'Text to image',
    description: 'Write a prompt or start from a reference. PaintAI keeps the structure and pushes the idea toward a finished frame.'
  },
  {
    icon: Wand2,
    title: 'Refine in canvas',
    description: 'Adjust composition, lighting, and style without losing context or restarting from scratch.'
  },
  {
    icon: Download,
    title: 'Export everywhere',
    description: 'Ship image, motion, vector, and social-ready variants in the sizes your team needs.'
  },
];

const FEATURE_CARDS = [
  {
    icon: Palette,
    title: 'Turn prompts into polished scenes',
    description: 'Build launch visuals, concept frames, and product imagery with tighter art direction and less drift.',
    accent: 'from-sky-500/25 to-cyan-500/5',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    icon: Layers3,
    title: 'Layout-ready brand assets',
    description: 'Generate banners, thumbnails, and hero visuals that stay aligned to your spacing and type rules.',
    accent: 'from-amber-500/25 to-orange-500/5',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    icon: Zap,
    title: 'Export fast for every channel',
    description: 'Move from concept to social posts, ads, covers, and motion assets without the handoff tax.',
    accent: 'from-violet-500/25 to-fuchsia-500/5',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'
  },
];

const GALLERY_TABS = ['All', 'Images', 'Video', 'Vectors', 'Brands'] as const;

const GALLERY_ITEMS = [
  {
    id: 1,
    category: 'Images',
    title: 'Cinematic launch frame',
    tag: 'Image Gen',
    span: 'md:col-span-2 md:row-span-2',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 2,
    category: 'Vectors',
    title: 'Brand-safe vector set',
    tag: 'Vector',
    span: 'md:col-span-1 md:row-span-1',
    image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 3,
    category: 'Video',
    title: 'Dynamic teaser clip',
    tag: 'Motion',
    span: 'md:col-span-1 md:row-span-2',
    image: 'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 4,
    category: 'Brands',
    title: 'Launch campaign visual',
    tag: 'Brand kit',
    span: 'md:col-span-1 md:row-span-1',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 5,
    category: 'Images',
    title: 'Editorial portrait study',
    tag: 'Photo',
    span: 'md:col-span-2 md:row-span-1',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 6,
    category: 'Brands',
    title: 'Social-ready template pack',
    tag: 'Template',
    span: 'md:col-span-1 md:row-span-1',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
  },
];

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '$0',
    blurb: 'For quick experiments and solo ideation.',
    features: ['30 generations / month', 'Basic image edit tools', 'Community templates'],
    cta: 'Start free'
  },
  {
    name: 'Pro',
    price: '$16',
    blurb: 'For creators shipping assets every day.',
    features: ['Unlimited image drafts', 'Video export presets', 'Brand-safe style memory', 'Priority queue'],
    cta: 'Go Pro',
    featured: true
  },
  {
    name: 'Team',
    price: '$49',
    blurb: 'For studios and marketing teams.',
    features: ['Shared workspace', 'Role-based approvals', 'Custom brand kits', 'Dedicated support'],
    cta: 'Talk to sales'
  },
];

const TESTIMONIALS = [
  {
    quote: 'We cut first-draft design time by half and still kept the art direction tight enough for brand review.',
    name: 'Mina Tran',
    role: 'Creative Director'
  },
  {
    quote: 'The workflow feels like a real production tool, not a toy. Prompt, refine, and export without losing context.',
    name: 'Jordan Lee',
    role: 'Growth Designer'
  },
  {
    quote: 'The landing page now matches the product promise: premium, fast, and serious about output quality.',
    name: 'Ari Santos',
    role: 'Founding PM'
  },
];

const FAQS = [
  {
    question: 'Can I use PaintAI outputs commercially?',
    answer: 'Yes. The paid plans are designed for commercial production work, including campaigns, social assets, and client-facing deliverables.'
  },
  {
    question: 'Does the app support image, video, and vector workflows?',
    answer: 'Yes. The landing page now reflects those three core surfaces so the first impression matches the broader product story.'
  },
  {
    question: 'Can I keep a brand style consistent across outputs?',
    answer: 'The Pro and Team plans emphasize style memory, brand kits, and reusable presets so recurring work stays visually aligned.'
  },
  {
    question: 'Is there a fast path from concept to export?',
    answer: 'The workflow is built around a short loop: prompt, refine, preview, and export. The landing page highlights that sequence directly.'
  },
];

type LandingPageProps = {
  initialSectionId?: string;
};

export default function LandingPage({ initialSectionId }: LandingPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedGalleryTab, setSelectedGalleryTab] = useState<(typeof GALLERY_TABS)[number]>('All');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (pathname === '/' && user && !isLoading) {
      router.push('/dashboard');
    }
  }, [pathname, user, isLoading, router]);

  useEffect(() => {
    if (!initialSectionId) return;

    const section = document.getElementById(initialSectionId);
    if (!section) return;

    const frame = window.requestAnimationFrame(() => {
      section.scrollIntoView({ block: 'start', behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialSectionId]);

  const filteredGalleryItems =
    selectedGalleryTab === 'All'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === selectedGalleryTab);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050608] text-white selection:bg-sky-400/30 selection:text-white">
      <motion.div
        className="fixed left-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300"
        style={{ scaleX }}
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[140px]" />
        <div className="absolute right-[-10rem] top-[20rem] h-[28rem] w-[28rem] rounded-full bg-amber-400/10 blur-[140px]" />
        <div className="absolute left-[-8rem] top-[52rem] h-[26rem] w-[26rem] rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:88px_88px] opacity-[0.14]" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/70 to-transparent" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#050608]/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-[0_0_40px_rgba(56,189,248,0.16)]">
              <Image src="/logo.svg" alt="PaintAI logo" fill className="object-contain p-1" sizes="44px" priority />
            </div>
            <div className="leading-none">
              <div className="text-lg font-black uppercase tracking-[-0.04em] sm:text-xl">PaintAI</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">Your paint, your choice</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-[0.28em] text-white/48 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden h-11 rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10 md:inline-flex"
            >
              <Link href="/sign-in">Log in</Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-full bg-white px-5 text-sm font-bold text-black hover:bg-white/90"
            >
              <Link href="/sign-up">
                Join free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        <section id="hero" className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-7 pt-2">
              <div className="space-y-4">
                <h1 className="max-w-[10ch] text-[clamp(3.2rem,6vw,7rem)] font-black uppercase leading-[0.86] tracking-[-0.08em] text-balance sm:max-w-[9ch]">
                  Ideas.
                  <span className="block text-white">Generated.</span>
                  <span className="block text-transparent bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-300 bg-clip-text">
                    Mastered.
                  </span>
                </h1>
                <p className="max-w-xl text-base leading-8 text-white/60 sm:text-lg">
                  PaintAI keeps the whole creative loop in one place: generate, refine, and export campaign-ready output
                  without bouncing between tools or losing the original direction.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="xl"
                  className="h-14 rounded-full bg-[#2f66ff] px-7 text-base font-bold text-white shadow-[0_20px_60px_rgba(47,102,255,0.35)] hover:bg-[#4b7cff]"
                >
                  <Link href="/sign-up">
                    Start Creating Free
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="xl"
                  className="h-14 rounded-full border border-white/12 bg-white/4 px-7 text-base font-semibold text-white hover:bg-white/10"
                >
                  <Link href="/workflow">
                    Explore Features
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  'No credit card required',
                  'Commercial-ready export',
                  'Fast brand-safe iteration',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/70"
                  >
                    <CheckCircle2 className="mb-2 size-4 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute -left-8 top-10 h-28 w-28 rounded-full bg-amber-400/20 blur-3xl" />
              <div className="absolute -right-6 bottom-0 h-36 w-36 rounded-full bg-sky-400/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0f14] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
                <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/38">Creative workspace</div>
                    <div className="mt-1 max-w-[22ch] text-sm font-semibold text-white/88 sm:max-w-none">
                      Campaign launch / Winter Motion Set
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-medium text-white/48">Live preview</span>
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/38">Prompt</div>
                          <p className="mt-2 max-w-[28ch] text-sm leading-6 text-white/80">
                            Generate a cinematic product launch scene, dark studio lighting, electric blue edge glow, subtle
                            amber accents, and crisp typography.
                          </p>
                        </div>
                        <Button size="icon" className="size-9 shrink-0 rounded-full bg-white text-black hover:bg-white/90">
                          <Play className="size-4 fill-current" />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/38">Selected controls</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {['Aspect 16:9', 'Style cinematic', 'Strength 72', 'Brand kit on'].map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/68"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                      {TOOL_STATS.map((stat) => (
                        <div key={stat.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/36">{stat.label}</div>
                          <div className="mt-2 text-xl font-black tracking-[-0.04em]">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#090b10]">
                      <Image
                        src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
                        alt="PaintAI creative preview"
                        width={1200}
                        height={900}
                        className="h-[22rem] w-full object-cover"
                        sizes="(max-width: 1024px) 100vw, 48vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/46">Generated asset</div>
                          <div className="mt-1 max-w-[16ch] text-lg font-bold tracking-[-0.03em] leading-tight">
                            Mastered launch poster v04
                          </div>
                        </div>
                        <Button size="sm" className="shrink-0 rounded-full bg-white px-4 text-xs font-bold text-black hover:bg-white/90">
                          Download
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/36">Queue status</div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-white/72">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          2 renders ready
                        </div>
                      </div>
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/36">Next action</div>
                        <div className="mt-2 text-sm text-white/72">Upscale and export to social formats</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-4 rounded-[2rem] border border-white/8 bg-white/[0.03] p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.35rem] border border-white/6 bg-black/20 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/34">Trusted by teams at</div>
              <div className="mt-4 grid gap-3 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-3 sm:grid-cols-2 lg:grid-cols-5">
                {TRUSTED_BRAND_LOGOS.map((brand, index) => (
                  <div
                    key={brand.name}
                    className="flex h-14 items-center gap-3 rounded-full border border-white/8 bg-black/30 px-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]"
                    title={brand.name}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black uppercase tracking-[0.08em] text-white ring-1 ring-white/10',
                        index === 0 && 'bg-sky-500/35',
                        index === 1 && 'bg-emerald-500/35',
                        index === 2 && 'bg-rose-500/35',
                        index === 3 && 'bg-violet-500/35',
                        index === 4 && 'bg-amber-500/35',
                      )}
                    >
                      {brand.mark}
                    </span>
                    <span className="text-sm font-medium text-white/74">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {PROOF_POINTS.map((point) => (
                <div key={point.label} className="rounded-[1.35rem] border border-white/6 bg-black/20 p-5">
                  <div className="text-3xl font-black tracking-[-0.05em] text-white">{point.value}</div>
                  <div className="mt-2 text-sm leading-6 text-white/60">{point.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-300/80">Your creativity</div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">Supercharged.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/56">
              The landing page now mirrors the product flow from ideation to export in a cleaner, denser rhythm.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {WORKFLOW_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-sky-200">
                  <step.icon className="size-5" />
                </div>
                <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/34">
                  Step {String(index + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-3 text-2xl font-bold tracking-[-0.04em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/58">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-300/80">Powerful tools</div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">Limitless potential.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/56">
              Each card reflects a practical creative surface rather than a decorative AI collage.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {FEATURE_CARDS.map((card) => (
              <article
                key={card.title}
                className="group overflow-hidden rounded-[2rem] border border-white/8 bg-white/[0.03] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className={cn('relative h-64 overflow-hidden bg-gradient-to-br', card.accent)}>
                  <Image src={card.image} alt={card.title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1280px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/18 to-transparent" />
                  <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-white backdrop-blur-xl">
                    <card.icon className="size-5" />
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <h3 className="text-2xl font-bold tracking-[-0.04em]">{card.title}</h3>
                  <p className="text-sm leading-7 text-white/60">{card.description}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-200">
                    Explore the surface
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300/80">Inspire</div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">Create. Repeat.</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {GALLERY_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedGalleryTab(tab)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition-colors',
                    selectedGalleryTab === tab
                      ? 'border-white/20 bg-white text-black'
                      : 'border-white/8 bg-white/[0.03] text-white/58 hover:bg-white/8 hover:text-white'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid auto-rows-[10rem] gap-4 md:grid-cols-3 md:auto-rows-[14rem]">
            {filteredGalleryItems.map((item) => (
              <article
                key={item.id}
                className={cn('group relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.03]', item.span)}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/16 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/42">{item.tag}</div>
                  <h3 className="mt-2 text-lg font-bold tracking-[-0.03em]">{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-violet-300/80">Pricing</div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">Choose the plan that fits you.</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/56">
              The structure keeps the page conversion-focused without introducing a noisy pricing maze.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative overflow-hidden rounded-[2rem] border p-6',
                  plan.featured
                    ? 'border-sky-400/30 bg-sky-400/[0.08] shadow-[0_0_0_1px_rgba(56,189,248,0.12)]'
                    : 'border-white/8 bg-white/[0.03]'
                )}
              >
                {plan.featured && (
                  <div className="absolute right-5 top-5 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-200">
                    Most popular
                  </div>
                )}
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">{plan.name}</div>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-5xl font-black tracking-[-0.08em]">{plan.price}</span>
                  <span className="pb-1 text-sm text-white/48">/ month</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/58">{plan.blurb}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-white/72">
                      <CheckCircle2 className="size-4 text-emerald-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={cn(
                    'mt-7 h-12 w-full rounded-full font-bold',
                    plan.featured ? 'bg-white text-black hover:bg-white/90' : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
                  )}
                >
                  <Link href="/sign-up">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-emerald-300/80">Loved by teams</div>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">Shipping every week.</h2>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6">
                <MessageSquareQuote className="size-5 text-sky-200" />
                <p className="mt-5 text-base leading-8 text-white/74">{testimonial.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm font-bold">
                    {testimonial.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{testimonial.name}</div>
                    <div className="text-xs uppercase tracking-[0.24em] text-white/38">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-200/80">FAQ</div>
              <h2 className="text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">Everything you need to know.</h2>
              <p className="max-w-xl text-sm leading-7 text-white/56">
                The page now answers the obvious questions without adding another dense marketing block.
              </p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-5 open:bg-white/[0.05]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold tracking-[-0.02em]">
                    {faq.question}
                    <ChevronDown className="size-4 shrink-0 text-white/42 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-white/60">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-sky-500/18 via-[#0f1722] to-amber-400/12 p-8 sm:p-12 lg:p-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
            <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">Final CTA</div>
                <h2 className="max-w-[12ch] text-4xl font-black uppercase tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                  Ready to create something incredible?
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                  The page now closes with the same kind of punchy conversion block shown in the reference.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="xl" className="h-14 rounded-full bg-white px-7 text-base font-bold text-black hover:bg-white/90">
                    <Link href="/sign-up">Start Creating Free</Link>
                  </Button>
                  <Button asChild variant="ghost" size="xl" className="h-14 rounded-full border border-white/14 bg-white/6 px-7 text-base font-semibold text-white hover:bg-white/12">
                    <Link href="/pricing">Explore plans</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { value: '4k', label: 'Export presets' },
                  { value: '12+', label: 'Creative formats' },
                  { value: '78%', label: 'Repeat usage' },
                  { value: '3 min', label: 'Average first draft' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-black/18 p-5 backdrop-blur-xl">
                    <div className="text-4xl font-black tracking-[-0.06em]">{stat.value}</div>
                    <div className="mt-2 text-sm text-white/64">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-black/18">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
                <Image src="/logo.svg" alt="PaintAI logo" fill className="object-contain p-1" sizes="44px" />
              </div>
              <div className="leading-none">
                <div className="text-lg font-black uppercase tracking-[-0.04em]">PaintAI</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/40">Your paint, your choice</div>
              </div>
            </Link>
            <p className="max-w-xl text-sm leading-7 text-white/52">
              A landing page rebuilt to feel like the product: premium, focused, and ready for conversion.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: 'Product',
                links: [
                  { label: 'Features', href: '/features' },
                  { label: 'Workflow', href: '/workflow' },
                  { label: 'Pricing', href: '/pricing' },
                ],
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '#hero' },
                  { label: 'Contact', href: 'mailto:hello@paintai.com' },
                  { label: 'Sign in', href: '/sign-in' },
                ],
              },
              {
                title: 'Legal',
                links: [
                  { label: 'Privacy', href: 'mailto:legal@paintai.com' },
                  { label: 'Terms', href: 'mailto:legal@paintai.com?subject=Terms%20request' },
                  { label: 'Cookies', href: '/faq' },
                ],
              },
            ].map((group) => (
              <div key={group.title}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">{group.title}</div>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/6 px-4 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-white/34 sm:px-6">
          © 2026 PaintAI. Built for modern creative teams.
        </div>
      </footer>
    </div>
  );
}
