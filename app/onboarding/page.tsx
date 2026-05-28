'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

const LEARNING_TYPES = [
  '論理的に考えるのが好き',
  'ニュアンスや感覚で進めるのが好き',
  '徹底的に管理されながら、学習を進める方が性に合っている',
  '自分で考えて進める方が性に合っている（あまり言われるとモチベーションが下がる）',
];

const STUDY_TIME_OPTIONS = ['２時間', '３時間', '４時間', 'その他'];

const LEARNING_HISTORY_OPTIONS = ['１年未満', '１年以上３年未満', '３年以上５年未満', '５年以上'];

type SurveyData = {
  name: string;
  furigana: string;
  certifications: string;
  learning_type: string[];
  daily_study_time: string;
  learning_history: string;
  learning_purpose: string;
  goal_after_tep: string;
  struggles: string;
  self_analysis_pronunciation: number;
  self_analysis_grammar: number;
  self_analysis_vocabulary: number;
};

const EMPTY_SURVEY: SurveyData = {
  name: '',
  furigana: '',
  certifications: '',
  learning_type: [],
  daily_study_time: '',
  learning_history: '',
  learning_purpose: '',
  goal_after_tep: '',
  struggles: '',
  self_analysis_pronunciation: 0,
  self_analysis_grammar: 0,
  self_analysis_vocabulary: 0,
};

