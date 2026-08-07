import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide transition-colors",
  {
    variants: {
      variant: {
        // Solid fill — definitive, settled states (e.g. confirmed).
        default: "border-transparent bg-foreground text-background",
        // Flat, quiet fill — de-emphasized / inactive states (e.g. completed, low priority).
        secondary: "border-transparent bg-muted text-muted-foreground",
        // Plain outline — neutral, general-purpose.
        outline: "border-border text-foreground",
        // Thin outline — calm, positive states (e.g. available, approved).
        success: "border-foreground/50 text-foreground bg-transparent",
        // Dashed outline — states awaiting action (e.g. pending, in review).
        warning: "border-dashed border-foreground/40 text-foreground/70 bg-transparent",
        // Heavy outline — states that need attention (e.g. rejected, critical).
        destructive: "border-2 border-foreground text-foreground bg-transparent font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
