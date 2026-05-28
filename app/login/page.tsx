'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Star, UserX } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) setLoading(false);
  };

  // ✅ 匿名ログイン
  const handleGuestLogin = async () => {
    setGuestLoading(true);
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('ゲストログイン失敗:', error.message);
      setGuestLoading(false);
      return;
    }

    router.push('/dashboard?loggedIn=true');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <a href="/" className="flex justify-center items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Star className="text-white" size={24} />
          </div>
          <span className="text-2xl font-black text-gray-900 tracking-tighter">TEP Portal</span>
        </a>
        <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">Student Login</h2>
        <p className="text-center text-gray-400 mt-2 font-medium">Googleアカウントでログインしてください</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 space-y-4">

          {/* Googleログイン */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || guestLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin text-gray-400" size={22} />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
                Googleでログイン
              </>
            )}
          </button>

          {/* 区切り線 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-bold">または</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* ゲストログイン */}
          <button
            onClick={handleGuestLogin}
            disabled={loading || guestLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 hover:border-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {guestLoading ? (
              <Loader2 className="animate-spin text-gray-400" size={22} />
            ) : (
              <>
                <UserX size={22} />
                ゲストとして試す
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 font-medium pt-1">
            ※ ゲストの受験履歴はアカウント未登録のため保存されません
          </p>
        </div>
      </div>
    </div>
  );
}
