import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlobalLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg"
    text?: string
}

const GlobalLoader = React.forwardRef<HTMLDivElement, GlobalLoaderProps>(
    ({ className, size = "md", text, ...props }, ref) => {
        const sizeClasses = {
            sm: "h-4 w-4 border-b",
            md: "h-8 w-8 border-b-2",
            lg: "h-12 w-12 border-b-4",
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "flex flex-col items-center justify-center p-6 text-center text-white/50",
                    className
                )}
                {...props}
            >
                <div
                    className={cn(
                        "animate-spin rounded-full border-blue-500",
                        sizeClasses[size]
                    )}
                />
                {text && <p className="mt-3 text-sm font-medium animate-pulse">{text}</p>}
            </div>
        )
    }
)
GlobalLoader.displayName = "GlobalLoader"

export { GlobalLoader }
