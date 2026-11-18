import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full font-normal whitespace-nowrap transition-[color,background-color,border-color] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:bg-control-gray disabled:text-steel aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Pricing Blue pill: compact conversion moments */
        default: "bg-primary text-primary-foreground hover:bg-[#0077ed] active:bg-[#006edb]",
        secondary: "bg-secondary text-foreground hover:bg-control-gray",
        /* Outlined explore pill */
        outline: "border border-steel bg-transparent text-foreground hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
        /* Blue text link with chevron affordance */
        link: "h-auto rounded-sm px-0 text-apple-blue hover:underline [&_svg]:size-3.5",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30",
      },
      size: {
        sm: "h-7 px-3.5 text-compact",
        default: "h-9 px-4.5 text-sm tracking-[-0.224px]",
        lg: "h-11 px-6 text-[17px] tracking-[-0.374px]",
        icon: "size-9",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. a Next.js Link) with button styles. */
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