const STEPS = [
  { id: 'certifications', title: '保有している検定・スコアと取得時期', hint: '例）英検3級・2年前 / TOEIC500・3ヶ月前\n何も取ったことがない場合は「なし」と記載ください', type: 'textarea' },
  { id: 'learning_type', title: 'あなたのタイプを教えてください',     hint: '複数選択可',                  type: 'multiselect' },
  { id: 'daily_study_time', title: '1日に英語学習に取れる時間',       hint: '理想ではなく現実的な時間を\n通勤・ながら時間も含めてOK', type: 'select' },
  { id: 'learning_history', title: '英語学習歴',                      hint: '社会人の場合、学生時代は除外して考えてください', type: 'selecthistory' },
  { id: 'learning_purpose', title: '英語学習の理由・目的',             hint: 'できる限り詳しく記載してください', type: 'textarea' },
  { id: 'goal_after_tep',   title: 'TEP終了後（6ヶ月後）の目標',      hint: 'どんな英語の技能を、どこまで伸ばしたいかを詳しく記載してください', type: 'textarea' },
  { id: 'struggles',        title: '英語学習の悩み・継続できなかった理由', hint: 'できる限り詳しく記載してください', type: 'textarea' },
  { id: 'self_analysis',    title: '英語の自己分析',                  hint: '各技能について1〜5で評価してください', type: 'selfanalysis' },
];

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [survey, setSurvey] = useState<SurveyData>(EMPTY_SURVEY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // すでに回答済みならマイページへ
      const { data } = await supabase.from('student_profiles').select('id').eq('id', user.id).single();
      if (data) { router.push('/mypage'); return; }

      setUser(user);
      setLoading(false);
    }
    init();
  }, []);

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = Math.round(((step) / STEPS.length) * 100);

  const canNext = () => {
    if (currentStep.type === 'multiselect') return survey.learning_type.length > 0;
    if (currentStep.type === 'selfanalysis') return (
      survey.self_analysis_pronunciation > 0 &&
      survey.self_analysis_grammar > 0 &&
      survey.self_analysis_vocabulary > 0
    );
    const val = survey[currentStep.id as keyof SurveyData];
    return typeof val === 'string' && val.trim() !== '';
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (isLast) { handleSubmit(); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await supabase.from('student_profiles').insert({ id: user.id, ...survey });
    setSubmitting(false);
    setDone(true);
  };

  const toggleLearningType = (type: string) => {
    setSurvey(s => ({
      ...s,
      learning_type: s.learning_type.includes(type)
        ? s.learning_type.filter(t => t !== type)
        : [...s.learning_type, type],
    }));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  // 完了画面
  if (done) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="text-green-500" size={40} />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">回答ありがとうございます！</h1>
      <p className="text-gray-400 font-medium mb-8">アンケートが完了しました。ダッシュボードに戻りましょう。</p>
      <button
        onClick={() => router.push('/dashboard')}
        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
      >
        ダッシュボードへ
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* ヘッダー */}
      <div className="px-6 pt-8 pb-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {step + 1} / {STEPS.length}
          </p>
          <p className="text-xs font-bold text-indigo-600">{progress}%</p>
        </div>
        {/* プログレスバー */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round(((step + 1) / STEPS.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        <h2 className="text-2xl font-black text-gray-900 mb-2">{currentStep.title}</h2>
        {currentStep.hint && (
          <p className="text-sm text-gray-400 font-medium mb-8 whitespace-pre-line">{currentStep.hint}</p>
        )}

        {/* テキストエリア */}
        {currentStep.type === 'textarea' && (
          <textarea
            value={survey[currentStep.id as keyof SurveyData] as string}
            onChange={e => setSurvey(s => ({ ...s, [currentStep.id]: e.target.value }))}
            rows={5}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all resize-none bg-white"
            placeholder="入力してください"
          />
        )}

        {/* テキスト入力 */}
        {currentStep.type === 'input' && (
          <input
            type="text"
            value={survey[currentStep.id as keyof SurveyData] as string}
            onChange={e => setSurvey(s => ({ ...s, [currentStep.id]: e.target.value }))}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 transition-all bg-white"
            placeholder="入力してください"
          />
        )}

        {/* 複数選択（学習タイプ） */}
        {currentStep.type === 'multiselect' && (
          <div className="flex flex-col gap-3">
            {LEARNING_TYPES.map(type => (
              <button
                key={type}
                onClick={() => toggleLearningType(type)}
                className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-bold transition-all ${
                  survey.learning_type.includes(type)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* 選択式（学習時間） */}
        {currentStep.type === 'select' && (
          <div className="flex flex-col gap-3">
            {STUDY_TIME_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setSurvey(s => ({ ...s, daily_study_time: opt }))}
                className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-bold transition-all ${
                  survey.daily_study_time === opt
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {opt}
              </button>
            ))}
            {/* その他の場合はテキスト入力 */}
            {survey.daily_study_time === 'その他' && (
              <input
                type="text"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 bg-white mt-1"
                placeholder="具体的に入力してください"
                onChange={e => setSurvey(s => ({ ...s, daily_study_time: e.target.value }))}
              />
            )}
          </div>
        )}

        {/* 選択式（学習歴） */}
        {currentStep.type === 'selecthistory' && (
          <div className="flex flex-col gap-3">
            {LEARNING_HISTORY_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setSurvey(s => ({ ...s, learning_history: opt }))}
                className={`w-full text-left px-5 py-4 rounded-2xl border text-sm font-bold transition-all ${
                  survey.learning_history === opt
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* 自己分析（1〜5スコア） */}
        {currentStep.type === 'selfanalysis' && (
          <div className="space-y-8">
            {[
              { key: 'self_analysis_pronunciation', label: '① 発音技能', low: '全く分からない', high: '完璧に理解・発音できる' },
              { key: 'self_analysis_grammar',       label: '② 文法知識', low: '全く分からない', high: '完璧に理解・活用できる' },
              { key: 'self_analysis_vocabulary',    label: '③ 単語知識', low: '全く覚えていない', high: 'ほぼ知っている・文脈から意味を推察できる' },
            ].map(({ key, label, low, high }) => (
              <div key={key}>
                <p className="text-sm font-black text-gray-700 mb-3">{label}</p>
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-2">
                  <span>{low}</span>
                  <span>{high}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setSurvey(s => ({ ...s, [key]: n }))}
                      className={`flex-1 py-3 rounded-xl border text-sm font-black transition-all ${
                        survey[key as keyof SurveyData] === n
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フッターボタン */}
      <div className="px-6 pb-10 max-w-lg mx-auto w-full flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={18} />
            戻る
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canNext() || submitting}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" />
            : isLast ? '回答を送信する'
            : <>次へ <ChevronRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
