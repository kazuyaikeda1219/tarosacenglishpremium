'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Clock, TrendingUp, Calendar, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';

const ADMIN_PASSCODE = 'tep2026';
const TOTAL_ROADMAP_ITEMS = 145;

const LEARNING_TYPES = [
  'インプット型（読む・聞く）',
  'アウトプット型（話す・書く）',
  '分析型（文法・構造を理解したい）',
  '体験型（実際に使いながら覚えたい）',
  'コツコツ継続型',
  'まとめて集中型',
];

type SurveyData = {
  certifications: string;
  learning_type: string[];
  daily_study_time: string;
  learning_history: string;
  learning_purpose: string;
  goal_after_tep: string;
  struggles: string;
  self_analysis_pronunciation: string;
  self_analysis_grammar: string;
  self_analysis_vocabulary: string;
};

const EMPTY_SURVEY: SurveyData = {
  certifications: '',
  learning_type: [],
  daily_study_time: '',
  learning_history: '',
  learning_purpose: '',
  goal_after_tep: '',
  struggles: '',
  self_analysis_pronunciation: '',
  self_analysis_grammar: '',
  self_analysis_vocabulary: '',
};

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'learning' | 'survey'>('learning');
  const [student, setStudent] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [survey, setSurvey] = useState<SurveyData>(EMPTY_SURVEY);
  const [surveyExists, setSurveyExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isAuthenticated) fetchStudentDetail();
  }, [isAuthenticated]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) { setIsAuthenticated(true); setAuthError(false); }
    else { setAuthError(true); setPasscode(''); }
  };

  const fetchStudentDetail = async () => {
    setLoading(true);
    const { id } = params;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
    const { data: studyLogs } = await supabase.from('study_logs').select('*').eq('user_id', id).order('study_date', { ascending: false });
    const { count } = await supabase.from('roadmap_progress').select('*', { count: 'exact', head: true }).eq('user_id', id).eq('is_completed', true);
    const { data: surveyData } = await supabase.from('student_profiles').select('*').eq('id', id).single();

    const totalMinutes = studyLogs?.reduce((acc, log) => acc + (log.study_time_minutes || 0), 0) || 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split('T')[0];
    const weeklyMinutes = studyLogs?.filter(l => l.study_date >= cutoff).reduce((acc, log) => acc + (log.study_time_minutes || 0), 0) || 0;

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

    if (surveyData) {
      setSurvey({
        certifications: surveyData.certifications || '',
        learning_type: surveyData.learning_type || [],
        daily_study_time: surveyData.daily_study_time || '',
        learning_history: surveyData.learning_history || '',
        learning_purpose: surveyData.learning_purpose || '',
        goal_after_tep: surveyData.goal_after_tep || '',
        struggles: surveyData.struggles || '',
        self_analysis_pronunciation: surveyData.self_analysis_pronunciation || '',
        self_analysis_grammar: surveyData.self_analysis_grammar || '',
        self_analysis_vocabulary: surveyData.self_analysis_vocabulary || '',
      });
      setSurveyExists(true);
    }

    setLogs(studyLogs?.slice(0, 14) || []);
    setLoading(false);
  };

  const handleSurveySave = async () => {
    setSaving(true);
    setSaved(false);
    const { id } = params;

    if (surveyExists) {
      await supabase.from('student_profiles').update({ ...survey, updated_at: new Date().toISOString() }).eq('id', id);
    } else {
      await supabase.from('student_profiles').insert({ id, ...survey });
      setSurveyExists(true);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleLearningType = (type: string) => {
    setSurvey(s => ({
      ...s,
      learning_type: s.learning_type.includes(type)
        ? s.learning_type.filter(t => t !== type)
        : [...s.learning_type, type],
    }));
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
              onChange={e => setPasscode(e.target.value)}
              autoFocus
            />
            {authError && <p className="text-red-400 text-sm font-bold text-center">パスコードが違います</p>}
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold"><Loader2 className="animate-spin" size={32} /></div>;

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

          {/* タブ */}
          <div className="flex gap-2 mb-8 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit shadow-sm">
            {[
              { id: 'learning', label: '学習データ' },
              { id: 'survey',   label: 'アンケート回答' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'learning' | 'survey')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── タブ① 学習データ ── */}
          {activeTab === 'learning' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '総学習時間', value: `${student.totalHours}h`, color: 'text-blue-600' },
                  { label: '今週の学習', value: `${student.weeklyHours}h`, color: 'text-green-600' },
                  { label: '進捗', value: `${student.progress}%`, color: 'text-violet-600' },
                  { label: '最終学習日', value: student.lastActive, color: 'text-orange-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-sm font-bold text-gray-700">ロードマップ進捗</span>
                  <span className="text-sm font-black text-blue-600">{student.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${student.progress}%` }} />
                </div>
              </div>

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
          )}

          {/* ── タブ② アンケート回答 ── */}
          {activeTab === 'survey' && (
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-8">

              {!surveyExists && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl px-5 py-4 text-sm text-yellow-700 font-bold">
                  まだアンケートが未回答です
                </div>
              )}

              {/* ① 保有検定 */}
              <SurveyField
                label="保有している検定・スコアと取得時期"
                hint="例）英検3級・2年前 / TOEIC500・3ヶ月前 / なし"
              >
                <textarea
                  value={survey.certifications}
                  onChange={e => setSurvey(s => ({ ...s, certifications: e.target.value }))}
                  rows={3}
                  className={textareaClass}
                  placeholder="なし"
                />
              </SurveyField>

              {/* ② 学習タイプ */}
              <SurveyField label="学習タイプ（複数選択可）">
                <div className="flex flex-wrap gap-2">
                  {LEARNING_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleLearningType(type)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        survey.learning_type.includes(type)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </SurveyField>

              {/* ③ 学習時間 */}
              <SurveyField label="1日に英語学習に取れる時間" hint="通勤・ながら時間も含めてOK">
                <input
                  type="text"
                  value={survey.daily_study_time}
                  onChange={e => setSurvey(s => ({ ...s, daily_study_time: e.target.value }))}
                  className={inputClass}
                  placeholder="例）30分〜1時間"
                />
              </SurveyField>

              {/* ④ 学習歴 */}
              <SurveyField label="英語学習歴" hint="社会人の場合、学生時代は除外">
                <input
                  type="text"
                  value={survey.learning_history}
                  onChange={e => setSurvey(s => ({ ...s, learning_history: e.target.value }))}
                  className={inputClass}
                  placeholder="例）半年、ほぼなし"
                />
              </SurveyField>

              {/* ⑤ 学習の理由・目的 */}
              <SurveyField label="英語学習の理由・目的">
                <textarea
                  value={survey.learning_purpose}
                  onChange={e => setSurvey(s => ({ ...s, learning_purpose: e.target.value }))}
                  rows={4}
                  className={textareaClass}
                  placeholder="できる限り詳しく記載してください"
                />
              </SurveyField>

              {/* ⑥ TEP終了後の目標 */}
              <SurveyField label="TEP終了後（6ヶ月後）の目標">
                <textarea
                  value={survey.goal_after_tep}
                  onChange={e => setSurvey(s => ({ ...s, goal_after_tep: e.target.value }))}
                  rows={4}
                  className={textareaClass}
                  placeholder="どんな英語技能を、どこまで伸ばしたいか"
                />
              </SurveyField>

              {/* ⑦ 悩み */}
              <SurveyField label="英語学習の悩み・継続できなかった理由">
                <textarea
                  value={survey.struggles}
                  onChange={e => setSurvey(s => ({ ...s, struggles: e.target.value }))}
                  rows={4}
                  className={textareaClass}
                  placeholder="できる限り詳しく記載してください"
                />
              </SurveyField>

              {/* ⑧ 自己分析 */}
              <SurveyField label="自己分析">
                <div className="space-y-3">
                  {[
                    { key: 'self_analysis_pronunciation', label: '① 発音技能' },
                    { key: 'self_analysis_grammar',       label: '② 文法知識' },
                    { key: 'self_analysis_vocabulary',    label: '③ 単語知識' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
                      <textarea
                        value={survey[key as keyof SurveyData] as string}
                        onChange={e => setSurvey(s => ({ ...s, [key]: e.target.value }))}
                        rows={2}
                        className={textareaClass}
                        placeholder="自己分析を記載"
                      />
                    </div>
                  ))}
                </div>
              </SurveyField>

              {/* 保存ボタン */}
              <button
                onClick={handleSurveySave}
                disabled={saving || saved}
                className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" />
                  : saved ? <><CheckCircle2 size={18} /> 保存しました</>
                  : <><Save size={18} /> 保存する</>}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── 共通スタイル ─────────────────────────────────────────
const inputClass = "w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all";
const textareaClass = "w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none";

function SurveyField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-black text-gray-800 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 font-medium mb-2">{hint}</p>}
      {children}
    </div>
  );
}
