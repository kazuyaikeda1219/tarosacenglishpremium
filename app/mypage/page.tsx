'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Award, BookOpen, TrendingUp, Loader2, LayoutDashboard, ClipboardList, Map, Video } from 'lucide-react';

type QuizResult = {
  id: string;
  category: string;
  chapter: string | null;
  score: number;
  total: number;
  taken_at: string;
};

const NAV_ITEMS = [
  { label: 'ダッシュボード', href: '/dashboard', icon: <LayoutDashboard size={18} />, color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' },
  { label: 'テスト', href: '/test', icon: <ClipboardList size={18} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100' },
  { label: 'ロードマップ', href: '/roadmap', icon: <Map size={18} />, color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100' },
  { label: '動画視聴', href: '/library', icon: <Video size={18} />, color: 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100' },
];

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data } = await supabase
        .from('quiz_results')
        .select('*')
        .order('taken_at', { ascending: false });

      setResults(data ?? []);
      setLoading(false);
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  const totalAttempts = results.length;
  const avgPct = totalAttempts > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / totalAttempts)
    : 0;
  const bestPct = totalAttempts > 0
    ? Math.max(...results.map(r => Math.round((r.score / r.total) * 100)))
    : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6 mt-4">

        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">マイページ</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        </div>

        {/* ✅ ナビゲーションボタン */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl border font-bold text-sm transition-all ${item.color}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        {/* サマリーカード */}
        {totalAttempts > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <BookOpen size={18} className="text-indigo-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-900">{totalAttempts}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">受験回数</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <TrendingUp size={18} className="text-indigo-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-gray-900">{avgPct}%</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">平均正答率</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
              <Award size={18} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-yellow-500">{bestPct}%</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">最高正答率</p>
            </div>
          </div>
        )}

        {/* 受験履歴 */}
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-4">
          受験履歴
        </h2>

        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((r) => {
              const pct = Math.round((r.score / r.total) * 100);
              const isPerfect = pct === 100;
              const isGood = pct >= 70;
              const colorClass = isPerfect ? 'text-yellow-500' : isGood ? 'text-indigo-600' : 'text-red-500';
              const bgClass = isPerfect ? 'bg-yellow-50 border-yellow-100' : isGood ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100';

              return (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      {r.category}
                      {r.chapter && <span className="text-gray-400 font-medium"> / {r.chapter}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(r.taken_at).toLocaleDateString('ja-JP', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className={`text-center px-4 py-2 rounded-xl border ${bgClass}`}>
                    <p className={`text-xl font-black ${colorClass}`}>{r.score}/{r.total}</p>
                    <p className={`text-xs font-bold ${colorClass}`}>{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">まだ受験履歴がありません</p>
            <Link href="/test" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-all">
              テストを受ける
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
