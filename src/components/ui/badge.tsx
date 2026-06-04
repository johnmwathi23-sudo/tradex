import { cn } from "@/lib/utils"

const variants = {
  low: "bg-[#00C853]/10 text-[#00C853] border-[#00C853]/20",
  medium: "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/20",
  high: "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/20",
  verified: "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/20",
  active: "bg-[#00C853]/10 text-[#00C853] border-[#00C853]/20",
  paused: "bg-[#D4A843]/10 text-[#D4A843] border-[#D4A843]/20",
  stopped: "bg-[#FF1744]/10 text-[#FF1744] border-[#FF1744]/20",
  default: "bg-white/5 text-[#A0A0B0] border-white/10",
}

export function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: keyof typeof variants
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium",
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  )
}
