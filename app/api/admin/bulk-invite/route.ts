import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { students } = await req.json();

    if (!students || !Array.isArray(students)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const results = [];

    for (const student of students) {
      const email = String(student.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        results.push({ email: student.email, status: 'error', message: '無効なメールアドレス' });
        continue;
      }

      // ── 1. ホワイトリスト登録（最優先：これがログイン可否を決める） ──
      const { error: whitelistError } = await supabaseAdmin
        .from('allowed_emails')
        .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });

      if (whitelistError) {
        results.push({ email, status: 'error', message: whitelistError.message });
        continue;
      }

      // ── 2. Auth ユーザー & profiles を事前作成（任意：生徒情報の先行登録） ──
      //  初回 Google ログイン時に同一メールへ自動リンクされ、
      //  ここで保存した student_id / start_date が引き継がれる。
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { display_name: student.name },
      });

      // 既に Auth ユーザーが存在する等で失敗しても、
      // ホワイトリスト登録は完了しているのでログインは可能。
      if (authError || !authUser?.user) {
        results.push({ email, status: 'whitelisted', message: authError?.message });
        continue;
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: authUser.user.id,
            display_name: student.name,
            student_id: student.student_id, // C列
            start_date: student.start_date, // E列
            role: 'student',
          },
        ]);

      results.push({
        email,
        status: profileError ? 'partial_success' : 'success',
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
