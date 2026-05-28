'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { Book, GraduationCap, ArrowRight, Zap, BarChart3, ClipboardCheck } from 'lucide-react';

const TEST_CATEGORIES = [
  {
    id: 'level-check',
    title: 'レベルチェック',
    icon: <BarChart3 className="text-green-500" />,
    description: '現在の実力を測定し、最適な学習プランを確認します。',
    items: [
      { name: '総合テスト（文法）', id: 'grammar-placement' },
      { name: '総合テスト（単語・初級）', id: 'vocab-basic' },
      { name: '総合テスト（単語・中級）', id: 'vocab-inter' },
    ]
  },
  {
    id: 'vocab',
    title: '単語チェック',
    icon: <Zap className="text-orange-500" />,
    description: '単語の定着度を4択テストで確認します。',
    items: [
      { name: 'Duo 3.0 - Sec.1', id: 'duo-s1' },
      { name: 'Duo 3.0 - Sec.2', id: 'duo-s2' },
      { name: 'キクタン Basic - Ch.1', id: 'kiku-b1' },
    ]
  },
  {
    id: 'grammar',
    title: '文法チェック',
    icon: <GraduationCap className="text-blue-500" />,
    description: '英文法の理解度をチャプター別に測定します。',
    items: [
      { name: 'Mr.Evine - Ch.1', id: 'evine-c1' },
      { name: 'Mr.Evine - Ch.2', id: 'evine-c2' },
      { name: 'Evergreen - 関係代名詞', id: 'ever-rel' },
    ]
  },
  {
    id: 'progress-check',
    title: 'プログレスチェック',
    icon: <ClipboardCheck className="text-purple-500" />,
    description: '定期的な進捗確認テストで、日々の成長を測定します。',
    items: [
      { name: 'プログレスチェックテスト 1', id: 'progress-1' },
      { name: 'プログレスチェックテスト 2', id: 'progress-2' },
      { name: 'プログレスチェックテスト 3', id: 'progress-3' },
      { name: 'プログレスチェックテスト 4', id: 'progress-4' },
      { name: 'プログレスチェックテスト 5', id: 'progress-5' },
      { name: 'プログレスチェックテスト 6', id: 'progress-6' },
    ]
  }
];

export default function TestPortal() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="p-6 text-gray-800">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 mt-4">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Book className="text-indigo-600" size={36} /> テスト一覧
            </h1>
            <p className="text-gray-500 font-medium mt-2">参考書の進捗に合わせて、知識のアウトプットを行いましょう。</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TEST_CATEGORIES.map((cat) => (
              <div key={cat.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{cat.title}</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{cat.description}</p>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  {cat.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/test/quiz?id=${item.id}`}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all group"
                    >
                      <span className="font-bold">{item.name}</span>
                      <ArrowRight size={18} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-center">
            <p className="text-indigo-600 font-bold text-sm">
              💡 Google フォームで作成した問題は、スプレッドシート経由で一括追加が可能です。
            </p>
          </div>

          <div className="h-20 md:hidden" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
