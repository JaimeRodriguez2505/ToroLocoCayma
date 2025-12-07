import * as React from "react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

const cardVariants = cva(
  "rounded-xl transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md",
        elevated: "bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 shadow-lg hover:shadow-xl",
        outlined: "bg-transparent border-2 border-neutral-300 dark:border-neutral-600",
        filled: "bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600",
        interactive: "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-fire-500 cursor-pointer",
        fire: "bg-gradient-to-br from-fire-50 to-fire-100 dark:from-fire-950 dark:to-fire-900 border border-fire-200 dark:border-fire-800 shadow-fire",
        ember: "bg-gradient-to-br from-ember-50 to-ember-100 dark:from-ember-950 dark:to-ember-900 border border-ember-200 dark:border-ember-800 shadow-ember",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        md: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, loading = false, onClick, children, ...props }, ref) => {
    const animationProps = onClick && !loading ? {
      whileTap: { scale: 0.98 },
      role: "button" as const,
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault()
          onClick(e as any)
        }
      }
    } : {}

    if (!onClick) {
      return (
        <div
          ref={ref}
          className={cn(
            cardVariants({ variant, size, className }),
            loading && "relative"
          )}
          {...props}
        >
          {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center z-10 rounded-xl">
              <Loader2 className="w-6 h-6 text-fire-600 animate-spin" />
            </div>
          )}
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, className }),
          "cursor-pointer",
          loading && "relative"
        )}
        onClick={loading ? undefined : onClick}
        {...animationProps}
        {...(props as any)}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-neutral-800/80 flex items-center justify-center z-10 rounded-xl">
            <Loader2 className="w-6 h-6 text-fire-600 animate-spin" />
          </div>
        )}
        {children}
      </motion.div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl font-semibold leading-tight", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("pt-4", className)} {...props} />
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
