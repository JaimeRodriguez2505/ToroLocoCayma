import * as React from "react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

const cardVariants = cva(
  "rounded-2xl transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border border-border shadow-sm dark:shadow-ember",
        elevated: "bg-card text-card-foreground border border-border shadow-lg dark:shadow-fire hover:shadow-xl",
        outlined: "bg-transparent border-2 border-border hover:border-primary/30",
        filled: "bg-muted text-muted-foreground border border-border",
        interactive: "bg-card text-card-foreground border border-border shadow-sm dark:shadow-ember hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer",
        fire: "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-fire dark:shadow-fire-lg",
        ember: "bg-gradient-to-br from-muted to-muted/80 border border-border shadow-ember",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        md: "p-8",
        lg: "p-card-padding",
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
            <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
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
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
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
