"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleGroupVariants = cva(
  "flex items-center justify-center gap-1 rounded-md p-1",
  {
    variants: {
      variant: {
        default: "bg-muted",
        outline: "border border-border bg-background",
      },
      size: {
        default: "h-10",
        sm: "h-8",
        lg: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
      },
      size: {
        default: "h-8",
        sm: "h-6 px-2 py-1",
        lg: "h-10 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toggleGroupVariants> {
  type: "single" | "multiple"
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof toggleGroupItemVariants> {
  value: string
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, variant, size, type, value, onValueChange, children, ...props }, ref) => {
    const handleItemClick = (itemValue: string) => {
      if (!onValueChange) return
      
      if (type === "single") {
        onValueChange(value === itemValue ? "" : itemValue)
      } else {
        const currentValues = Array.isArray(value) ? value : []
        const newValues = currentValues.includes(itemValue)
          ? currentValues.filter(v => v !== itemValue)
          : [...currentValues, itemValue]
        onValueChange(newValues)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(toggleGroupVariants({ variant, size, className }))}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<ToggleGroupItemProps>(child)) {
            const isActive = type === "single" 
              ? value === child.props.value 
              : Array.isArray(value) && value.includes(child.props.value)
              return React.cloneElement(child, {
              ...child.props,
              onClick: () => handleItemClick(child.props.value),
              className: cn(
                child.props.className,
                isActive && "bg-accent text-accent-foreground"
              ),
              variant,
              size,
            })
          }
          return child
        })}
      </div>
    )
  }
)

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, variant, size, value, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(toggleGroupItemVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  )
)

ToggleGroup.displayName = "ToggleGroup"
ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
