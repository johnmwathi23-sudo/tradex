"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let subscription: { unsubscribe: () => void } | null = null

    const init = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()

        const { data } = await supabase.auth.getUser()
        if (!cancelled) setUser(data.user)

        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!cancelled) setUser(session?.user ?? null)
        })
        subscription = sub
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    init().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
