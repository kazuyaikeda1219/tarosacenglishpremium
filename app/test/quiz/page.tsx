'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import { CheckCircle2, XCircle, ArrowRight, Loader2, Award, UserCircle } from 'lucide-react';

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('id');

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const supabase = createClient();

  // quizId から category / chapter を解決するヘルパー
  const resolveQuizMeta = (id: string | null) => {
    if (id === 'vocab-basic') return { category: 'LevelCheck', chapter: 'Vocab-intro' };
    if (id === 'vocab-inter') return { category: 'LevelCheck', chapter: 'Vocab-inter' };
    if (id === 'duo-s1') return { category: 'VocabCheck', chapter: 'Duo-s1' };
    if (id === 'duo-s2') return { category: 'VocabCheck', chapter: 'Duo-s2' };
    if (id === 'kiku-b1') return { category: 'VocabCheck', chapter: 'Kiku-b1' };
    if (id === 'evine-c1') return { category: 'GrammarCheck', chapter: 'Evine-c1' };
    if (id === 'evine-c2') return { category: 'GrammarCheck', chapter: 'Evine-c2' };
    if (id === 'ever-rel') return { category: 'GrammarCheck', chapter: 'Ever-rel' };
    if (id?.startsWith('progress-')) {
      return { category: 'ProgressCheck', chapter: id.charAt(0).toUpperCase() + id.slice(1) };
    }
    return { category: 'LevelCheck', chapter: 'Grammar' };
  };

  useEffect(() => {
    if (!quizId) return;

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const { category, chapter } = resolveQuizMeta(quizId);
        console.log('【Debug】リクエスト開始:', { category, chapter, quizId });

        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('category', category)
          .eq('chapter', chapter);

        if (error) {
          console.error('【Supabase Error】:', error.message, error.details, error.hint);
        } else if (data && data.length > 0) {
          console.log('【Success】データ取得成功:', data.length, '件');
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          setQuestions(shuffled);
        } else {
          console.warn('【Warning】データが0件です。条件を確認してください:', { category, chapter });
          setQuestions([]);
        }
      } catch (err) {
        console.error('【Fatal Error】通信自体に失敗しました:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [quizId]);

  // ✅ 結果をSupabaseに保存する関数
  const saveResult = async (finalScore: number, total: number) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('未ログインのため結果を保存しません');
        return;
      }

      const { category, chapter } = resolveQuizMeta(quizId);

      const { error } = await supabase.from('quiz_results').insert({
        user_id: user.id,
        category,
        chapter,
        score: finalScore,
        total,
      });

      if (error) {
        console.error('結果の保存に失敗:', error);
      } else {
        console.log('【Success】結果を保存しました:', { finalScore, total });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('【Fatal Error】保存処理に失敗:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 🔘 4択形式用の回答処理
  const handleAnswerChoice = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correct_option) {
      setScore(prev => prev + 1);
    }
  };

  // 📝 記述形式用の回答処理
  const handleAnswerText = () => {
    if (isAnswered || userInput.trim() === '') return;
    setIsAnswered(true);

    const formattedInput = userInput.trim().toLowerCase();
    const formattedCorrect = (questions[currentIndex].correct_text || '').trim().toLowerCase();

    if (formattedInput === formattedCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setUserInput('');
      setIsAnswered(false);
    } else {
      saveResult(score, questions.length);
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-500 font-medium">Loading Quiz...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="text-gray-500">問題が見つかりませんでした。Supabaseにデータが登録されているか確認してください。</p>
      </div>
    );
  }

  // ✅ 終了画面
  if (currentIndex >= questions.length) {
    const pct = Math.round((score / questions.length) * 100);
    const isPerfect = pct === 100;
    const isGood = pct >= 70;

    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border border-gray-100 text-center transition-all animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="text-yellow-600" size={40} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Test Complete!</h2>
        <p className="text-gray-500 mb-8 font-medium">お疲れ様でした！結果を確認しましょう。</p>

        <div className={`rounded-2xl p-6 mb-8 ${isPerfect ? 'bg-yellow-50' : isGood ? 'bg-indigo-50' : 'bg-red-50'}`}>
          <p className={`text-sm font-bold uppercase tracking-widest mb-1 ${isPerfect ? 'text-yellow-600' : isGood ? 'text-indigo-600' : 'text-red-500'}`}>
            Your Score
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-6xl font-black ${isPerfect ? 'text-yellow-500' : isGood ? 'text-indigo-600' : 'text-red-500'}`}>
              {score}
            </span>
            <span className={`text-2xl font-bold ${isPerfect ? 'text-yellow-300' : isGood ? 'text-indigo-300' : 'text-red-300'}`}>
              / {questions.length}
            </span>
          </div>
          <p className={`text-sm mt-1 font-bold ${isPerfect ? 'text-yellow-500' : isGood ? 'text-indigo-400' : 'text-red-400'}`}>
            {pct}%
          </p>
        </div>

        <div className="space-y-3">
          {/* マイページボタン: 保存完了後に表示 */}
          {isSaving && (
            <div className="w-full py-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center gap-2 text-gray-400 text-sm font-bold">
              <Loader2 size={16} className="animate-spin" />
              結果を保存中...
            </div>
          )}
          {isSaved && (
            <button
              onClick={() => router.push('/mypage')}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <UserCircle size={20} />
              マイページで履歴を確認
            </button>
          )}
          <button
            onClick={() => router.push('/test')}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const questionParts = q.question_text.split('\n');
  const isTextType = q.q_type === 'text';
  const optionsList = [q.option_1, q.option_2, q.option_3, q.option_4].filter(Boolean);
  const isTextCorrect = isAnswered && isTextType && userInput.trim().toLowerCase() === (q.correct_text || '').trim().toLowerCase();

  return (
    <div className="max-w-2xl mx-auto p-6 mt-4">
      {/* プログレスバー */}
      <div className="w-full bg-gray-100 h-2 rounded-full mb-8 overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="mb-10">
        <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold tracking-widest">
          QUESTION {currentIndex + 1} OF {questions.length}
        </span>
        <div className="mt-6 space-y-2">
          {questionParts.map((part: string, i: number) => (
            <p key={i} className={i === 0 ? "text-lg text-gray-500 font-medium" : "text-2xl font-bold text-gray-900"}>
              {part}
            </p>
          ))}
        </div>
      </div>

      {/* UIの分岐: 記述式(text) か 選択式(choice) か */}
      {isTextType ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="relative flex items-center">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnswerText();
              }}
              disabled={isAnswered}
              placeholder="ここに英単語を入力してください"
              className={`w-full p-5 pr-12 text-lg font-bold border-2 rounded-2xl focus:outline-none transition-all duration-300 ${
                isAnswered
                  ? isTextCorrect
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-100 bg-white focus:border-indigo-500 focus:bg-indigo-50/10 text-gray-900 shadow-sm'
              }`}
            />
            {isAnswered && (
              <div className="absolute right-4">
                {isTextCorrect ? <CheckCircle2 className="text-green-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
              </div>
            )}
          </div>

          {!isAnswered ? (
            <button
              onClick={handleAnswerText}
              disabled={userInput.trim() === ''}
              className="w-full p-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            >
              回答を確定する
            </button>
          ) : (
            <div className={`p-5 rounded-2xl border-2 animate-in slide-in-from-top-2 duration-300 ${isTextCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
              <div className="flex flex-col gap-2 font-bold text-sm">
                <p className={isTextCorrect ? "text-green-700" : "text-red-700"}>
                  あなたの回答: <span className="text-base font-black ml-1">{userInput}</span>
                </p>
                {!isTextCorrect && (
                  <p className="text-gray-600">
                    模範解答: <span className="text-base font-black text-green-600 ml-1">{q.correct_text}</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {optionsList.map((opt, i) => {
            const optIndex = i + 1;
            const isCorrect = optIndex === q.correct_option;
            const isSelected = optIndex === selectedOption;

            let cardStyle = "border-gray-100 bg-white hover:border-indigo-500 hover:bg-indigo-50/30";
            if (isAnswered) {
              if (isCorrect) cardStyle = "border-green-500 bg-green-50 text-green-700 shadow-sm shadow-green-100";
              else if (isSelected) cardStyle = "border-red-500 bg-red-50 text-red-700";
              else cardStyle = "border-gray-50 bg-white opacity-50";
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswerChoice(optIndex)}
                disabled={isAnswered}
                className={`w-full p-5 text-left rounded-2xl border-2 transition-all font-bold flex justify-between items-center group ${cardStyle}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border-2 ${isAnswered && isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-gray-100 bg-gray-50 text-gray-400 group-hover:border-indigo-200'}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </div>
                {isAnswered && isCorrect && <CheckCircle2 className="text-green-500" size={24} />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-500" size={24} />}
              </button>
            );
          })}
        </div>
      )}

      {isAnswered && (
        <div className="mt-10 animate-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={nextQuestion}
            className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            {currentIndex === questions.length - 1 ? 'Show Results' : 'Next Question'}
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
        <QuizContent />
      </Suspense>
    </div>
  );
}
