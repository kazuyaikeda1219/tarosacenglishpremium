'use client';

import Navbar from '@/components/Navbar';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Users, Clock, ChevronRight, Lock, Upload, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // CSV登録用のステート
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{message: string, type: 'success' | 'error' | null}>({message: '', type: null});

  const supabase = createClient();
  const ADMIN_PASSCODE = 'tep2026'; 
  const TOTAL_ROADMAP_ITEMS = 145;

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudentData();
    }
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

  const fetchStudentData = async () => {
    setLoading(true);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError || !profiles) {
      setLoading(false);
      return;
    }

    const studentData = await Promise.all(profiles.map(async (profile) => {
      try {
        const { data: logs } = await supabase.from('study_logs').select('study_time_minutes, study_date').eq('user_id', profile.id);
        const { count } = await supabase.from('roadmap_progress').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_completed', true);
        
        const totalMinutes = logs?.reduce((acc, log) => acc + (log.study_time_minutes || 0), 0) || 0;
        const weeklyMinutes = logs?.filter(log => log.study_date >= sevenDaysAgoStr).reduce((acc, log) => acc + (log.study_time_minutes || 0), 0) || 0;
        const lastStudyDate = logs && logs.length > 0 ? [...logs].sort((a, b) => b.study_date.localeCompare(a.study_date))[0].study_date : 'No data';
        
        return {
          id: profile.id,
          name: profile.display_name || `Student (${profile.id.slice(0, 4)})`,
          student_id: profile.student_id || '-', // 追加項目
          role: profile.role,
          progress: Math.round(((count || 0) / TOTAL_ROADMAP_ITEMS) * 100),
          totalHours: (totalMinutes / 60).toFixed(1),
          weeklyHours: (weeklyMinutes / 60).toFixed(1),
          lastActive: lastStudyDate,
        };
      } catch (err) { return null; }
    }));

    setStudents(studentData.filter(s => s !== null));
    setLoading(false);
  };

  // CSV解析ロジック (A:email, B:name, C:student_id, E:start_date)
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus({ message: '生徒名簿を解析中...', type: null });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      
      const studentsToCreate = lines.map(line => {
        const parts = line.split(',');
        return {
          email: parts[0]?.trim(),
          name: parts[1]?.trim(),
          student_id: parts[2]?.trim(),
          start_date: parts[4]?.trim() // D列(parts[3])をスキップ
        };
      }).filter(s => s.email && s.email.includes('@'));

      if (studentsToCreate.length === 0) {
        setUploadStatus({ message: '有効な生徒データが見つかりませんでした。', type: 'error' });
        setIsUploading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/bulk-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: studentsToCreate }),
        });

        if (response.ok) {
          setUploadStatus({ message: `${studentsToCreate.length}名の一括登録に成功しました！`, type: 'success' });
          fetchStudentData(); // 一覧を再取得
        } else {
          throw new Error();
        }
      } catch (err) {
        setUploadStatus({ message: '登録中にエラーが発生しました。', type: 'error' });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
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
            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all">Enter Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      <div className="p-6 text-gray-800">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex justify-between items-center mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors font-bold text-xs uppercase tracking-widest">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          
          <header className="mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Users className="text-blue-600" size={36} /> Student Management
            </h1>
            <p className="text-gray-500 font-medium mt-2">生徒の学習進捗をリアルタイムで確認・一括登録できます。</p>
          </header>

          {/* 一括招待セクション */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <Upload size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Bulk Student Invite</h3>
                <p className="text-sm text-gray-400 font-medium">CSV名簿から一括で生徒アカウントを作成します</p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[2rem] p-10 bg-gray-50/30">
              {isUploading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-indigo-600" size={40} />
                  <p className="font-bold text-gray-600">{uploadStatus.message}</p>
                </div>
              ) : uploadStatus.type === 'success' ? (
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle className="text-green-500" size={40} />
                  <p className="font-bold text-gray-600">{uploadStatus.message}</p>
                  <button onClick={() => setUploadStatus({message: '', type: null})} className="text-sm text-indigo-600 font-bold underline">続けて登録する</button>
                </div>
              ) : (
                <>
                  <input type="file" accept=".csv" id="student-csv" className="hidden" onChange={handleCsvUpload} />
                  <label htmlFor="student-csv" className="cursor-pointer bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-gray-200">
                    <Upload size={20} /> CSVファイルを選択
                  </label>
                  {uploadStatus.type === 'error' && <p className="mt-4 text-red-500 font-bold text-sm">{uploadStatus.message}</p>}
                  <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">A:Email, B:Name, C:ID, E:Start Date (Skip D)</p>
                </>
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Students</h2>
             <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold">{students.length}名</span>
          </div>

          {loading ? (
            <div className="p-10 text-center font-bold text-gray-400">Loading student data...</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {students.map((student) => (
                <div key={student.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${student.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                        <Clock size={12} /> Last Active: {student.lastActive}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                      <span className="text-sm font-black text-blue-600">{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${student.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[70px]">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                      <p className="font-black text-gray-900">{student.totalHours}h</p>
                    </div>
                    <div className="text-center min-w-[70px] px-4 border-l border-gray-100">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Weekly</p>
                      <p className="font-black text-blue-600">{student.weeklyHours}h</p>
                    </div>
                    <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}