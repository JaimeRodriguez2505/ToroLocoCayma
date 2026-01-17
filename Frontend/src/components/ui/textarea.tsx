import * as React from "react"

import { cn } from "../../lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-xl border-2 border-border bg-input px-4 py-3 text-base font-medium placeholder:text-foreground/50 dark:placeholder:text-foreground/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 dark:focus-visible:shadow-primary-glow disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-foreground",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }

