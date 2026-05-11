'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import { CheckCircle2, XCircle, ArrowRight, Loader2, Award } from 'lucide-react';

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get('id');
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

useEffect(() => {
    // quizId が取得できるまで待機（念のため）
    if (!quizId) return;

    const fetchQuestions = async () => {
      setLoading(true);
      
      // 1. URLのIDに応じて、CSVのchapter名と紐付け
      let targetChapter = 'Grammar';
      if (quizId === 'vocab-basic') targetChapter = 'Vocab-intro';
      if (quizId === 'vocab-inter') targetChapter = 'Vocab-inter';

      // 2. Supabaseからデータを取得
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('category', 'LevelCheck')
        .eq('chapter', targetChapter);

      if (error) {
        console.error('Error fetching questions:', error);
      } else if (data && data.length > 0) {
        // 3. 取得した全問題をシャッフル
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      } else {
        // データが0件だった場合の処理
        setQuestions([]);
      }
      setLoading(false);
    };

    fetchQuestions();
  }, [quizId, supabase]); // supabase も依存配列に入れておくと警告が出なくなります

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correct_option) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setCurrentIndex(prev => prev + 1); // 終了画面へ
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

  // 終了画面
  if (currentIndex >= questions.length) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-3xl shadow-xl border border-gray-100 text-center transition-all animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="text-yellow-600" size={40} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Test Complete!</h2>
        <p className="text-gray-500 mb-8 font-medium">お疲れ様でした！結果を確認しましょう。</p>
        
        <div className="bg-indigo-50 rounded-2xl p-6 mb-8">
          <p className="text-sm text-indigo-600 font-bold uppercase tracking-widest mb-1">Your Score</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl font-black text-indigo-600">{score}</span>
            <span className="text-2xl font-bold text-indigo-300">/ {questions.length}</span>
          </div>
        </div>

        <button 
          onClick={() => router.push('/test')}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
        >
          Back to Portal
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  // CSVの改行(\n)を処理して、日本語と英文を分離
  const questionParts = q.question_text.split('\n');

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

      <div className="grid grid-cols-1 gap-4">
        {[q.option_1, q.option_2, q.option_3, q.option_4].map((opt, i) => {
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
              onClick={() => handleAnswer(optIndex)}
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