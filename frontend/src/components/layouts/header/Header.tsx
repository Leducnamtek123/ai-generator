import { LocaleSwitcher, ThemeSwitcher } from "@/widgets";
import { Sparkles } from "lucide-react";
import { GlassCard } from "@/ui/glass-card";
import { Link } from "@/i18n/navigation";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4">
      <GlassCard
        variant="morphism"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 border-white/5"
      >
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">AI Suite</span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <div className="h-6 w-px bg-white/10" />
          <button className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            Get Pro
          </button>
        </div>
      </GlassCard>
    </header>
  );
};
