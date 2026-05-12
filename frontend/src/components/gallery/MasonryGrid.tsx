import { useState } from 'react';

import { Heart } from 'lucide-react';

import { cn } from '@/lib/utils';
import { GalleryItem } from '@/types/gallery';

const ART_RATIOS = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-[5/6]', 'aspect-[6/7]', 'aspect-[1/1]'];

export function MasonryGrid({ items, className }: { items: GalleryItem[]; className?: string }) {
  return (
    <div
      className={cn('columns-1 gap-5 space-y-5 sm:columns-2 xl:columns-3 2xl:columns-4', className)}
    >
      {items.map((item, index) => (
        <GalleryCard
          key={item.id}
          item={item}
          ratio={resolveRatio(item, index)}
          priority={index < 8}
        />
      ))}
    </div>
  );
}

function resolveRatio(item: GalleryItem, index: number) {
  const ratio = item.aspectRatio?.trim();

  if (ratio && ratio !== 'aspect-[1/1]') {
    return ratio;
  }

  return ART_RATIOS[index % ART_RATIOS.length];
}

function getDisplayTitle(prompt: string) {
  const trimmed = prompt.trim();
  return trimmed && trimmed !== 'No prompt' ? trimmed : 'Untitled piece';
}

function getDisplayAuthor(author: string) {
  const trimmed = author.trim();
  return trimmed && trimmed !== 'Unknown' ? trimmed : 'Creator';
}

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function GalleryCard({
  item,
  ratio,
  priority,
}: {
  item: GalleryItem;
  ratio: string;
  priority: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const displayTitle = getDisplayTitle(item.prompt);
  const displayAuthor = getDisplayAuthor(item.author);
  const initials = getInitials(displayAuthor);

  return (
    <article className="group relative mb-5 break-inside-avoid overflow-hidden rounded-[1.4rem] bg-black/85 ring-1 ring-white/8 shadow-[0_18px_55px_rgba(0,0,0,0.32)] transition-transform duration-300 hover:-translate-y-1">
      <div className={cn('relative overflow-hidden', ratio)}>
        {imageFailed ? (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
          </div>
        ) : (
          <img
            src={item.url}
            alt={item.prompt}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] group-hover:brightness-[1.02]"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            onError={() => setImageFailed(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="pointer-events-none absolute inset-0 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_30%)]" />
          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/18 bg-white/10 text-[10px] font-semibold text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md">
                {initials}
              </div>
              <span className="min-w-0 truncate text-sm font-medium text-white/92">
                {displayAuthor}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/12 bg-black/26 px-2.5 py-1 text-[12px] font-medium text-white/88 backdrop-blur-md">
              <Heart className={`size-3.5 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{item.likes}</span>
            </div>
          </div>
        </div>

        {!imageFailed ? null : (
          <div className="absolute inset-0 flex items-end p-4">
            <div className="max-w-[88%] space-y-2 rounded-2xl border border-white/10 bg-black/24 p-4 text-white backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/44">
                Preview unavailable
              </p>
              <h3 className="line-clamp-2 text-lg font-medium leading-snug text-white">
                {displayTitle}
              </h3>
              <p className="text-sm text-white/64">{displayAuthor}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
