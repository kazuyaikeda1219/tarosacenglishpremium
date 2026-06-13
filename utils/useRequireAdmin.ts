'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export type AdminAuthState = 'loading' | 'denied' | 'ok'

/**
 * 管理者専用ページのガード。
 * - 未ログイン → /login へリダイレクト
 * - profiles.role !== 'admin' → 'denied'
 * - admin → 'ok'
 *
 * ミドルウェアでも /admin は role=admin 保護しているが、
 * クライアント側でも判定して UX とフォールバックを担保する。
 */
export function useRequireAdmin(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>('loading')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let active = true

    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      setState(profile?.role === 'admin' ? 'ok' : 'denied')
    })()

    return () => {
      active = false
    }
  }, [router])

  return state
}
