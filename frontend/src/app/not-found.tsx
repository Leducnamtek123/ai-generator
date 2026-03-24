'use client';

import { NotFoundUI } from '@/components/common/NotFoundUI';
import "@/tailwind";

export default function NotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-background text-foreground antialiased overflow-hidden">
        <NotFoundUI />
      </body>
    </html>
  );
}
