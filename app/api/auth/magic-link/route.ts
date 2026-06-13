import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// サービスロール（ホワイトリスト照合用・RLSバイパス）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// マジックリンク送信用（anonキーで signInWithOtp を叩くとメールが送信される）
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { email, redirectTo } = await req.json();
    const normalized = String(email || '').trim().toLowerCase();

    if (!normalized || !normalized.includes('@')) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }

    // ── ホワイトリスト照合（登録メールのみ送信）──
    const { data: allowed } = await supabaseAdmin
      .from('allowed_emails')
      .select('id')
      .eq('email', normalized)
      .maybeSingle();

    if (!allowed) {
      // 未登録メールにはリンクを送らない
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
    }

    // ── マジックリンク送信 ──
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
