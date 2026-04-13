import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function getAssetUrl(path: string | undefined | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  
  // If the path already has /api/, we extract the origin from apiUrl
  if (path.startsWith('/api/')) {
    try {
      const origin = new URL(apiUrl).origin;
      return `${origin}${path}`;
    } catch {
      return path;
    }
  }

  // Otherwise, if path is just an asset, it might be served directly from backend origin or under /api/v1.
  // We assume the asset is relative to the backend origin.
  try {
     const origin = new URL(apiUrl).origin;
     return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  } catch {
     return path;
  }
}
