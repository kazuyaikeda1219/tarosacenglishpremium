'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { BookOpen, LogOut, ShieldCheck, LogIn, UserCircle } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const avatarUrl = user.user_metadata?.avatar_url || null;
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || null;
        setUserAvatar(avatarUrl);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserRole(profile.role);
          setUserName(profile.display_name || fullName || user.email || 'User');
        } else {
          setUserName(fullName || user.email || 'User');
        }
      }
    };
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setUserAvatar(null);
    router.push('/');
  };

  return (
    // ✅ スマホでは非表示、PCのみ表示
    <nav className="hidden md:block bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter text-gray-900 uppercase">
            Tarosac English Premium
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {userRole === 'admin' && (
                <Link href="/admin" className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-red-50 text-red-600 rounded-full border border-red-100">
                  <ShieldCheck size={14} /> Admin Console
                </Link>
              )}
              <Link
                href="/mypage"
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all"
              >
                <UserCircle size={14} /> マイページ
              </Link>
              <div className="h-8 w-[1px] bg-gray-100 mx-1" />
              <div className="flex items-center gap-3">
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={userName}
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-bold text-gray-600">{userName}</span>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-all">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <LogIn size={18} /> Googleでログイン
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
