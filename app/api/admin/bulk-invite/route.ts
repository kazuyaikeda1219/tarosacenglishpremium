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
      // 1. Auth ユーザー作成
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: student.email,
        password: 'tep2026start', 
        email_confirm: true,
        user_metadata: { display_name: student.name }
      });

      if (authError) {
        results.push({ email: student.email, status: 'error', message: authError.message });
        continue;
      }

      // 2. Profile テーブルに全データを保存
      if (authUser.user) {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert([
            { 
              id: authUser.user.id, 
              display_name: student.name, 
              student_id: student.student_id, // C列
              start_date: student.start_date, // E列
              role: 'student' 
            }
          ]);

        results.push({ 
          email: student.email, 
          status: profileError ? 'partial_success' : 'success' 
        });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}