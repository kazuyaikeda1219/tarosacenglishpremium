'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Map, BookOpen, Mic, Languages } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

const ROADMAP_DATA = {
  pronunciation: {
    title: "発音",
    icon: <Mic className="text-pink-500" />,
    color: "pink",
    items: [
      { id: "p1", detail: "[æ]", category: "短母音" }, { id: "p2", detail: "[ʌ]", category: "短母音" },
      { id: "p3", detail: "[ɑ]", category: "短母音" }, { id: "p4", detail: "[ə]", category: "短母音" },
      { id: "p5", detail: "[i]", category: "短母音" }, { id: "p6", detail: "[u]", category: "短母音" },
      { id: "p7", detail: "[e]", category: "短母音" }, { id: "p8", detail: "[ɑː]", category: "長母音" },
      { id: "p9", detail: "[ɑːr]", category: "長母音" }, { id: "p10", detail: "[ə:r]", category: "長母音" },
      { id: "p11", detail: "[i:]", category: "長母音" }, { id: "p12", detail: "[uː]", category: "長母音" },
      { id: "p13", detail: "[ɔː]", category: "長母音" }, { id: "p14", detail: "[ɔːr]", category: "長母音" },
      { id: "p15", detail: "[ai]", category: "複合母音" }, { id: "p16", detail: "[au]", category: "複合母音" },
      { id: "p17", detail: "[ei]", category: "複合母音" }, { id: "p18", detail: "[ɔi]", category: "複合母音" },
      { id: "p19", detail: "[ou]", category: "複合母音" }, { id: "p20", detail: "[p]", category: "子音" },
      { id: "p21", detail: "[b]", category: "子音" }, { id: "p22", detail: "[t]", category: "子音" },
      { id: "p23", detail: "[d]", category: "子音" }, { id: "p24", detail: "[k]", category: "子音" },
      { id: "p25", detail: "[g]", category: "子音" }, { id: "p26", detail: "[f]", category: "子音" },
      { id: "p27", detail: "[v]", category: "子音" }, { id: "p28", detail: "[s]", category: "子音" },
      { id: "p29", detail: "[z]", category: "子音" }, { id: "p30", detail: "[ʃ]", category: "子音" },
      { id: "p31", detail: "[ʒ]", category: "子音" }, { id: "p32", detail: "[tʃ]", category: "子音" },
      { id: "p33", detail: "[dʒ]", category: "子音" }, { id: "p34", detail: "[θ]", category: "子音" },
      { id: "p35", detail: "[ð]", category: "子音" }, { id: "p36", detail: "[l]", category: "子音" },
      { id: "p37", detail: "[r]", category: "子音" }, { id: "p38", detail: "[m]", category: "子音" },
      { id: "p39", detail: "[n]", category: "子音" }, { id: "p40", detail: "[ŋ]", category: "子音" },
      { id: "p41", detail: "[h]", category: "子音" }, { id: "p42", detail: "[j]", category: "子音" },
      { id: "p43", detail: "[w]", category: "子音" }, { id: "p44", detail: "アルファベットの音", category: "フォニックス" },
      { id: "p45", detail: "音のつながり", category: "リエゾン" }, { id: "p46", detail: "文章内の強勢", category: "機能語と内容語" },
      { id: "p47", detail: "ストレスの付け方", category: "単語内強勢" },
    ]
  },
  grammar_evine: {
    title: "英文法 — Mr.Evine",
    icon: <BookOpen className="text-blue-400" />,
    color: "blue",
    items: [
      { id: "g1", detail: "SV", category: "文型" }, { id: "g2", detail: "SVC", category: "文型" },
      { id: "g3", detail: "SVO", category: "文型" }, { id: "g4", detail: "SVOO", category: "文型" },
      { id: "g5", detail: "SVOC", category: "文型" }, { id: "g6", detail: "主語・動詞", category: "基礎" },
      { id: "g7", detail: "名詞・代名詞", category: "基礎" }, { id: "g8", detail: "否定・疑問", category: "基礎" },
      { id: "g9", detail: "過去形", category: "時制" }, { id: "g10", detail: "冠詞", category: "基礎" },
      { id: "g11", detail: "進行形", category: "時制" }, { id: "g12", detail: "未来形", category: "時制" },
      { id: "g13", detail: "助動詞", category: "基礎" }, { id: "g14", detail: "疑問文(疑問詞)", category: "基礎" },
      { id: "g15", detail: "前置詞と名詞", category: "基礎" }, { id: "g16", detail: "不定詞", category: "準動詞" },
      { id: "g17", detail: "動名詞と不定詞", category: "準動詞" }, { id: "g18", detail: "接続詞", category: "基礎" },
      { id: "g19", detail: "比較(比較級)", category: "比較" }, { id: "g20", detail: "比較(最上級)", category: "比較" },
      { id: "g21", detail: "比較(as-as)", category: "比較" }, { id: "g22", detail: "受け身", category: "態" },
      { id: "g23", detail: "完了形", category: "時制" }, { id: "g24", detail: "現在分詞", category: "準動詞" },
      { id: "g25", detail: "過去分詞", category: "準動詞" }, { id: "g26", detail: "関係代名詞(主格)", category: "関係詞" },
      { id: "g27", detail: "関係代名詞(目的格)", category: "関係詞" }, { id: "g28", detail: "現在分詞と過去分詞", category: "準動詞" },
      { id: "g29", detail: "関係代名詞(主格と所有格)", category: "関係詞" },
    ]
  },
  grammar_evergreen: {
    title: "英文法 — Evergreen",
    icon: <BookOpen className="text-indigo-500" />,
    color: "indigo",
    items: [
      { id: "g30", detail: "文の種類", category: "基礎" }, { id: "g31", detail: "動詞と文型", category: "基礎" },
      { id: "g32", detail: "動詞と時制", category: "時制" }, { id: "g33", detail: "完了形", category: "時制" },
      { id: "g34", detail: "助動詞", category: "基礎" }, { id: "g35", detail: "態", category: "態" },
      { id: "g36", detail: "不定詞", category: "準動詞" }, { id: "g37", detail: "動名詞", category: "準動詞" },
      { id: "g38", detail: "分詞", category: "準動詞" }, { id: "g39", detail: "比較", category: "比較" },
      { id: "g40", detail: "関係詞", category: "関係詞" }, { id: "g41", detail: "仮定法", category: "発展" },
      { id: "g42", detail: "疑問詞と疑問文", category: "基礎" }, { id: "g43", detail: "否定", category: "基礎" },
      { id: "g44", detail: "話法", category: "発展" }, { id: "g45", detail: "名詞構文・無生物主語", category: "発展" },
      { id: "g46", detail: "強調・倒置・挿入・省略・同格", category: "発展" }, { id: "g47", detail: "名詞", category: "品詞" },
      { id: "g48", detail: "冠詞", category: "品詞" }, { id: "g49", detail: "代名詞", category: "品詞" },
      { id: "g50", detail: "形容詞", category: "品詞" }, { id: "g51", detail: "副詞", category: "品詞" },
      { id: "g52", detail: "前置詞", category: "品詞" }, { id: "g53", detail: "接続詞", category: "品詞" },
    ]
  },
  vocab_kikutan_entry: {
    title: "英単語 — キクタン Entry",
    icon: <Languages className="text-green-400" />,
    color: "green",
    items: Array.from({ length: 15 }, (_, i) => ({ id: `v-e${i+1}`, detail: `WEEK${i+1}`, category: "キクタンEntry" })),
  },
  vocab_kikutan_basic: {
    title: "英単語 — キクタン Basic",
    icon: <Languages className="text-emerald-500" />,
    color: "emerald",
    items: Array.from({ length: 10 }, (_, i) => ({ id: `v-b${i+1}`, detail: `WEEK${i+1}`, category: "キクタンBasic" })),
  },
  vocab_kikutan_advanced: {
    title: "英単語 — キクタン Advanced",
    icon: <Languages className="text-teal-500" />,
    color: "teal",
    items: Array.from({ length: 10 }, (_, i) => ({ id: `v-a${i+1}`, detail: `WEEK${i+1}`, category: "キクタンAdvanced" })),
  },
  vocab_database: {
    title: "英単語 — Database 3300",
    icon: <Languages className="text-cyan-500" />,
    color: "cyan",
    items: Array.from({ length: 6 }, (_, i) => ({ id: `v-d${i+1}`, detail: `Level ${i+1}`, category: "Database3300" })),
  },
  vocab_duo: {
    title: "英単語 — DUO 3.0",
    icon: <Languages className="text-violet-500" />,
    color: "violet",
    items: Array.from({ length: 45 }, (_, i) => ({ id: `v-duo${i+1}`, detail: `SECTION${i+1}`, category: "DUO3.0" })),
  },
};

