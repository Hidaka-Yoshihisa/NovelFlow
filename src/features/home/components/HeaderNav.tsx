// src/features/home/components/HeaderNav.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  User,
  Plus,
  Flame,
  Home as HomeIcon,
  BookOpen,
  Compass,
  HelpCircle,
} from 'lucide-react';
import { AppIcon } from '@/components/AppIcon';
import type { NovelWithDetails } from '@/types/database';
import type { UserAccount } from '@/lib/authContext';

interface HeaderNavProps {
  activeTab: 'home' | 'shorts' | 'library' | 'explore';
  setActiveTab: (tab: 'home' | 'shorts' | 'library' | 'explore') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredShortNovels: NovelWithDetails[];
  filteredRegularNovels: NovelWithDetails[];
  shortNovels: NovelWithDetails[];
  currentUser: UserAccount | null;
  onOpenMyPage: () => void;
  onOpenAuth: () => void;
  onOpenPublish: () => void;
  onOpenGuide: () => void;
  onSelectShort: (index: number) => void;
  onSelectRegular: (novel: NovelWithDetails) => void;
}

export function HeaderNav({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filteredShortNovels,
  filteredRegularNovels,
  shortNovels,
  currentUser,
  onOpenMyPage,
  onOpenAuth,
  onOpenPublish,
  onOpenGuide,
  onSelectShort,
  onSelectRegular,
}: HeaderNavProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 検索バーの外側クリック検知
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 border-b border-[#142b20] bg-[#0b1611]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-30 shrink-0 relative">
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <div
          onClick={() => {
            setActiveTab('home');
            setSearchQuery('');
          }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <AppIcon
            className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform"
            roundedClassName="rounded-xl"
          />
          <div className="hidden min-[420px]:block">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif group-hover:text-emerald-300 transition-colors">
              NovelFlow
            </span>
          </div>
        </div>

        {/* メインタブ（デスクトップナビ：ホーム / ショート / 通常小説 / レコメンド探す） */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0f2119] border border-[#1b3a2c] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            <span>ホーム</span>
          </button>
          <button
            onClick={() => setActiveTab('shorts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'shorts'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>ショート</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>通常小説</span>
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'explore'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>おすすめ</span>
          </button>
        </nav>
      </div>

      {/* 検索バー（ヘッダー中央：ショート小説・通常小説・作者の全域検索） */}
      <div
        ref={searchContainerRef}
        className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2"
      >
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-emerald-500/70 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsSearchFocused(false);
              }
            }}
            placeholder="作品名・あらすじ・作者を検索..."
            className="w-full bg-[#0a1510] border border-[#1b3829] hover:border-emerald-500/50 focus:border-emerald-400 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-emerald-900/40 transition-colors"
              title="検索ワードをクリア"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 検索ドロップダウンサジェスト（フォーカス時かつクエリあり） */}
        {isSearchFocused && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#0c1812] border border-[#1b3a2a] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto backdrop-blur-xl">
            <div className="px-3.5 py-2 bg-[#08120e] border-b border-[#14291e] flex items-center justify-between text-[11px] text-neutral-400">
              <span className="font-semibold text-emerald-200">
                「{searchQuery}」の検索結果（計 {filteredShortNovels.length + filteredRegularNovels.length} 件）
              </span>
              <button
                onClick={() => setIsSearchFocused(false)}
                className="text-neutral-500 hover:text-white text-[10px]"
              >
                閉じる (Esc)
              </button>
            </div>

            {filteredShortNovels.length === 0 && filteredRegularNovels.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                「{searchQuery}」に一致する作品は見つかりませんでした
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {/* ショート小説ヒット */}
                {filteredShortNovels.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Flame className="w-3 h-3" />
                      <span>ショート小説 ({filteredShortNovels.length}件)</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {filteredShortNovels.slice(0, 4).map((novel) => {
                        const originalIdx = shortNovels.findIndex((n) => n.id === novel.id);
                        return (
                          <div
                            key={novel.id}
                            onClick={() => {
                              onSelectShort(originalIdx >= 0 ? originalIdx : 0);
                              setActiveTab('shorts');
                              setIsSearchFocused(false);
                            }}
                            className="p-2 rounded-xl hover:bg-[#12241b] cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-white group-hover:text-emerald-300 font-serif truncate">
                                {novel.title}
                              </div>
                              <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                                {novel.category} • {novel.author?.username}
                              </div>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 group-hover:bg-emerald-500 group-hover:text-[#041a12] transition-colors">
                              読む
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 通常小説ヒット */}
                {filteredRegularNovels.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-teal-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <BookOpen className="w-3 h-3" />
                      <span>通常小説・連載 ({filteredRegularNovels.length}件)</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {filteredRegularNovels.slice(0, 4).map((novel) => (
                        <div
                          key={novel.id}
                          onClick={() => {
                            onSelectRegular(novel);
                            setIsSearchFocused(false);
                          }}
                          className="p-2 rounded-xl hover:bg-[#12241b] cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-white group-hover:text-teal-200 font-serif truncate">
                              {novel.title}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                              全{novel.pages.length}話 • {novel.category} • {novel.author?.username}
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 group-hover:bg-teal-400 group-hover:text-[#041a12] transition-colors">
                            開く
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 右側アクション（マイページ・アカウント作成・投稿ボタン・モバイルショート切替） */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setActiveTab('shorts')}
          className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
        >
          <Flame className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ショート</span>
        </button>

        {/* 使い方・機能ガイドボタン */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#0b1b13] hover:bg-[#132c20] border border-[#1d4230] text-emerald-300 hover:text-emerald-200 text-xs font-semibold shadow-sm transition-all cursor-pointer group"
          title="アプリの使い方・機能ガイドを開く"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
          <span className="hidden xl:inline">使い方ガイド</span>
          <span className="xl:hidden hidden sm:inline">ガイド</span>
        </button>


        {/* マイページ遷移ボタン（スマホでは下部ナビに集約し、タブレット・PC版のみヘッダーに表示） */}
        <button
          id="header-mypage-button"
          onClick={onOpenMyPage}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-[#0b1b13] hover:bg-[#132c20] border border-[#1d4230] text-neutral-200 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer group"
          title="マイページを開く"
        >
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-5 h-5 rounded-full object-cover border border-emerald-400/40 shrink-0"
            />
          ) : (
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          )}
          <span className="max-w-[100px] truncate">
            {currentUser?.username || 'マイページ'}
          </span>
        </button>

        {/* 新規アカウント作成ボタン */}
        <button
          id="header-register-button"
          onClick={onOpenAuth}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-[#08150f] hover:bg-[#0f241a] border border-[#163826] text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
          title="新規アカウント作成"
        >
          <User className="w-3.5 h-3.5 text-emerald-400" />
          <span>アカウント作成</span>
        </button>

        {/* 作品を投稿ボタン */}
        <button
          onClick={onOpenPublish}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] text-xs font-bold shadow-lg shadow-emerald-950/60 hover:brightness-110 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">作品を投稿</span>
          <span className="sm:hidden">投稿</span>
        </button>
      </div>
    </header>
  );
}
