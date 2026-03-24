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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  // If path already contains /api/v1, just prefix the origin
  if (path.startsWith('/api/')) {
    const validApiUrl = apiUrl.startsWith('http') ? apiUrl : `http://${apiUrl}`;
    return `${new URL(validApiUrl).origin}${path}`;
  }

  return `${apiUrl}/v1${path.startsWith('/') ? '' : '/'}${path}`;
}
