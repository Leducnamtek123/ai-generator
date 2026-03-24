import { LocaleSwitcher, ThemeSwitcher } from "@/widgets";
import { Link } from "@/i18n/navigation";
import { Button } from "@/ui/button";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 bg-card border border-border rounded-2xl shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
            <img src="/logo.svg" alt="PaintAI Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground leading-none">PaintAI</span>
            <span className="text-[10px] text-muted-foreground font-medium">Your paint, your choice</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <div className="h-6 w-px bg-border" />
          <Button size="sm">
            Get Pro
          </Button>
        </div>
      </div>
    </header>
  );
};

