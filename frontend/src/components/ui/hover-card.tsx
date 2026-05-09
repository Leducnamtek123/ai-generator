"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

type HoverCardContentProps = React.ComponentPropsWithRef<typeof HoverCardPrimitive.Content>

function HoverCardContent({ className, align = "center", sideOffset = 4, ref, ...props }: HoverCardContentProps) {
    return (
        <HoverCardPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                "z-[9999] w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
                className
            )}
            {...props}
        />
    )
}
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
