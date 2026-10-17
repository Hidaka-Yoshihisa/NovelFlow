// app/page.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Compass,
  Plus,
  Flame,
  Heart,
  Eye,
  Clock,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Home as HomeIcon,
  Play,
  TrendingUp,
  Zap,
  X,
  User,
  ArrowUpDown,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import NovelViewer from '@/components/NovelViewer';
import RegularNovelViewer from '@/components/RegularNovelViewer';
import PublishModal from '@/components/PublishModal';
import MyPageModal from '@/components/MyPageModal';
import AuthModal from '@/components/AuthModal';
import { AppIcon } from '@/components/AppIcon';
import {
  fetchAllNovels,
  toggleNovelLike,
  getLocalUserLikedIds,
  saveLocalUserLikedIds,
  getLocalUserBookmarkedIds,
  saveLocalUserBookmarkedIds,
  getEffectiveUserId,
  getLocalUserPhraseLikes,
  fetchUserPhraseLikes,
  createPhraseLike,
  deletePhraseLike,
} from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import type { NovelWithDetails, PhraseLike } from '@/types/database';

export default function Home() {
  const { currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'library' | 'explore'>('home');
  const [shortNovels, setShortNovels] = useState<NovelWithDetails[]>([]);
  const [regularNovels, setRegularNovels] = useState<NovelWithDetails[]>([]);
  const [userLikedIds, setUserLikedIds] = useState<Set<string>>(() =>
    getLocalUserLikedIds(getEffectiveUserId(currentUser))
  );
  const [userBookmarkedIds, setUserBookmarkedIds] = useState<Set<string>>(() =>
    getLocalUserBookmarkedIds(getEffectiveUserId(currentUser))
  );
  const [userPhraseLikes, setUserPhraseLikes] = useState<PhraseLike[]>(() =>
    getLocalUserPhraseLikes(getEffectiveUserId(currentUser))
  );
  const [loading, setLoading] = useState(true);

  // 閲覧中の通常小説・初期章番号
  const [selectedRegularNovel, setSelectedRegularNovel] = useState<NovelWithDetails | null>(null);
  const [selectedRegularChapterIndex, setSelectedRegularChapterIndex] = useState<number>(0);
  // 選択中のショート小説インデックス・初期ページ番号
  const [selectedShortIndex, setSelectedShortIndex] = useState<number>(0);
  const [selectedShortPageIndex, setSelectedShortPageIndex] = useState<number>(0);
  // 新規投稿モーダル
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  // マイページモーダル
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  // 認証・アカウント登録モーダル
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('register');

  // 検索・フィルタ
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Exploreタブ用ソート
  const [exploreSort, setExploreSort] = useState<'recommended' | 'likes' | 'newest'>('recommended');

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

  // 小説データの読み込み（サーバーから全ユーザーのいいね数と自分自身のいいね状態を完全復元）
  const loadNovels = async () => {
    try {
      setLoading(true);
      const effectiveUserId = getEffectiveUserId(currentUser);
      const data = await fetchAllNovels(effectiveUserId);
      setShortNovels(data.shortNovels);
      setRegularNovels(data.regularNovels);
      if (data.userLikedIds && Array.isArray(data.userLikedIds)) {
        const nextLikes = new Set(data.userLikedIds);
        setUserLikedIds(nextLikes);
        saveLocalUserLikedIds(nextLikes, effectiveUserId);
      }
    } catch (err) {
      console.error('Failed to load novels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    setUserLikedIds(getLocalUserLikedIds(effectiveUserId));
    setUserBookmarkedIds(getLocalUserBookmarkedIds(effectiveUserId));
    setUserPhraseLikes(getLocalUserPhraseLikes(effectiveUserId));
    loadNovels();

    // サーバーから最新のフレーズいいね一覧を取得同期
    fetchUserPhraseLikes(effectiveUserId).then((likes) => {
      if (Array.isArray(likes)) {
        setUserPhraseLikes(likes);
      }
    });
  }, [currentUser?.id]);

  // フレーズいいねの追加
  const handleAddPhraseLike = async (params: Omit<PhraseLike, 'id' | 'createdAt'>) => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    const result = await createPhraseLike({ ...params, userId: effectiveUserId });
    setUserPhraseLikes((prev) => {
      const exists = prev.some(
        (p) =>
          p.id === result.id ||
          (p.novelId === result.novelId &&
            p.pageNumber === result.pageNumber &&
            p.phrase.trim() === result.phrase.trim())
      );
      if (exists) return prev;
      return [result, ...prev];
    });
  };

  // フレーズいいねの解除
  const handleRemovePhraseLike = async (id: string) => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    await deletePhraseLike(id, effectiveUserId);
    setUserPhraseLikes((prev) => prev.filter((p) => p.id !== id));
  };

  const handleNovelPublished = (newNovel: NovelWithDetails) => {
    if (newNovel.type === 'short') {
      setShortNovels((prev) => [newNovel, ...prev.filter((n) => n.id !== newNovel.id)]);
      setSelectedShortIndex(0);
      setSelectedShortPageIndex(0);
      setActiveTab('shorts');
    } else {
      setRegularNovels((prev) => [newNovel, ...prev.filter((n) => n.id !== newNovel.id)]);
      setSelectedRegularNovel(newNovel);
      setSelectedRegularChapterIndex(0);
    }
    // サーバーの最新データとも再同期
    loadNovels();
  };

  // いいね切り替え処理（UI即時更新 ＋ サーバー永続化 ＋ 全端末同期）
  const handleToggleLike = async (novelId: string) => {
    const isCurrentlyLiked = userLikedIds.has(novelId);
    const nextUserLikedIds = new Set(userLikedIds);
    if (isCurrentlyLiked) {
      nextUserLikedIds.delete(novelId);
    } else {
      nextUserLikedIds.add(novelId);
    }
    const effectiveUserId = getEffectiveUserId(currentUser);
    setUserLikedIds(nextUserLikedIds);
    saveLocalUserLikedIds(nextUserLikedIds, effectiveUserId);

    const delta = isCurrentlyLiked ? -1 : 1;
    setShortNovels((prev) =>
      prev.map((n) =>
        n.id === novelId ? { ...n, likesCount: Math.max(0, (n.likesCount || 0) + delta) } : n
      )
    );
    setRegularNovels((prev) =>
      prev.map((n) =>
        n.id === novelId ? { ...n, likesCount: Math.max(0, (n.likesCount || 0) + delta) } : n
      )
    );
    if (selectedRegularNovel && selectedRegularNovel.id === novelId) {
      setSelectedRegularNovel((prev) =>
        prev ? { ...prev, likesCount: Math.max(0, (prev.likesCount || 0) + delta) } : null
      );
    }

    try {
      const res = await toggleNovelLike(
        novelId,
        effectiveUserId,
        isCurrentlyLiked ? 'unlike' : 'like'
      );
      setShortNovels((prev) =>
        prev.map((n) => (n.id === novelId ? { ...n, likesCount: res.likesCount } : n))
      );
      setRegularNovels((prev) =>
        prev.map((n) => (n.id === novelId ? { ...n, likesCount: res.likesCount } : n))
      );
      if (selectedRegularNovel && selectedRegularNovel.id === novelId) {
        setSelectedRegularNovel((prev) =>
          prev ? { ...prev, likesCount: res.likesCount } : null
        );
      }
      setUserLikedIds((prev) => {
        const next = new Set(prev);
        if (res.isLiked) next.add(novelId);
        else next.delete(novelId);
        saveLocalUserLikedIds(next, effectiveUserId);
        return next;
      });
    } catch (err) {
      console.error('Failed to sync like:', err);
    }
  };

  // しおり切り替え処理（アカウント固有の同期・永続化）
  const handleToggleBookmark = (novelId: string) => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    const nextBookmarked = !userBookmarkedIds.has(novelId);
    const nextSet = new Set(userBookmarkedIds);
    if (nextBookmarked) nextSet.add(novelId);
    else nextSet.delete(novelId);
    setUserBookmarkedIds(nextSet);
    saveLocalUserBookmarkedIds(nextSet, effectiveUserId);
  };

  // ショート小説のフィルタリング
  const filteredShortNovels = shortNovels.filter((novel) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = novel.title.toLowerCase().includes(q);
    const matchesSynopsis = novel.synopsis ? novel.synopsis.toLowerCase().includes(q) : false;
    const matchesAuthor = novel.author?.username ? novel.author.username.toLowerCase().includes(q) : false;
    const matchesCategory = novel.category ? novel.category.toLowerCase().includes(q) : false;
    const matchesContent = novel.pages.some((p) => p.content.toLowerCase().includes(q));
    return matchesTitle || matchesSynopsis || matchesAuthor || matchesCategory || matchesContent;
  });

  // 通常小説のフィルタリング
  const filteredRegularNovels = regularNovels.filter((novel) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      novel.title.toLowerCase().includes(q) ||
      (novel.synopsis && novel.synopsis.toLowerCase().includes(q)) ||
      (novel.author?.username && novel.author.username.toLowerCase().includes(q)) ||
      (novel.category && novel.category.toLowerCase().includes(q)) ||
      novel.pages.some((p) => p.content.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'all' || novel.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // ユーザーのいいね傾向分析（作品いいね＋フレーズいいねに基づくカテゴリ好感度スコア）
  const userCategoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const allNovels = [...shortNovels, ...regularNovels];

    // 1. 作品いいねからカテゴリ集計（1いいね＝3pt）
    userLikedIds.forEach((id) => {
      const novel = allNovels.find((n) => n.id === id);
      if (novel?.category) {
        counts[novel.category] = (counts[novel.category] || 0) + 3;
      }
    });

    // 2. フレーズいいねからカテゴリ集計（1フレーズいいね＝1pt）
    userPhraseLikes.forEach((item) => {
      if (item.novelCategory) {
        counts[item.novelCategory] = (counts[item.novelCategory] || 0) + 1;
      }
    });

    // スコア降順のカテゴリ配列
    const sortedCategories = Object.entries(counts)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, score]) => ({ category: cat, score }));

    return {
      scores: counts,
      sortedCategories,
      topCategories: sortedCategories.map((c) => c.category),
      totalScore: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  }, [shortNovels, regularNovels, userLikedIds, userPhraseLikes]);

  // Exploreタブ用の動的推薦作品リスト（ユーザーのいいねカテゴリ傾向に基づくリアルタイム推薦順序決定）
  const recommendedNovels = useMemo(() => {
    const allNovels = [...shortNovels, ...regularNovels];
    const { scores, topCategories, totalScore } = userCategoryStats;

    return allNovels
      .map((novel) => {
        const cat = novel.category || '';
        const catScore = scores[cat] || 0;
        const isLiked = userLikedIds.has(novel.id);
        const baseLikes = novel.likesCount || 0;
        const commentsCount = novel.commentsCount || 0;

        let recommendationScore = 0;
        let recommendationTag = '';
        let isTopMatch = false;

        if (totalScore > 0 && catScore > 0) {
          // ユーザー好みのカテゴリに一致：カテゴリ得点に応じた強力な重み付け
          const rank = topCategories.indexOf(cat);
          recommendationScore += (catScore * 40) + (rank === 0 ? 80 : rank === 1 ? 40 : 20);
          recommendationScore += baseLikes * 2 + commentsCount;

          if (rank === 0) {
            recommendationTag = `🎯 「${cat}」好きのあなたへ`;
            isTopMatch = true;
          } else {
            recommendationTag = `✨ 好みに近い「${cat}」`;
          }
        } else if (totalScore === 0) {
          // コールドスタート（まだいいねが無い場合）：人気度・話題性重視
          recommendationScore = baseLikes * 10 + commentsCount * 5;
          if (baseLikes >= 3) {
            recommendationTag = '🔥 読者に大人気の話題作';
          } else {
            recommendationTag = '🌟 編集部おすすめの注目作';
          }
        } else {
          // ユーザーの好みカテゴリ外：新しいジャンルの発見枠
          recommendationScore = baseLikes * 2 + commentsCount;
          recommendationTag = `🧭 未開拓ジャンル「${cat}」`;
        }

        // 未読・未いいねの作品を少しブーストして新規作品との出会いを後押し
        if (!isLiked && catScore > 0) {
          recommendationScore += 15;
        }

        return {
          novel,
          recommendationScore,
          recommendationTag,
          isTopMatch,
          categoryAffinity: catScore,
          isLiked,
        };
      })
      .sort((a, b) => {
        if (exploreSort === 'likes') {
          return (b.novel.likesCount || 0) - (a.novel.likesCount || 0);
        }
        if (exploreSort === 'newest') {
          return new Date(b.novel.created_at).getTime() - new Date(a.novel.created_at).getTime();
        }
        // デフォルト: 'recommended'（推薦スコア降順）
        return b.recommendationScore - a.recommendationScore;
      });
  }, [
    shortNovels,
    regularNovels,
    userCategoryStats,
    userLikedIds,
    exploreSort,
  ]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#070d0a] flex flex-col items-center justify-center text-emerald-300 font-sans">
        <AppIcon className="w-14 h-14 mb-4 animate-pulse" roundedClassName="rounded-2xl" />
        <p className="text-xs tracking-widest uppercase text-emerald-400 font-medium">NovelFlow を読み込み中...</p>
      </div>
    );
  }

  // 1. 通常小説の読書ビュー
  if (selectedRegularNovel) {
    return (
      <RegularNovelViewer
        novel={selectedRegularNovel}
        initialChapterIndex={selectedRegularChapterIndex}
        onBack={() => {
          setSelectedRegularNovel(null);
          setSelectedRegularChapterIndex(0);
        }}
        onToggleLike={handleToggleLike}
        userLikedIds={userLikedIds}
        userBookmarkedIds={userBookmarkedIds}
        onToggleBookmark={handleToggleBookmark}
        phraseLikes={userPhraseLikes}
        onAddPhraseLike={handleAddPhraseLike}
        onRemovePhraseLike={handleRemovePhraseLike}
      />
    );
  }

  // 2. ショート小説の全画面スワイプビュー（YouTube Shortsスタイル）
  if (activeTab === 'shorts' && shortNovels.length > 0) {
    return (
      <div className="relative w-screen h-screen overflow-hidden">
        {/* ショート読書コンポーネント（中央2回タップいいね、行間1.8〜2.0、スワイプ） */}
        <NovelViewer
          novels={shortNovels}
          initialNovelIndex={selectedShortIndex}
          initialPageIndex={selectedShortPageIndex}
          onBack={() => {
            setActiveTab('home');
            setSelectedShortPageIndex(0);
          }}
          onOpenPublish={() => setIsPublishModalOpen(true)}
          onToggleLike={handleToggleLike}
          userLikedIds={userLikedIds}
          userBookmarkedIds={userBookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          phraseLikes={userPhraseLikes}
          onAddPhraseLike={handleAddPhraseLike}
          onRemovePhraseLike={handleRemovePhraseLike}
        />

        {/* 投稿モーダル */}
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onSuccess={handleNovelPublished}
        />
      </div>
    );
  }

  // 3. ホーム画面 / 通常小説・ライブラリ画面
  return (
    <div className="w-screen h-screen bg-[#070d0a] text-[#e3e8e5] flex flex-col overflow-hidden font-sans">
      {/* ナビゲーションバー */}
      <header className="h-16 border-b border-[#142b20] bg-[#0b1611]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-30 shrink-0 relative">
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <div
            onClick={() => {
              setActiveTab('home');
              setSearchQuery('');
            }}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            {/* ユーザー提供アイコン画像に基づく新アプリアイコン */}
            <AppIcon className="w-8 h-8 sm:w-10 sm:h-10 group-hover:scale-105 transition-transform" roundedClassName="rounded-xl" />
            <div className="hidden min-[420px]:block">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif group-hover:text-emerald-300 transition-colors">
                NovelFlow
              </span>
            </div>
          </div>

          {/* メインタブ（ホーム / ショート / 通常小説 / レコメンド探す） */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0f2119] border border-[#1b3a2c] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
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
                                setSelectedShortIndex(originalIdx >= 0 ? originalIdx : 0);
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
                              setSelectedRegularNovel(novel);
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

          {/* マイページ遷移ボタン */}
          <button
            id="header-mypage-button"
            onClick={() => setIsMyPageOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-[#0b1b13] hover:bg-[#132c20] border border-[#1d4230] text-neutral-200 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer group"
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
            <span className="hidden sm:inline max-w-[100px] truncate">{currentUser?.username || 'マイページ'}</span>
            <span className="sm:hidden">マイ</span>
          </button>

          {/* 新規アカウント作成ボタン（未ログイン時またはクイック作成用） */}
          <button
            id="header-register-button"
            onClick={() => {
              setAuthModalMode('register');
              setIsAuthModalOpen(true);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-[#08150f] hover:bg-[#0f241a] border border-[#163826] text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            title="新規アカウント作成"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>アカウント作成</span>
          </button>

          {/* 作品を投稿ボタン */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] text-xs font-bold shadow-lg shadow-emerald-950/60 hover:brightness-110 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">作品を投稿</span>
            <span className="sm:hidden">投稿</span>
          </button>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-28 lg:pb-8 max-w-[1680px] mx-auto w-full">
        {activeTab === 'explore' ? (
          /* レコメンド・AI発見タブ */
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* ヘッダーエリア */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#142a1e]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[#041a12] shadow-md shadow-emerald-950/50 shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-tight">
                      おすすめ作品
                    </h2>
                    <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      パーソナライズ推薦
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    いいねした作品・フレーズのカテゴリ傾向から、あなただけの推薦順序をリアルタイム分析
                    <button
                      onClick={() => setIsMyPageOpen(true)}
                      className="ml-2 text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                    >
                      （マイページで傾向を確認 →）
                    </button>
                  </p>
                </div>
              </div>

              {/* ソートセレクター */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs text-neutral-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>並び順:</span>
                </span>
                <div className="flex items-center bg-[#0d1a13] border border-[#163123] rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setExploreSort('recommended')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      exploreSort === 'recommended'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    おすすめ順
                  </button>
                  <button
                    onClick={() => setExploreSort('likes')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      exploreSort === 'likes'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    いいね人気順
                  </button>
                  <button
                    onClick={() => setExploreSort('newest')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      exploreSort === 'newest'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    新着順
                  </button>
                </div>
              </div>
            </div>

            {/* 推薦作品グリッド */}
            {recommendedNovels.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#0d1c15] border border-[#183628] text-neutral-400">
                該当する推薦作品はありません
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
                {recommendedNovels.map((item) => {
                  const isShort = item.novel.type === 'short';
                  return (
                    <div
                      key={`rec-${item.novel.id}`}
                      onClick={() => {
                        if (isShort) {
                          const idx = shortNovels.findIndex((s) => s.id === item.novel.id);
                          setSelectedShortIndex(idx >= 0 ? idx : 0);
                          setSelectedShortPageIndex(0);
                          setActiveTab('shorts');
                        } else {
                          setSelectedRegularNovel(item.novel);
                          setSelectedRegularChapterIndex(0);
                        }
                      }}
                      className="p-5 sm:p-6 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between relative overflow-hidden"
                    >
                      <div>
                        {/* 推薦バッジ ＆ 作品形式バッジ */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1 ${
                              item.isTopMatch
                                ? 'bg-emerald-700/20 text-emerald-800 border border-emerald-600/40'
                                : 'bg-[#e5d6be] text-[#5e4732] border border-[#cfbdab]'
                            }`}
                          >
                            <span>{item.recommendationTag}</span>
                          </span>

                          <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-[#f0e6d6] text-[#785f47] border border-[#d6c4ad]">
                            {isShort ? 'ショート' : `全${item.novel.pages.length}話`}
                          </span>
                        </div>

                        {/* タイトル */}
                        <h3 className="text-base sm:text-lg font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                          {item.novel.title}
                        </h3>

                        {/* カテゴリ */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2 py-0.5 rounded border border-[#d6c1a5] tracking-wider font-sans">
                            {item.novel.category || 'その他'}
                          </span>
                        </div>

                        {/* あらすじ */}
                        <p className="text-xs sm:text-[13px] text-[#5c4936] mt-2.5 line-clamp-3 leading-relaxed font-serif">
                          {item.novel.synopsis}
                        </p>
                      </div>

                      {/* フッター（作者情報・いいねボタン・読むボタン） */}
                      <div className="pt-3.5 mt-5 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                        <div className="flex items-center gap-2 truncate max-w-[120px]">
                          <img
                            src={item.novel.author?.avatar_url || ''}
                            alt={item.novel.author?.username}
                            className="w-5 h-5 rounded-full object-cover border border-[#c4a984]"
                          />
                          <span className="truncate text-[#3b2d21] text-[11px] font-medium">
                            {item.novel.author?.username}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* いいねボタン（押下で推薦順序がリアルタイムに更新） */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLike(item.novel.id);
                            }}
                            className={`flex items-center gap-1 font-semibold px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                              userLikedIds.has(item.novel.id)
                                ? 'text-rose-700 font-bold bg-rose-500/20'
                                : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                            }`}
                            title={userLikedIds.has(item.novel.id) ? 'いいね解除' : 'いいね！'}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-colors ${
                                userLikedIds.has(item.novel.id) ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                              }`}
                            />
                            <span>{item.novel.likesCount || 0}</span>
                          </button>

                          <span className="px-2 py-1 rounded bg-[#3b2d21] text-[#f7f3e8] text-[10px] font-bold group-hover:bg-[#5a4431] transition-colors">
                            {isShort ? 'スワイプ' : '読む'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'home' ? (
          /* ホーム画面（ショート小説を最前面に広く展開、通常小説ピックアップ） */
          <div className="space-y-8">
            {/* 検索結果ステータスバナー（検索クエリがある場合） */}
            {searchQuery.trim() && (
              <div className="p-4 rounded-2xl bg-[#0d1c15] border border-[#183628] flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-white">
                    「<span className="text-emerald-300 font-bold">{searchQuery}</span>」の検索結果:
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                    ショート {filteredShortNovels.length} 件
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium">
                    通常小説 {filteredRegularNovels.length} 件
                  </span>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#14291e] hover:bg-[#1b3a2a] text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>検索をクリア</span>
                </button>
              </div>
            )}

            {/* 検索結果がどちらも0件の場合 */}
            {searchQuery.trim() && filteredShortNovels.length === 0 && filteredRegularNovels.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#0d1c15] border border-[#183628] text-neutral-400 space-y-3">
                <Search className="w-10 h-10 mx-auto text-emerald-700" />
                <h3 className="text-base font-bold text-white">該当する作品が見つかりませんでした</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  「{searchQuery}」に一致するショート小説または通常小説はありません。別のキーワードをお試しいただくか、検索をクリアしてください。
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] text-xs font-bold hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>すべての作品を表示する</span>
                </button>
              </div>
            ) : (
              <>
                {/* ショート小説セクション（メインエリアとして広く配置） */}
                {(!searchQuery.trim() || filteredShortNovels.length > 0) && (
                  <section>
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#142a1e]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[#041a12] shadow-sm shrink-0">
                          <Flame className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                            ショート小説
                          </h2>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            1話完結・サクッと読める超短編。カードをタップして全画面リーダーで次々にスワイプ
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 広く見やすいショート小説グリッド */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                      {(searchQuery.trim() ? filteredShortNovels : shortNovels).map((novel, idx) => {
                        const originalIdx = shortNovels.findIndex((n) => n.id === novel.id);
                        return (
                          <div
                            key={novel.id}
                            onClick={() => {
                              setSelectedShortIndex(originalIdx >= 0 ? originalIdx : 0);
                              setActiveTab('shorts');
                            }}
                            className="p-5 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between min-h-[220px] relative overflow-hidden"
                          >
                            <div>
                              <h3 className="text-sm sm:text-base font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                                {novel.title}
                              </h3>

                              <div className="mt-1.5 flex items-center">
                                <span className="text-[9px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2 py-0.5 rounded border border-[#d6c1a5] tracking-wider font-sans">
                                  {novel.category || 'ショート'}
                                </span>
                              </div>

                              <p className="text-xs text-[#5c4936] mt-2 line-clamp-3 leading-relaxed font-serif">
                                {novel.synopsis}
                              </p>
                            </div>

                            <div className="pt-3 mt-4 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                              <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8b6f4e]" />
                                <span className="truncate text-[#3b2d21] text-[11px] font-medium">
                                  {novel.author?.username}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLike(novel.id);
                                }}
                                className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                                  userLikedIds.has(novel.id)
                                    ? 'text-rose-700 font-bold bg-rose-500/20'
                                    : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                                }`}
                                title={userLikedIds.has(novel.id) ? 'いいね解除' : 'いいね！'}
                              >
                                <Heart
                                  className={`w-3 h-3 transition-colors ${
                                    userLikedIds.has(novel.id) ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                                  }`}
                                />
                                <span>{novel.likesCount || 0}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 通常小説（長編・連載）ピックアップ */}
                {(!searchQuery.trim() || filteredRegularNovels.length > 0) && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-teal-300" />
                        <div>
                          <h2 className="text-base font-bold text-white font-serif">
                            {searchQuery.trim()
                              ? '関連する通常小説'
                              : '人気・連載中の通常小説'}
                          </h2>
                          <p className="text-[11px] text-neutral-400">
                            章仕立ての重厚なストーリー。目次・しおり・投げ銭に対応
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(searchQuery.trim() ? filteredRegularNovels : regularNovels).map((novel) => (
                        <div
                          key={novel.id}
                          onClick={() => setSelectedRegularNovel(novel)}
                          className="p-5 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <h3 className="text-sm sm:text-base font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug">
                                {novel.title}
                              </h3>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2 py-0.5 rounded border border-[#d6c1a5] tracking-wider font-sans">
                                {novel.category || '通常小説'}
                              </span>
                              <span className="text-[11px] text-[#73604e] flex items-center gap-1 font-sans">
                                <Layers className="w-3 h-3 text-[#8b6f4e]" />
                                全 {novel.pages.length} 話
                              </span>
                            </div>

                            <p className="text-xs text-[#5c4936] mt-2 line-clamp-3 leading-relaxed font-serif">
                              {novel.synopsis}
                            </p>
                          </div>

                          <div className="mt-5 pt-3 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                            <div className="flex items-center gap-2">
                              <img
                                src={novel.author?.avatar_url || ''}
                                alt={novel.author?.username}
                                className="w-6 h-6 rounded-full object-cover border border-[#c4a984]"
                              />
                              <span className="text-[#3b2d21] text-[11px] font-medium">
                                {novel.author?.username}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px]">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLike(novel.id);
                                }}
                                className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                                  userLikedIds.has(novel.id)
                                    ? 'text-rose-700 font-bold bg-rose-500/20'
                                    : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                                }`}
                                title={userLikedIds.has(novel.id) ? 'いいね解除' : 'いいね！'}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 transition-colors ${
                                    userLikedIds.has(novel.id) ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                                  }`}
                                />
                                <span>{novel.likesCount || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        ) : (
          /* 通常小説ライブラリビュー（activeTab === 'library'） */
          <div className="w-full">
            {/* 通常小説（連載・長編）一覧 */}
            <section className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
                    <BookOpen className="w-6 h-6 text-teal-300" />
                    <span>通常小説・連載作品一覧</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    章仕立ての本格小説。目次・しおり・投げ銭対応
                  </p>
                </div>

                {/* 検索バー */}
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center w-full sm:w-auto">
                    <Search className="w-4 h-4 absolute left-3 text-emerald-500/70 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="作品名・作者で検索..."
                      className="bg-[#0a1510] border border-[#183628] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 w-full sm:w-72 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 p-0.5 rounded text-neutral-400 hover:text-white"
                        title="クリア"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* カテゴリフィルタ */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 text-xs sm:text-sm font-medium scrollbar-none">
                {[
                  { id: 'all', label: 'すべて' },
                  { id: 'ハイファンタジー', label: 'ファンタジー' },
                  { id: 'SF・サイバーパンク', label: 'SF' },
                  { id: 'ヒューマンドラマ', label: 'ドラマ' },
                  { id: '和風歴史・伝奇', label: '伝奇・和風' },
                  { id: 'お仕事・コメディ', label: 'お仕事' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                        : 'bg-[#0d1a13] text-neutral-400 border border-[#163123] hover:text-white hover:bg-[#12241b]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* 通常小説カード一覧（幅広く展開したグリッドレイアウト） */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredRegularNovels.map((novel) => (
                  <div
                    key={novel.id}
                    onClick={() => setSelectedRegularNovel(novel)}
                    className="p-5 sm:p-6 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base sm:text-lg font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug">
                          {novel.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2.5 py-0.5 rounded border border-[#d6c1a5] tracking-wider">
                          {novel.category || '通常小説'}
                        </span>
                        <span className="text-xs text-[#73604e] flex items-center gap-1.5 font-sans">
                          <Layers className="w-3.5 h-3.5 text-[#8b6f4e]" />
                          全 {novel.pages.length} 話
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-[#5c4936] mt-2.5 line-clamp-4 leading-relaxed font-serif">
                        {novel.synopsis}
                      </p>
                    </div>

                    <div className="mt-6 pt-3.5 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                      <div className="flex items-center gap-2">
                        <img
                          src={novel.author?.avatar_url || ''}
                          alt={novel.author?.username}
                          className="w-6 h-6 rounded-full object-cover border border-[#c4a984]"
                        />
                        <span className="text-[#3b2d21] text-xs font-medium">
                          {novel.author?.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(novel.id);
                          }}
                          className={`flex items-center gap-1 font-semibold px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                            userLikedIds.has(novel.id)
                              ? 'text-rose-700 font-bold bg-rose-500/20'
                              : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                          }`}
                          title={userLikedIds.has(novel.id) ? 'いいね解除' : 'いいね！'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-colors ${
                              userLikedIds.has(novel.id) ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                            }`}
                          />
                          <span>{novel.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* モバイル用常時下部ナビゲーションバー（おすすめ・ホーム・ショート・通常小説・マイページ） */}
      <nav
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08150f]/95 backdrop-blur-xl border-t border-[#163625] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.6)]"
      >
        {/* ホーム */}
        <button
          id="btn-mobile-nav-home"
          onClick={() => {
            setActiveTab('home');
            setSearchQuery('');
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

        {/* おすすめ（パーソナライズ推薦） */}
        <button
          id="btn-mobile-nav-explore"
          onClick={() => {
            setActiveTab('explore');
            setSearchQuery('');
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
            {userCategoryStats.totalScore > 0 && activeTab !== 'explore' && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">おすすめ</span>
        </button>

        {/* ショート */}
        <button
          id="btn-mobile-nav-shorts"
          onClick={() => {
            setSelectedShortIndex(0);
            setSelectedShortPageIndex(0);
            setActiveTab('shorts');
          }}
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
            setSearchQuery('');
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
          onClick={() => setIsMyPageOpen(true)}
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

      {/* 投稿モーダル */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={handleNovelPublished}
      />

      {/* マイページモーダル */}
      <MyPageModal
        isOpen={isMyPageOpen}
        onClose={() => setIsMyPageOpen(false)}
        novels={{ shorts: shortNovels, regulars: regularNovels }}
        userLikedIds={userLikedIds}
        userBookmarkedIds={userBookmarkedIds}
        onToggleLike={handleToggleLike}
        onToggleBookmark={handleToggleBookmark}
        onSelectShort={(idx, page) => {
          setSelectedShortIndex(idx);
          setSelectedShortPageIndex(page ?? 0);
          setActiveTab('shorts');
        }}
        onSelectRegular={(novel, chapter) => {
          setSelectedRegularNovel(novel);
          setSelectedRegularChapterIndex(chapter ?? 0);
        }}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('register');
          setIsAuthModalOpen(true);
        }}
        phraseLikes={userPhraseLikes}
        onRemovePhraseLike={handleRemovePhraseLike}
        recommendedNovels={recommendedNovels}
      />

      {/* アカウント作成 / ログインモーダル */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
}
