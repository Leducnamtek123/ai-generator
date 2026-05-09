"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

type AlertDialogOverlayProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Overlay>;
type AlertDialogContentProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Content>;
type AlertDialogTitleProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Title>;
type AlertDialogDescriptionProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Description>;
type AlertDialogActionProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Action>;
type AlertDialogCancelProps = React.ComponentPropsWithRef<typeof AlertDialogPrimitive.Cancel>;

function AlertDialogOverlay({ className, ref, ...props }: AlertDialogOverlayProps) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-gray-950/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

function AlertDialogContent({ className, ref, ...props }: AlertDialogContentProps) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col  gap-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

function AlertDialogTitle({ className, ref, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

function AlertDialogDescription({ className, ref, ...props }: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

function AlertDialogAction({ className, ref, ...props }: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(buttonVariants({ variant: "destructive" }), className)}
      {...props}
    />
  );
}
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

function AlertDialogCancel({ className, ref, ...props }: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
