import * as React from "react"
import { cn } from "@/lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[#1A1D29] border border-white/5 p-6 hover:border-[#D4A843]/20 transition-all duration-300",
        className
      )}
      {...props}
    />
  )
}
