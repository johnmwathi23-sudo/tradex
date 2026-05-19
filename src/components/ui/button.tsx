import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer",
        {
          "bg-gradient-to-r from-[#D4A843] to-[#E5C05A] text-[#0A0B0F] hover:shadow-lg hover:shadow-[#D4A843]/30": variant === "primary",
          "bg-[#1A1D29] text-[#F5F5F5] border border-[#D4A843]/30 hover:border-[#D4A843]/60 hover:bg-[#1A1D29]/80": variant === "secondary",
          "bg-transparent text-[#D4A843] border border-[#D4A843]/50 hover:bg-[#D4A843]/10": variant === "outline",
          "bg-transparent text-[#A0A0B0] hover:text-[#F5F5F5]": variant === "ghost",
        },
        {
          "px-4 py-1.5 text-sm rounded-lg": size === "sm",
          "px-6 py-2.5 text-sm rounded-xl": size === "md",
          "px-8 py-3.5 text-base rounded-xl": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
}
