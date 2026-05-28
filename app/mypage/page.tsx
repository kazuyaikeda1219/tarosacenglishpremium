'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import {
  Award, BookOpen, TrendingUp, Loader2, Clock, Pencil,
  X, Save, CheckCircle2, Mic, Languages, ChevronRight,
} from 'lucide-react';

// ── ロードマップのセクション定義（roadmap/page.tsx と同期） ──
const ROADMAP_SECTIONS = [
  { key: 'pronunciation',        label: '発音',                    total: 47,  color: 'bg-pink-500',    text: 'text-pink-600'    },
  { key: 'grammar_evine',        label: '英文法 Mr.Evine',         total: 29,  color: 'bg-blue-500',    text: 'text-blue-600'    },
  { key: 'grammar_evergreen',    label: '英文法 Evergreen',        total: 24,  color: 'bg-indigo-500',  text: 'text-indigo-600'  },
  { key: 'vocab_kikutan_entry',  label: 'キクタン Entry',          total: 15,  color: 'bg-green-500',   text: 'text-green-600'   },
  { key: 'vocab_kikutan_basic',  label: 'キクタン Basic',          total: 10,  color: 'bg-emerald-500', text: 'text-emerald-600' },
  { key: 'vocab_kikutan_advanced', label: 'キクタン Advanced',     total: 10,  color: 'bg-teal-500',    text: 'text-teal-600'    },
  { key: 'vocab_database',       label: 'Database 3300',           total: 6,   color: 'bg-cyan-500',    text: 'text-cyan-600'    },
  { key: 'vocab_duo',            label: 'DUO 3.0',                 total: 45,  color: 'bg-violet-500',  text: 'text-violet-600'  },
];

// セクションキー → アイテムIDプレフィックスのマッピング
const SECTION_ID_PREFIXES: Record<string, string[]> = {
  pronunciation:          ['p'],
  grammar_evine:          ['g1','g2','g3','g4','g5','g6','g7','g8','g9','g10','g11','g12','g13','g14','g15','g16','g17','g18','g19','g20','g21','g22','g23','g24','g25','g26','g27','g28','g29'],
  grammar_evergreen:      ['g30','g31','g32','g33','g34','g35','g36','g37','g38','g39','g40','g41','g42','g43','g44','g45','g46','g47','g48','g49','g50','g51','g52','g53'],
  vocab_kikutan_entry:    ['v-e'],
  vocab_kikutan_basic:    ['v-b'],
  vocab_kikutan_advanced: ['v-a'],
  vocab_database:         ['v-d'],
  vocab_duo:              ['v-duo'],
};

