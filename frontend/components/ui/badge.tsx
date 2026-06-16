import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#111827] text-[#F1F5F9] border border-[#1F2937]",
        verified: "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30",
        pending: "bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/30",
        missing: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
        critical: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
        warning: "bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/30",
        info: "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30",
        cleared: "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30",
        in_transit: "bg-[#818CF8]/10 text-[#818CF8] border border-[#818CF8]/30",
        customs_hold: "bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/30",
        ofac_flagged: "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
