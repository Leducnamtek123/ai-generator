"use client";

import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/ui/button";
import { cn } from "@/lib/utils";

type AsyncStateSurfaceProps = {
  title: string;
  message: string;
  status: "loading" | "error" | "empty";
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  className?: string;
};

export function AsyncStateSurface({
  title,
  message,
  status,
  onRetry,
  retryLabel = "Retry",
  compact = false,
  className,
}: AsyncStateSurfaceProps) {
  const isLoading = status === "loading";
  const icon = isLoading ? (
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  ) : (
    <TriangleAlert className="h-5 w-5 text-muted-foreground" />
  );

  return (
    <div
      className={cn(
        "flex items-center justify-center px-4 text-center",
        compact ? "py-10" : "min-h-[40vh] py-16",
        className,
      )}
    >
      <div className="max-w-lg space-y-4 rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
        <div className="flex items-center justify-center">{icon}</div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {status === "error" && onRetry && (
          <div className="flex justify-center pt-1">
            <Button type="button" variant="outline" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
