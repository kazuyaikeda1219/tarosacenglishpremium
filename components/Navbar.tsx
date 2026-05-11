'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { BookOpen, LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // profilesテーブルから権限と名前を取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          setUserName(profile.display_name || 'User');
        }
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // ログアウト後はログイン画面へ
  };

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        
        {/* ロゴ：クリックでDashboardに戻る */}
<Link href="/dashboard" className="flex items-center gap-2 group">
  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
    <BookOpen size={20} className="text-white" />
  </div>
  <span className="font-black text-xl tracking-tighter text-gray-900 uppercase">
    Tarosac English Premium
  </span>
</Link>
        <div className="flex items-center gap-4">
          {/* 管理者（Tarosac/Ikeda）だけに表示されるボタン */}
          {userRole === 'admin' && (
            <Link 
              href="/admin" 
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all border border-red-100"
            >
              <ShieldCheck size={14} />
              Admin Console
            </Link>
          )}
          
          <div className="h-8 w-[1px] bg-gray-100 mx-1" />
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-600">{userName}</span>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}