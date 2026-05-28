'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Map, UserCircle } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'ホーム', href: '/dashboard', icon: LayoutDashboard },
  { label: 'テスト', href: '/test', icon: ClipboardList },
  { label: 'ロードマップ', href: '/roadmap', icon: Map },
  { label: 'マイページ', href: '/mypage', icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