// color → Tailwind クラスのマッピング（動的クラスは文字列として完全指定が必要）
const COLOR_MAP: Record<string, { bar: string; itemDone: string; itemDoneBorder: string; itemDoneText: string; check: string; count: string }> = {
  pink:    { bar: "bg-pink-500",    itemDone: "bg-pink-50",    itemDoneBorder: "border-pink-100",    itemDoneText: "text-pink-700",    check: "text-pink-500",    count: "text-pink-600"    },
  blue:    { bar: "bg-blue-500",    itemDone: "bg-blue-50",    itemDoneBorder: "border-blue-100",    itemDoneText: "text-blue-700",    check: "text-blue-500",    count: "text-blue-600"    },
  indigo:  { bar: "bg-indigo-500",  itemDone: "bg-indigo-50",  itemDoneBorder: "border-indigo-100",  itemDoneText: "text-indigo-700",  check: "text-indigo-500",  count: "text-indigo-600"  },
  green:   { bar: "bg-green-500",   itemDone: "bg-green-50",   itemDoneBorder: "border-green-100",   itemDoneText: "text-green-700",   check: "text-green-500",   count: "text-green-600"   },
  emerald: { bar: "bg-emerald-500", itemDone: "bg-emerald-50", itemDoneBorder: "border-emerald-100", itemDoneText: "text-emerald-700", check: "text-emerald-500", count: "text-emerald-600" },
  teal:    { bar: "bg-teal-500",    itemDone: "bg-teal-50",    itemDoneBorder: "border-teal-100",    itemDoneText: "text-teal-700",    check: "text-teal-500",    count: "text-teal-600"    },
  cyan:    { bar: "bg-cyan-500",    itemDone: "bg-cyan-50",    itemDoneBorder: "border-cyan-100",    itemDoneText: "text-cyan-700",    check: "text-cyan-500",    count: "text-cyan-600"    },
  violet:  { bar: "bg-violet-500",  itemDone: "bg-violet-50",  itemDoneBorder: "border-violet-100",  itemDoneText: "text-violet-700",  check: "text-violet-500",  count: "text-violet-600"  },
};

