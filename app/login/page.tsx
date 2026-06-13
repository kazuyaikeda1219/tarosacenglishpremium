'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Star, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [mailLoading, setMailLoading] = useState(false);
  const [mailSent, setMailSent] = useState(false);
  const [mailError, setMailError] = useState('');
  const searchParams = useSearchParams();
  const supabase = createClient();

  // /login?error=unauthorized で来た場合にエラー表示
  const isUnauthorized = searchParams.get('error') === 'unauthorized';

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

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMailError('');
    const target = email.trim().toLowerCase();
    if (!target.includes('@')) {
      setMailError('有効なメールアドレスを入力してください');
      return;
    }
    setMailLoading(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: target,
          redirectTo: `${window.location.origin}/auth/callback`,
        }),
      });
      if (res.ok) {
        setMailSent(true);
      } else if (res.status === 403) {
        setMailError('このメールアドレスはTEPに登録されていません。担当者にお問い合わせください。');
      } else {
        setMailError('送信に失敗しました。時間をおいて再度お試しください。');
      }
    } catch {
      setMailError('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setMailLoading(false);
    }
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
        <p className="text-center text-gray-400 mt-2 font-medium">登録済みのメールアドレスでログインしてください</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">

        {/* 未登録アカウントエラー */}
        {isUnauthorized && (
          <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl px-5 py-4">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm">アクセスが許可されていません</p>
              <p className="text-xs font-medium mt-0.5 text-red-400">
                このアカウントはTEPに登録されていません。担当者にお問い合わせください。
              </p>
            </div>
          </div>
        )}

        <div className="bg-white py-10 px-8 shadow-xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 space-y-4">

          {/* Googleログイン */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
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

          {/* メールログイン（マジックリンク） */}
          {mailSent ? (
            <div className="flex flex-col items-center gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-6 text-center">
              <CheckCircle2 className="text-green-500" size={28} />
              <p className="font-black text-sm text-green-700">ログインリンクを送信しました</p>
              <p className="text-xs font-medium text-green-600">
                <span className="font-bold">{email.trim().toLowerCase()}</span> 宛のメールを開き、リンクをクリックしてログインしてください。
              </p>
              <button
                onClick={() => { setMailSent(false); setEmail(''); }}
                className="text-xs text-indigo-600 font-bold underline mt-1"
              >
                別のメールアドレスを使う
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setMailError(''); }}
                placeholder="your-email@example.com"
                className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 transition-all"
              />
              <button
                type="submit"
                disabled={mailLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                {mailLoading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    <Mail size={20} />
                    メールでログインリンクを送る
                  </>
                )}
              </button>
              {mailError && (
                <p className="flex items-start gap-2 text-red-500 text-xs font-bold">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />{mailError}
                </p>
              )}
            </form>
          )}

          <p className="text-center text-xs text-gray-400 font-medium pt-1">
            ※ TEPに登録されたメールアドレスのみログインできます（Googleアカウント不要のメールログインにも対応）
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={36} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
