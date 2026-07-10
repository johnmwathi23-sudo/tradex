declare module "lucide-react" {
  import type { FC, SVGProps } from "react"
  interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number
    absoluteStrokeWidth?: boolean
  }
  type Icon = FC<LucideProps>
  export const Mail: Icon
  export const Terminal: Icon
  export const Plus: Icon
  export const Trash2: Icon
  export const Star: Icon
  export const Copy: Icon
  export const TrendingUp: Icon
  export const TrendingDown: Icon
  export const DollarSign: Icon
  export const Activity: Icon
  export const Users: Icon
  export const Timer: Icon
  export const ZapOff: Icon
  export const Check: Icon
  export const X: Icon
  export const Upload: Icon
  export const FileText: Icon
  export const CheckCircle: Icon
  export const Loader2: Icon
  export const Wallet: Icon
  export const ExternalLink: Icon
  export const ArrowRight: Icon
  export const MessageCircle: Icon
  export const MapPin: Icon
  export const Phone: Icon
  export const History: Icon
  export const AlertCircle: Icon
  export const Eye: Icon
  export const EyeOff: Icon
  export const LogOut: Icon
  export const Settings: Icon
  export const ChevronDown: Icon
  export const ChevronUp: Icon
  export const ChevronLeft: Icon
  export const ChevronRight: Icon
  export const Menu: Icon
  export const Search: Icon
  export const Bell: Icon
  export const BarChart3: Icon
  export const PieChart: Icon
  export const RefreshCw: Icon
  export const Shield: Icon
  export const Award: Icon
  export const Globe: Icon
  export const Zap: Icon
  export const Sparkles: Icon
  export const Edit3: Icon
  export const Sliders: Icon
  export const Target: Icon
  export const Bot: Icon
  export const BadgeCheck: Icon
  export const Circle: Icon
  export const Play: Icon
  export const Pause: Icon
  export const Info: Icon
  export const HelpCircle: Icon
  export const Twitter: Icon
  export const Github: Icon
  export const Linkedin: Icon
  export const Send: Icon
  export const Clock: Icon
  export const DollarSignIcon: Icon
  export const MoreVertical: Icon
  export const Download: Icon
  export const Filter: Icon
  export const RotateCcw: Icon
  export const Move: Icon
  export const GripVertical: Icon
  export const UserCheck: Icon
  export const XCircle: Icon
  export const Save: Icon
  export const MessageSquare: Icon
  export const ThumbsUp: Icon
  export const Share2: Icon
  export const Coins: Icon
  export const UserPlus: Icon
  export const ArrowDownLeft: Icon
  export const ArrowUpRight: Icon
  export const AlertTriangle: Icon
  export const ArrowUpDown: Icon
  export const ArrowDown: Icon
  export const ArrowUp: Icon
  export const Banknote: Icon
  export const Bitcoin: Icon
  export const Briefcase: Icon
  export const Flame: Icon
  export const Gem: Icon
  export const HeadphonesIcon: Icon
  export const LayoutDashboard: Icon
  export const Line: Icon
  export const Repeat: Icon
  export const ShieldAlert: Icon
  export const User: Icon
  export const Wallet: Icon
  export const Download: Icon
  export const Menu: Icon
  export const LogOut: Icon
  export const Shield: Icon
  export const Globe: Icon
  export const Award: Icon
  export const LineChart: Icon
}

declare module "@supabase/ssr" {
  import type { SupabaseClient } from "@supabase/supabase-js"
  type CookieOptions = { name: string; value: string; options?: Record<string, unknown> }
  export function createBrowserClient(
    supabaseUrl: string, supabaseKey: string, options?: Record<string, unknown>
  ): SupabaseClient
  export function createServerClient(
    supabaseUrl: string, supabaseKey: string,
    options: { cookies: { getAll(): CookieOptions[]; setAll(cookies: CookieOptions[]): void } }
  ): SupabaseClient
}

declare module "@react-three/fiber" {
  import type { FC, ReactNode } from "react"
  export const Canvas: FC<{ children?: ReactNode; camera?: Record<string, unknown>; gl?: Record<string, unknown>; dpr?: number | [number, number]; style?: React.CSSProperties; className?: string; [key: string]: unknown }>
  interface FrameState {
    clock: { getElapsedTime(): number; getDelta(): number }
    camera: any
    gl: any
    scene: any
    pointer: { x: number; y: number }
    size: { width: number; height: number }
    viewport: Record<string, number>
  }
  export function useFrame(callback: (state: FrameState, delta: number) => void, renderPriority?: number): void
  export function useThree(): { camera: any; gl: any; scene: any; size: { width: number; height: number }; viewport: Record<string, number>; clock: { getElapsedTime(): number; getDelta(): number } }
  export function createPortal(children: ReactNode, container: Record<string, unknown>): ReactNode
}

declare module "@react-three/drei" {
  import type { FC, ReactNode } from "react"
  export const OrbitControls: FC<Record<string, unknown>>
  export const Environment: FC<Record<string, unknown>>
  export const Float: FC<{ children?: ReactNode; [key: string]: unknown }>
  export const Text: FC<Record<string, unknown>>
  export const Center: FC<Record<string, unknown>>
  export const Line: FC<Record<string, unknown>>
}

declare module "@react-three/postprocessing" {
  import type { FC, ReactNode } from "react"
  export const EffectComposer: FC<{ children?: ReactNode; [key: string]: unknown }>
  export const Bloom: FC<Record<string, unknown>>
  export const ChromaticAberration: FC<Record<string, unknown>>
}

declare module "postprocessing" {
  export const BlendFunction: Record<string, number>
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string }
  export default classes
}
