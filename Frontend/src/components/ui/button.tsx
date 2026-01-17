import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
  {
    variants: {
      variant: {
        // Primary (default) - Rojo intenso con glow en dark
        default: "bg-primary text-white hover:bg-primary/90 shadow-md dark:shadow-fire dark:hover:shadow-fire-lg",

        // Secondary
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",

        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",

        // Outline - Border más grueso
        outline: "border-2 border-border bg-background text-foreground hover:bg-accent hover:border-primary/50",

        // Ghost
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",

        // Link
        link: "text-primary underline-offset-4 hover:underline",

        // Fire Glow (con sombra intensa)
        fire: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-fire hover:shadow-fire-lg",

        // Ember Glow
        ember: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-ember",

        // Success
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",

        // Warning
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-md",
      },
      size: {
        sm: "h-9 px-3.5 text-sm rounded-md gap-1.5",
        default: "h-10 px-4 text-base gap-2",
        md: "h-12 px-5 text-base gap-2",      // Mobile-friendly (48px)
        lg: "h-14 px-6 text-lg gap-2.5",      // Mobile-friendly (56px)
        xl: "h-16 px-8 text-xl gap-3",        // Mobile-friendly (64px)
        icon: "h-10 w-10 gap-0",
        "icon-sm": "h-9 w-9 gap-0",
        "icon-md": "h-12 w-12 gap-0",         // Mobile-friendly
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    // Animaciones por defecto (siempre activas)
    const animationProps = !isDisabled ? {
      whileTap: { scale: 0.98 },
      whileHover: { scale: 1.02 },
    } : {}

    // Tamaños de iconos según size del botón
    const getIconSize = () => {
      switch (size) {
        case 'sm':
          return 'h-3.5 w-3.5'
        case 'default':
          return 'h-4 w-4'
        case 'md':
          return 'h-5 w-5'
        case 'lg':
          return 'h-5 w-5'
        case 'xl':
          return 'h-6 w-6'
        default:
          return 'h-4 w-4'
      }
    }

    const iconSize = getIconSize()

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, fullWidth, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    // Clonar el icono con las clases de tamaño aplicadas
    const renderIcon = (iconElement: React.ReactNode) => {
      if (!iconElement) return null
      if (React.isValidElement(iconElement)) {
        return React.cloneElement(iconElement as React.ReactElement<any>, {
          className: cn(
            iconSize,
            "flex-shrink-0 inline-block align-middle",
            (iconElement.props as any).className
          )
        })
      }
      return iconElement
    }

    return (
      <motion.button
        className={cn(
          buttonVariants({ variant, size, fullWidth, className }),
          "flex-row" // Asegurar dirección horizontal explícita
        )}
        ref={ref}
        disabled={isDisabled}
        {...animationProps}
        {...(props as any)}
      >
        {loading && <Loader2 className={cn(iconSize, "animate-spin flex-shrink-0")} />}
        {!loading && icon && iconPosition === 'left' && renderIcon(icon)}
        {children && (
          <span className="inline-flex items-center leading-none">{children}</span>
        )}
        {!loading && icon && iconPosition === 'right' && renderIcon(icon)}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
