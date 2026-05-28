'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Flame, Clock, BarChart3, PlusCircle, PieChart as PieIcon, TrendingUp, BookOpen, Trash2, Map, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function DashboardContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();

  const TOTAL_ROADMAP_ITEMS = 145;

  useEffect(() => {
    const initialize = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        fetchLogs();
        fetchRoadmapProgress();
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (searchParams.get('loggedIn') === 'true') {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('study_logs')
      .select('*')
      .order('study_date', { ascending: false });
    setLogs(data || []);
  };

  const fetchRoadmapProgress = async () => {
    const { count, error } = await supabase
      .from('roadmap_progress')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true);
    if (!error && count !== null) {
      const percentage = Math.round((count / TOTAL_ROADMAP_ITEMS) * 100);
      setTotalProgress(percentage);
    }
  };

  const deleteLog = async (logId: string) => {
    if (!confirm('このログを削除してもよろしいですか？')) return;
    const { error } = await supabase.from('study_logs').delete().eq('id', logId);
    if (!error) fetchLogs();
  };

  const totalDays = useMemo(() => {
    const uniqueDates = new Set(logs.map(log => log.study_date));
    return uniqueDates.size;
  }, [logs]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      counts[log.category] = (counts[log.category] || 0) + Number(log.study_time_minutes);
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [logs]);

  const dailyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return days.map(date => {
      const dayTotal = logs
        .filter(log => log.study_date === date)
        .reduce((sum, log) => sum + Number(log.study_time_minutes), 0);
      return { displayDate: date.split('-').slice(1).join('/'), minutes: dayTotal };
    });
  }, [logs]);

  const totalMinutes = logs.reduce((acc, log) => acc + (Number(log.study_time_minutes) || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let currentUser = user;
    if (!currentUser) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      currentUser = authUser;
    }
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);
    const hours = Number(formData.get('hours')) || 0;
    const mins = Number(formData.get('mins')) || 0;

    const { error } = await supabase.from('study_logs').insert([{
      study_date: formData.get('date'),
      study_time_minutes: (hours * 60) + mins,
      category: formData.get('category'),
      note: formData.get('note'),
      user_id: currentUser.id
    }]);

    if (!error) {
      fetchLogs();
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      {/* ログイン完了トースト */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <div className="flex items-center gap-3 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl">
          <CheckCircle2 size={20} className="text-green-400 shrink-0" />
          <p className="font-bold text-sm">ログインが完了しました 🎉</p>
        </div>
      </div>

      <div className="p-6 text-gray-800">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">学習ダッシュボード</h1>
              <p className="text-gray-500 font-medium">継続は力なり！</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/roadmap" className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                <Map size={18} /> ロードマップ
              </Link>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard icon={<Flame className="text-orange-500" />} label="学習日数" value={`${totalDays} 日`} />
            <StatCard icon={<Clock className="text-blue-500" />} label="累計学習時間" value={`${totalHours} 時間`} />
            <StatCard icon={<BarChart3 className="text-green-500" />} label="習熟度" value={`${totalProgress}%`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold mb-6 flex items-center gap-2 text-gray-400 uppercase tracking-widest">
                <PieIcon size={16} /> 教材別学習時間
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xs font-bold mb-6 flex items-center gap-2 text-gray-400 uppercase tracking-widest">
                <TrendingUp size={16} /> 直近7日間の学習（分）
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="minutes" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-10">
            <h3 className="text-xs font-bold mb-5 flex items-center gap-2 text-gray-400 uppercase tracking-widest">
              <PlusCircle size={18} /> 学習ログを追加
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">日付</label>
                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white outline-none" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">学習時間</label>
                <div className="flex items-center gap-1">
                  <select name="hours" className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white outline-none">
                    {Array.from({ length: 7 }, (_, i) => (<option key={i} value={i}>{i} 時間</option>))}
                  </select>
                  <select name="mins" className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white outline-none">
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (<option key={m} value={m}>{m} 分</option>))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">教材</label>
                <select name="category" className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white outline-none w-full" required>
                  <option value="Mr.Evine中学英文法">Mr.Evine中学英文法</option>
                  <option value="総合英語Evergreen">総合英語Evergreen</option>
                  <option value="Evergreen問題集">Evergreen問題集</option>
                  <option value="シャドーイング">シャドーイング</option>
                  <option value="オンライン英会話">オンライン英会話</option>
                  <option value="キクタンEntry">キクタンEntry</option>
                  <option value="キクタンBasic">キクタンBasic</option>
                  <option value="キクタンAdvanced">キクタンAdvanced</option>
                  <option value="DataBase 3300">DataBase 3300</option>
                  <option value="Duo 3.0">Duo 3.0</option>
                  <option value="瞬間英作文（青）">瞬間英作文（青）</option>
                  <option value="瞬間英作文（緑）">瞬間英作文（緑）</option>
                  <option value="瞬間英作文（銀）">瞬間英作文（銀）</option>
                  <option value="瞬間英作文（金）">瞬間英作文（金）</option>
                  <option value="自由英作文">自由英作文</option>
                  <option value="音声添削">音声添削</option>
                  <option value="リーディング（精読）">リーディング（精読）</option>
                  <option value="独り言英会話">独り言英会話</option>
                  <option value="TOEIC学習（問題集・単語）">TOEIC学習（問題集・単語）</option>
                  <option value="英検学習（過去問）">英検学習（過去問）</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">メモ</label>
                <input name="note" type="text" placeholder="Ch.3など" className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white outline-none" />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md">
                追加
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-4">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">最近の学習記録</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b">
                    <th className="p-5">日付</th>
                    <th className="p-5">教材</th>
                    <th className="p-5 text-right">時間</th>
                    <th className="p-5">メモ</th>
                    <th className="p-5 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {logs.slice(0, 10).map((log, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-5 text-gray-500 font-medium">{log.study_date}</td>
                      <td className="p-5">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{log.category}</span>
                      </td>
                      <td className="p-5 font-bold text-right">
                        {Math.floor(log.study_time_minutes / 60) > 0 && `${Math.floor(log.study_time_minutes / 60)}時間`}
                        {log.study_time_minutes % 60 > 0 && `${log.study_time_minutes % 60}分`}
                      </td>
                      <td className="p-5 text-gray-400 italic">{log.note || '-'}</td>
                      <td className="p-5 text-center">
                        <button onClick={() => deleteLog(log.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="h-20 md:hidden" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <DashboardContent />
    </Suspense>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:translate-y-[-2px]">
      <div className="p-4 bg-gray-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
