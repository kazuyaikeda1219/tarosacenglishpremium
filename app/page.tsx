'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowRight, CheckCircle, Star } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const supabase = createClient();

  // ✅ ログイン済みならmypageへ自動リダイレクト
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.push('/mypage');
    };
    check();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="lg:flex items-center gap-16">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-6">
                <Star size={16} className="fill-indigo-600" />
                <span>Tarosac English Premium</span>
              </div>
              <h1 className="text-6xl lg:text-7xl font-black text-gray-900 tracking-tighter mb-6 leading-[1.1]">
                Master English <br />
                <span className="text-indigo-600">with TEP.</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium mb-10 leading-relaxed max-w-lg">
                あなたの英語学習を次のレベルへ。
                TEPは効率的なアウトプットと確実なステップアップを支援する専用ポータルです。
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                >
                  学習を開始する <ArrowRight size={20} />
                </Link>
                <div className="flex items-center gap-4 px-6 py-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="student" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 font-bold">Many students joined.</p>
                </div>
              </div>
            </div>

            {/* 写真エリア */}
            <div className="lg:w-1/2 mt-16 lg:mt-0">
              <div className="relative">
                <div className="absolute -inset-4 bg-indigo-100 rounded-[3rem] rotate-3 opacity-50"></div>
                <div className="relative bg-white rounded-[3rem] overflow-hidden shadow-2xl aspect-[4/5] border-8 border-white">
                  <img
                    src="/tarosac-hero.jpg"
                    alt="Tarosac"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Level Checks', desc: '文法・単語の定着度を測定し、現在地から学習をスタート' },
              { title: 'Premium Support', desc: 'TAROSACメソッドであなたの学習を完全バックアップ' },
              { title: 'Smart Learning', desc: 'あなたに最適な学習体験をカスタマイズ' }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-gray-100 text-center text-gray-400 font-medium">
        © 2026 Tarosac English Premium (TEP). All rights reserved.
      </footer>
    </div>
  );
}
