// src/features/home/components/BottomNav.tsx
import React from 'react';
import { Home as HomeIcon, Compass, Flame, BookOpen, User } from 'lucide-react';
import type { UserAccount } from '@/lib/authContext';

interface BottomNavProps {
  activeTab: 'home' | 'shorts' | 'library' | 'explore';
  setActiveTab: (tab: 'home' | 'shorts' | 'library' | 'explore') => void;
  hasAffinityScores: boolean;
  currentUser: UserAccount | null;
  onOpenMyPage: () => void;
  onSelectShortsTab: () => void;
  onClearSearch: () => void;
}

export function BottomNav({
  activeTab,
  setActiveTab,
  hasAffinityScores,
  currentUser,
  onOpenMyPage,
  onSelectShortsTab,
  onClearSearch,
}: BottomNavProps) {
  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08150f]/95 backdrop-blur-xl border-t border-[#163625] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
    >
      {/* ホーム */}
      <button
        id="btn-mobile-nav-home"
        onClick={() => {
          setActiveTab('home');
          onClearSearch();
        }}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'home'
            ? 'text-emerald-400 font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <HomeIcon className="w-5 h-5" />
          {activeTab === 'home' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </div>
        <span className="text-[10px] mt-1 tracking-tight">ホーム</span>
      </button>

      {/* おすすめ（探索） */}
      <button
        id="btn-mobile-nav-explore"
        onClick={() => {
          setActiveTab('explore');
          onClearSearch();
        }}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'explore'
            ? 'text-emerald-400 font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Compass className="w-5 h-5" />
          {activeTab === 'explore' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
          {hasAffinityScores && activeTab !== 'explore' && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] mt-1 tracking-tight">おすすめ</span>
      </button>

      {/* ショート */}
      <button
        id="btn-mobile-nav-shorts"
        onClick={onSelectShortsTab}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'shorts'
            ? 'text-rose-400 font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <Flame className="w-5 h-5 text-rose-500" />
          {activeTab === 'shorts' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </div>
        <span className="text-[10px] mt-1 tracking-tight">ショート</span>
      </button>

      {/* 通常小説 */}
      <button
        id="btn-mobile-nav-library"
        onClick={() => {
          setActiveTab('library');
          onClearSearch();
        }}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'library'
            ? 'text-teal-300 font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        <div className="relative">
          <BookOpen className="w-5 h-5" />
          {activeTab === 'library' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-teal-400" />
          )}
        </div>
        <span className="text-[10px] mt-1 tracking-tight">通常小説</span>
      </button>

      {/* マイページ */}
      <button
        id="btn-mobile-nav-mypage"
        onClick={onOpenMyPage}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
      >
        <div className="relative">
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-5 h-5 rounded-full object-cover border border-emerald-400/50"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <span className="text-[10px] mt-1 tracking-tight">マイページ</span>
      </button>
    </nav>
  );
}