type QuizResult = {
  id: string;
  category: string;
  chapter: string | null;
  score: number;
  total: number;
  taken_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
　const [surveyDone, setSurveyDone] = useState(true);

  // モーダル
  const [modalOpen, setModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      // プロフィール
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);

      // 受験履歴
      const { data: qr } = await supabase.from('quiz_results').select('*').order('taken_at', { ascending: false });
      setResults(qr ?? []);

      // ロードマップ進捗
      const { data: rp } = await supabase.from('roadmap_progress').select('item_key').eq('user_id', user.id).eq('is_completed', true);
      setCompletedIds(new Set((rp ?? []).map(d => d.item_key)));

      // アンケート完了確認
      const { data: sp } = await supabase.from('student_profiles').select('id').eq('id', user.id).single();
      setSurveyDone(!!sp);

      // 学習時間
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoff = sevenDaysAgo.toISOString().split('T')[0];
      const { data: logs } = await supabase.from('study_logs').select('study_time_minutes, study_date').eq('user_id', user.id);
      const total = logs?.reduce((a, l) => a + (l.study_time_minutes || 0), 0) || 0;
      const weekly = logs?.filter(l => l.study_date >= cutoff).reduce((a, l) => a + (l.study_time_minutes || 0), 0) || 0;
      setTotalMinutes(total);
      setWeeklyMinutes(weekly);

      setLoading(false);
    };
    initialize();
  }, []);

  // セクションごとの完了数を計算
  const getSectionProgress = (sectionKey: string, total: number) => {
    const prefixes = SECTION_ID_PREFIXES[sectionKey];
    if (!prefixes) return 0;

    // grammar_evine / grammar_evergreen はID完全一致で判定
    if (sectionKey === 'grammar_evine') {
      const done = prefixes.filter(id => completedIds.has(id)).length;
      return Math.round((done / total) * 100);
    }
    if (sectionKey === 'grammar_evergreen') {
      const done = prefixes.filter(id => completedIds.has(id)).length;
      return Math.round((done / total) * 100);
    }

    // その他はプレフィックス前方一致
    const done = [...completedIds].filter(id => prefixes.some(p => id.startsWith(p))).length;
    return Math.round((done / total) * 100);
  };

  const openModal = () => {
    setEditName(profile?.display_name || '');
    setSaved(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
  if (!user) return;
  setSaving(true);
  const { data, error } = await supabase.from('profiles').update({ display_name: editName.trim() }).eq('id', user.id).select();
  console.log('update result:', { data, error, userId: user.id, editName });
  setProfile(p => p ? { ...p, display_name: editName.trim() } : p);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setModalOpen(false), 800);
  };

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
    ? Math.round(results.reduce((s, r) => s + (r.score / r.total) * 100, 0) / totalAttempts) : 0;
  const bestPct = totalAttempts > 0
    ? Math.max(...results.map(r => Math.round((r.score / r.total) * 100))) : 0;

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Student';
  const avatarUrl = user?.user_metadata?.avatar_url || profile?.avatar_url || null;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6 mt-4 space-y-8">

        {/* ── アンケート未回答アラート ── */}
        {!surveyDone && (
          <Link href="/onboarding" className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 hover:bg-amber-100 transition-all">
            <div>
              <p className="text-sm font-black text-amber-700">📋 初回アンケートが未回答です</p>
              <p className="text-xs text-amber-500 font-medium mt-0.5">タップして回答してください（約3分）</p>
            </div>
            <ChevronRight size={18} className="text-amber-500 shrink-0" />
          </Link>
        )}

        {/* ── プロフィールヘッダー ── */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 truncate">{displayName}</h1>
            <p className="text-sm text-gray-400 font-medium truncate mt-0.5">{user?.email}</p>
            {profile?.role && (
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded-lg">
                {profile.role}
              </span>
            )}
          </div>
          <button
            onClick={openModal}
            className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shrink-0"
          >
            <Pencil size={18} />
          </button>
        </div>

        {/* ── 統計カード ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">学習統計</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={<BookOpen size={16} className="text-indigo-400" />} value={`${totalAttempts}`}    label="受験回数" />
            <StatCard icon={<TrendingUp size={16} className="text-indigo-400" />} value={`${avgPct}%`}        label="平均正答率" />
            <StatCard icon={<Award size={16} className="text-yellow-400" />}      value={`${bestPct}%`}       label="最高正答率" valueColor="text-yellow-500" />
            <StatCard icon={<Clock size={16} className="text-blue-400" />}        value={`${(totalMinutes/60).toFixed(1)}h`}  label="総学習時間" />
            <StatCard icon={<Clock size={16} className="text-green-400" />}       value={`${(weeklyMinutes/60).toFixed(1)}h`} label="今週の学習時間" valueColor="text-green-600" />
          </div>
        </div>

        {/* ── ロードマップ進捗サマリー ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">ロードマップ進捗</p>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            {ROADMAP_SECTIONS.map(sec => {
              const pct = getSectionProgress(sec.key, sec.total);
              if (pct === 0) return null; // 未着手セクションは非表示
              return (
                <div key={sec.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-gray-700">{sec.label}</span>
                    <span className={`text-sm font-black ${sec.text}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className={`${sec.color} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {ROADMAP_SECTIONS.every(sec => getSectionProgress(sec.key, sec.total) === 0) && (
              <p className="text-center text-gray-300 font-bold py-4 text-sm">
                まだロードマップを開始していません
              </p>
            )}
          </div>
        </div>

        {/* ── 受験履歴 ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">受験履歴</p>
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
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium">まだ受験履歴がありません</p>
              <Link href="/test" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-all">
                テストを受ける
              </Link>
            </div>
          )}
        </div>

        <div className="h-20 md:hidden" />
      </main>

      <BottomNav />

      {/* ── プロフィール編集モーダル ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900">プロフィール編集</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* アバタープレビュー */}
            <div className="flex justify-center mb-6">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-3xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-center text-xs text-gray-400 font-medium mb-6">
              アバターはGoogleアカウントの画像を使用しています
            </p>

            <div className="mb-6">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">表示名</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                placeholder="表示名を入力"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || saved || !editName.trim()}
              className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50
                bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {saving ? <Loader2 size={17} className="animate-spin" />
                : saved ? <><CheckCircle2 size={17} /> 保存しました</>
                : <><Save size={17} /> 保存する</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 統計カード ────────────────────────────────────────────
function StatCard({ icon, value, label, valueColor = 'text-gray-900' }: {
  icon: React.ReactNode; value: string; label: string; valueColor?: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
    </div>
  );
}