export default function Roadmap() {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      const { data } = await supabase.from('roadmap_progress').select('item_key').eq('is_completed', true);
      if (data) setCompletedIds(new Set(data.map(d => d.item_key)));
    }
    loadProgress();
  }, []);

  const toggleItem = async (id: string) => {
    if (!userId) return;
    const isNowCompleted = !completedIds.has(id);
    const newSet = new Set(completedIds);
    if (isNowCompleted) newSet.add(id); else newSet.delete(id);
    setCompletedIds(newSet);
    await supabase.from('roadmap_progress').upsert(
      { item_key: id, is_completed: isNowCompleted, user_id: userId },
      { onConflict: 'user_id,item_key' }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6 text-gray-800">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <Map className="text-blue-600" /> Learning Roadmap
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Track your mastery, Tarosac.</p>
          </header>

          <div className="grid grid-cols-1 gap-12">
            {Object.entries(ROADMAP_DATA).map(([key, section]) => {
              const doneCount = section.items.filter(item => completedIds.has(item.id)).length;
              const progress = Math.round((doneCount / section.items.length) * 100);
              const c = COLOR_MAP[section.color];

              return (
                <section key={key} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-50 rounded-2xl">{section.icon}</div>
                      <div>
                        <h2 className="text-xl font-black text-gray-900">{section.title}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{section.items.length} Items Total</p>
                      </div>
                    </div>
                    <div className="flex-1 max-w-md">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-bold text-gray-600">{progress}% Mastered</span>
                        <span className={`text-sm font-bold ${c.count}`}>{doneCount} / {section.items.length}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div className={`${c.bar} h-full transition-all duration-500 ease-out`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {section.items.map((item) => {
                      const isDone = completedIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                            isDone
                              ? `${c.itemDone} ${c.itemDoneBorder} scale-[0.98]`
                              : 'bg-white border-gray-100 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">{item.category}</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-bold ${isDone ? c.itemDoneText : 'text-gray-700'}`}>{item.detail}</span>
                            {isDone
                              ? <CheckCircle2 size={18} className={`${c.check} shrink-0`} />
                              : <Circle size={18} className="text-gray-200 shrink-0" />
                            }
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* スマホ用ボトムナビ余白 */}
          <div className="h-20 md:hidden" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
