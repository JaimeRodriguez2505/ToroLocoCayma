import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20",
        secondary: "bg-secondary/10 text-secondary border border-secondary/20",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        outline: "border border-neutral-300 text-neutral-700",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        info: "bg-info/10 text-info border border-info/20",
        fire: "bg-fire-100 text-fire-700 border border-fire-300 dark:bg-fire-900 dark:text-fire-200",
        ember: "bg-ember-100 text-ember-700 border border-ember-300 dark:bg-ember-900 dark:text-ember-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
