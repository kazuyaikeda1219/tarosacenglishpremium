import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 認証不要でアクセスできるパス（ログイン前に通過する必要がある）
function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth')
  )
}

// 管理者のみアクセス可能なパス
function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({
            name,
            value,
            ...options,
            secure: false,
            sameSite: 'lax',
            path: '/',
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({
            name,
            value: '',
            ...options,
            secure: false,
            sameSite: 'lax',
            path: '/',
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 公開ページはそのまま通す
  if (isPublicPath(pathname)) {
    return response
  }

  // 未ログイン → ログインページへ
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── ホワイトリスト照合（登録メールのみ利用可） ──
  const email = user.email?.toLowerCase()
  let isAllowed = false
  if (email) {
    const { data: allowed } = await supabase
      .from('allowed_emails')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    isAllowed = !!allowed
  }

  // 登録外（または匿名ユーザー）→ ログインページへ強制送還
  if (!isAllowed) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
  }

  // ── 管理者ページは role=admin のみ ──
  if (isAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      // API は 403、ページは dashboard へ
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}
