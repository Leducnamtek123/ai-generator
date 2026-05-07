import {
  Box,
  Image as ImageIcon,
  LayoutGrid,
  MousePointer2,
  Sparkles,
  Type,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type StockCategory = {
  title: string;
  color: string;
  icon: LucideIcon;
};

export type StockCollection = {
  id: string;
  title: string;
  count: number;
  image: string;
};

export type StockContent = {
  categories: StockCategory[];
  featuredCollections: StockCollection[];
};

export const STOCK_DEFAULTS: StockContent = {
  categories: [
    { title: 'Vectors', color: 'from-chart-1/20 to-chart-1/10', icon: MousePointer2 },
    { title: 'Photos', color: 'from-chart-2/20 to-chart-2/10', icon: ImageIcon },
    { title: 'AI Images', color: 'from-chart-3/20 to-chart-3/10', icon: Sparkles },
    { title: 'Icons', color: 'from-chart-4/20 to-chart-4/10', icon: LayoutGrid },
    { title: 'Videos', color: 'from-chart-5/20 to-chart-5/10', icon: Video },
    { title: 'PSD', color: 'from-chart-1/20 to-chart-1/10', icon: Box },
    { title: '3D', color: 'from-chart-5/20 to-chart-5/10', icon: Box },
    { title: 'Fonts', color: 'from-muted to-muted/50', icon: Type },
  ],
  featuredCollections: [
    {
      id: '1',
      title: 'Summer Vibes',
      count: 120,
      image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80',
    },
    {
      id: '2',
      title: 'Tech Startups',
      count: 85,
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
    },
    {
      id: '3',
      title: 'Abstract 3D',
      count: 240,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    },
    {
      id: '4',
      title: 'Nature Textures',
      count: 95,
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    },
  ],
};
