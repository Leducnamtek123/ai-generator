import { Download, Layers3, Palette, Sparkles, Wand2, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type LandingBrandLogo = {
  name: string;
  mark: string;
};

export type LandingWorkflowStep = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type LandingFeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
  image: string;
};

export type LandingGalleryItem = {
  id: number;
  category: string;
  title: string;
  tag: string;
  span: string;
  image: string;
};

export type LandingTestimonial = {
  quote: string;
  name: string;
  role: string;
};

export type LandingFaq = {
  question: string;
  answer: string;
};

export type LandingContent = {
  trustedBrandLogos: LandingBrandLogo[];
  workflowSteps: LandingWorkflowStep[];
  featureCards: LandingFeatureCard[];
  galleryTabs: readonly string[];
  galleryItems: LandingGalleryItem[];
  testimonials: LandingTestimonial[];
  faqs: LandingFaq[];
};

export const LANDING_DEFAULTS: LandingContent = {
  trustedBrandLogos: [
    { name: 'Microsoft', mark: 'M' },
    { name: 'NVIDIA', mark: 'N' },
    { name: 'Adobe', mark: 'A' },
    { name: 'Figma', mark: 'F' },
    { name: 'Lenovo', mark: 'L' },
  ],
  workflowSteps: [
    {
      icon: Sparkles,
      title: 'Text to image',
      description:
        'Write a prompt or start from a reference. PaintAI keeps the structure and pushes the idea toward a finished frame.',
    },
    {
      icon: Wand2,
      title: 'Refine in canvas',
      description:
        'Adjust composition, lighting, and style without losing context or restarting from scratch.',
    },
    {
      icon: Download,
      title: 'Export everywhere',
      description:
        'Ship image, motion, vector, and social-ready variants in the sizes your team needs.',
    },
  ],
  featureCards: [
    {
      icon: Palette,
      title: 'Turn prompts into polished scenes',
      description:
        'Build launch visuals, concept frames, and product imagery with tighter art direction and less drift.',
      accent: 'from-sky-500/25 to-cyan-500/5',
      image:
        'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      icon: Layers3,
      title: 'Layout-ready brand assets',
      description:
        'Generate banners, thumbnails, and hero visuals that stay aligned to your spacing and type rules.',
      accent: 'from-amber-500/25 to-orange-500/5',
      image:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      icon: Zap,
      title: 'Export fast for every channel',
      description:
        'Move from concept to social posts, ads, covers, and motion assets without the handoff tax.',
      accent: 'from-violet-500/25 to-fuchsia-500/5',
      image:
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    },
  ],
  galleryTabs: ['All', 'Images', 'Video', 'Vectors', 'Brands'],
  galleryItems: [
    {
      id: 1,
      category: 'Images',
      title: 'Cinematic launch frame',
      tag: 'Image Gen',
      span: 'md:col-span-2 md:row-span-2',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 2,
      category: 'Vectors',
      title: 'Brand-safe vector set',
      tag: 'Vector',
      span: 'md:col-span-1 md:row-span-1',
      image:
        'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 3,
      category: 'Video',
      title: 'Dynamic teaser clip',
      tag: 'Motion',
      span: 'md:col-span-1 md:row-span-2',
      image:
        'https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 4,
      category: 'Brands',
      title: 'Launch campaign visual',
      tag: 'Brand kit',
      span: 'md:col-span-1 md:row-span-1',
      image:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 5,
      category: 'Images',
      title: 'Editorial portrait study',
      tag: 'Photo',
      span: 'md:col-span-2 md:row-span-1',
      image:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 6,
      category: 'Brands',
      title: 'Social-ready template pack',
      tag: 'Template',
      span: 'md:col-span-1 md:row-span-1',
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    },
  ],
  testimonials: [
    {
      quote:
        'We cut first-draft design time by half and still kept the art direction tight enough for brand review.',
      name: 'Mina Tran',
      role: 'Creative Director',
    },
    {
      quote:
        'The workflow feels like a real production tool, not a toy. Prompt, refine, and export without losing context.',
      name: 'Jordan Lee',
      role: 'Growth Designer',
    },
    {
      quote:
        'The landing page now matches the product promise: premium, fast, and serious about output quality.',
      name: 'Ari Santos',
      role: 'Founding PM',
    },
  ],
  faqs: [
    {
      question: 'Can I use PaintAI outputs commercially?',
      answer:
        'Yes. The paid subscription plans are designed for commercial production work, including campaigns, social assets, and client-facing deliverables.',
    },
    {
      question: 'Does the app support image, video, and vector workflows?',
      answer:
        'Yes. The landing page now reflects those three core surfaces so the first impression matches the broader product story.',
    },
    {
      question: 'Can I keep a brand style consistent across outputs?',
      answer:
        'The Pro and Enterprise plans emphasize style memory, brand kits, reusable presets, and enough credits for repeat production so recurring work stays visually aligned.',
    },
    {
      question: 'Is there a fast path from concept to export?',
      answer:
        'The workflow is built around a short loop: prompt, refine, preview, and export. The landing page highlights that sequence directly.',
    },
  ],
};
