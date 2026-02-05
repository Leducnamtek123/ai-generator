'use client';

import { NotFoundUI } from '@/components/common/NotFoundUI';
import "@/tailwind";

export default function NotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#0B0C0E] text-white antialiased overflow-hidden selection:bg-blue-500/30">
        <NotFoundUI />
      </body>
    </html>
  );
}
