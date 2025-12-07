import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const inputVariants = cva(
  "flex w-full rounded-lg border bg-white px-4 text-base transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-100",
  {
    variants: {
      variant: {
        default: "border-neutral-300 dark:border-neutral-600 focus-visible:border-fire-500 focus-visible:ring-2 focus-visible:ring-fire-500/20",
        error: "border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/20",
        success: "border-success focus-visible:border-success focus-visible:ring-2 focus-visible:ring-success/20",
      },
      inputSize: {
        sm: "h-9 text-sm px-3",
        default: "h-10",
        md: "h-12",              // Mobile-friendly (48px)
        lg: "h-14 text-lg",      // Mobile-friendly (56px)
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
