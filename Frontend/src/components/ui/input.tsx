import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border-2 border-border bg-input px-4 text-base font-medium transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-foreground/50 dark:placeholder:text-foreground/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground",
  {
    variants: {
      variant: {
        default: "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 dark:focus-visible:shadow-primary-glow",
        error: "border-destructive focus-visible:border-destructive focus-visible:ring-4 focus-visible:ring-destructive/20",
        success: "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/20",
      },
      inputSize: {
        sm: "h-10 text-sm px-3", // 40px
        default: "h-12", // 48px - Mobile-friendly
        md: "h-14", // 56px - Mobile-friendly
        lg: "h-16 text-lg", // 64px - Mobile-friendly
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
