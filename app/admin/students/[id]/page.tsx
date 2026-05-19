'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Clock, TrendingUp, Calendar, Lock } from 'lucide-react';

const ADMIN_PASSCODE = 'tep2026';
const TOTAL_ROADMAP_ITEMS = 145;

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [student, setStudent] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (isAuthenticated) fetchStudentDetail();
  }, [isAuthenticated]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasscode('');
    }
  };

  const fetchStudentDetail = async () => {
    setLoading(true);
    const { id } = params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    const { data: studyLogs } = await supabase
      .from('study_logs')
      .select('*')
      .eq('user_id', id)
      .order('study_date', { ascending: false });

    const { count } = await supabase
      .from('roadmap_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('is_completed', true);

    const totalMinutes = studyLogs?.reduce((acc, log) => acc + (log.study_time_minutes || 0), 0) || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const weeklyMinutes = studyLogs?.filter(log => log.study_date >= sevenDaysAgoStr)
      .reduce((acc, log) => acc + (log.study_time_minutes || 0), 0) || 0;

    setStudent({
      name: profile?.display_name || 'Unknown',
      email: profile?.email || '-',
      student_id: profile?.student_id || '-',
      role: profile?.role || 'student',
      progress: Math.round(((count || 0) / TOTAL_ROADMAP_ITEMS) * 100),
      totalHours: (totalMinutes / 60).toFixed(1),
      weeklyHours: (weeklyMinutes / 60).toFixed(1),
      lastActive: studyLogs?.[0]?.study_date || 'No data',
    });

    setLogs(studyLogs?.slice(0, 14) || []);
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <Lock className="text-indigo-400" size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">TEP Admin Access</h1>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="password"
              className="w-full bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-center text-xl tracking-[1em]"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm font-bold text-center">パスコードが違います</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="p-6 text-gray-800">
        <div className="max-w-4xl mx-auto">

          <Link href="/admin" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest mb-6">
            <ArrowLeft size={14} /> Back to Admin
          </Link>

          {/* プロフィールヘッダー */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-3xl">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">{student.name}</h1>
                <p className="text-gray-400 font-medium mt-1">{student.email}</p>
                {student.student_id !== '-' && (
                  <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-lg mt-2 inline-block">
                    ID: {student.student_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 統計カード */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '総学習時間', value: `${student.totalHours}h`, icon: Clock, color: 'blue' },
              { label: '今週の学習', value: `${student.weeklyHours}h`, icon: TrendingUp, color: 'green' },
              { label: '進捗', value: `${student.progress}%`, icon: TrendingUp, color: 'purple' },
              { label: '最終学習日', value: student.lastActive, icon: Calendar, color: 'orange' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                <p className={`text-2xl font-black text-${color}-600`}>{value}</p>
              </div>
            ))}
          </div>

          {/* 進捗バー */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-end mb-3">
              <span className="text-sm font-bold text-gray-700">ロードマップ進捗</span>
              <span className="text-sm font-black text-blue-600">{student.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${student.progress}%` }} />
            </div>
          </div>

          {/* 直近の学習ログ */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-6">直近の学習ログ</h2>
            {logs.length === 0 ? (
              <p className="text-gray-400 text-center py-8 font-medium">学習ログがありません</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-bold text-gray-600">{log.study_date}</span>
                    <span className="text-sm font-black text-blue-600">{log.study_time_minutes}分</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}