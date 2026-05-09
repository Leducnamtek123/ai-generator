"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

type AvatarProps = React.ComponentPropsWithRef<typeof AvatarPrimitive.Root>
type AvatarImageProps = React.ComponentPropsWithRef<typeof AvatarPrimitive.Image>
type AvatarFallbackProps = React.ComponentPropsWithRef<typeof AvatarPrimitive.Fallback>

function Avatar({ className, ref, ...props }: AvatarProps) {
    return (
        <AvatarPrimitive.Root
            ref={ref}
            className={cn(
                "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
                className
            )}
            {...props}
        />
    )
}
Avatar.displayName = AvatarPrimitive.Root.displayName

function AvatarImage({ className, ref, ...props }: AvatarImageProps) {
    return (
        <AvatarPrimitive.Image
            ref={ref}
            className={cn("aspect-square h-full w-full", className)}
            {...props}
        />
    )
}
AvatarImage.displayName = AvatarPrimitive.Image.displayName

function AvatarFallback({ className, ref, ...props }: AvatarFallbackProps) {
    return (
        <AvatarPrimitive.Fallback
            ref={ref}
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-muted",
                className
            )}
            {...props}
        />
    )
}
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
