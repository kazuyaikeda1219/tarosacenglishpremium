'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();

        // ✅ profilesレコードを自動作成（既にあればスキップ）
        const user = session.user;
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existing) {
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
          const avatarUrl = user.user_metadata?.avatar_url || null;

          await supabase.from('profiles').insert({
            id: user.id,
            display_name: fullName,
            username: user.email?.split('@')[0] || null,
            avatar_url: avatarUrl,
            role: 'student',
            current_level: 'Beginner',
          });
        }

        router.push('/dashboard?loggedIn=true');
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">ログイン中...</p>
      </div>
    </div>
  );
}