'use client';

import React, { useState, useEffect } from 'react';
import { PlayCircle, Search, ExternalLink, Video } from 'lucide-react';
import Navbar from '@/components/Navbar';

// 動画データの型定義
interface VideoContent {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  url: string;
  description: string;
}

const INITIAL_VIDEOS: VideoContent[] = [
  {
    id: '1',
    title: 'Sample Video 1',
    category: 'Listening',
    thumbnail: 'https://img.youtube.com/vi/cuO8uPupzR8/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=cuO8uPupzR8',
    description: 'Listening practice material.'
  },
  {
    id: '2',
    title: 'Sample Video 2',
    category: 'Speaking',
    thumbnail: 'https://img.youtube.com/vi/Uuff5_nqIKs/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=Uuff5_nqIKs',
    description: 'Speaking practice material.'
  },
  {
    id: '3',
    title: 'Sample Video 3',
    category: 'Grammar',
    thumbnail: 'https://img.youtube.com/vi/e7FowwOG51g/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=e7FowwOG51g',
    description: 'Grammar practice material.'
  },
  {
    id: '4',
    title: 'Sample Video 4',
    category: 'Pronunciation',
    thumbnail: 'https://img.youtube.com/vi/6_wfT9gXFn4/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=6_wfT9gXFn4',
    description: 'Pronunciation practice material.'
  },
  {
    id: '5',
    title: 'Sample Video 5',
    category: 'Listening',
    thumbnail: 'https://img.youtube.com/vi/dKH9VSMDoYk/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=dKH9VSMDoYk',
    description: 'Listening practice material.'
  },
  {
    id: '6',
    title: 'Sample Video 6',
    category: 'Speaking',
    thumbnail: 'https://img.youtube.com/vi/UIkShhhCBhg/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=UIkShhhCBhg',
    description: 'Speaking practice material.'
  },
];

const CATEGORIES = ['All', 'Grammar', 'Pronunciation', 'Speaking', 'Listening'];

export default function LibraryPage() {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // マウント時にローディングを解除（将来的なfetch用）
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredVideos = INITIAL_VIDEOS.filter(video => {
    const matchesFilter = filter === 'All' || video.category === filter;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />

      <div className="p-6 text-gray-800">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 text-center md:text-left mt-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Video className="text-blue-600" size={32} /> TEP Library
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">Curated materials for your English journey</p>
          </header>

          {/* 検索 & フィルター */}
          <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search materials..." 
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filter === cat 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-20 text-center font-bold text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
              Loading materials...
            </div>
          ) : (
            <>
              {/* 動画グリッド */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredVideos.map(video => (
                  <div 
                    key={video.id} 
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group"
                  >
{/* サムネイルエリア */}
<a 
  href={video.url}
  target="_blank"
  rel="noopener noreferrer"
  className="relative aspect-video overflow-hidden block"
>
  <img 
    src={video.thumbnail} 
    alt={video.title} 
    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
  />
  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors flex items-center justify-center">
    <PlayCircle className="text-white opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300" size={54} />
  </div>
  <div className="absolute top-4 left-4">
    <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
      {video.category}
    </span>
  </div>
</a>

                    {/* コンテンツエリア */}
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{video.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-5 line-clamp-2 italic">
                        {video.description}
                      </p>
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gray-50 text-gray-600 rounded-2xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all duration-300 group/link shadow-sm"
                      >
                        Watch Now <ExternalLink size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* 検索結果ゼロの場合 */}
              {filteredVideos.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">No materials found for your search.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}