// components/MyPageModal.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  Edit3,
  Check,
  BookOpen,
  Flame,
  Bookmark,
  Heart,
  Plus,
  LogOut,
  UserPlus,
  Sparkles,
  Layers,
  Calendar,
  ChevronRight,
  Quote,
  Copy,
  Trash2,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import type { NovelWithDetails, PhraseLike } from '@/types/database';

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  novels: {
    shorts: NovelWithDetails[];
    regulars: NovelWithDetails[];
  };
  userLikedIds?: Set<string>;
  userBookmarkedIds?: Set<string>;
  onToggleLike?: (novelId: string) => void;
  onToggleBookmark?: (novelId: string) => void;
  onSelectShort: (index: number, initialPage?: number) => void;
  onSelectRegular: (novel: NovelWithDetails, initialChapter?: number) => void;
  onOpenPublish: () => void;
  onOpenAuth: () => void;
  phraseLikes?: PhraseLike[];
  onRemovePhraseLike?: (id: string) => void;
  categoryStats?: {
    scores: Record<string, number>;
    sortedCategories: { category: string; score: number }[];
    topCategories: string[];
    totalScore: number;
  };
  recommendedNovels?: {
    novel: NovelWithDetails;
    recommendationScore: number;
    recommendationTag: string;
    isTopMatch: boolean;
    categoryAffinity: number;
    isLiked: boolean;
  }[];
}

export default function MyPageModal({
  isOpen,
  onClose,
  novels,
  userLikedIds,
  userBookmarkedIds,
  onToggleLike,
  onToggleBookmark,
  onSelectShort,
  onSelectRegular,
  onOpenPublish,
  onOpenAuth,
  phraseLikes = [],
  onRemovePhraseLike,
  categoryStats,
  recommendedNovels = [],
}: MyPageModalProps) {
  const { currentUser, logout, updateProfile, isAuthenticated } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'works' | 'bookmarks' | 'likes' | 'recommendations' | 'phrase_likes'>('works');
  const [formatFilter, setFormatFilter] = useState<'all' | 'short' | 'regular'>('all');
  const [copiedPhraseId, setCopiedPhraseId] = useState<string | null>(null);

  // ユーザーのカテゴリ傾向スコア集計（外部propsまたは自己集計）
  const userCategoryStats = useMemo(() => {
    if (categoryStats) return categoryStats;
    const counts: Record<string, number> = {};
    const all = [...novels.shorts, ...novels.regulars];

    userLikedIds?.forEach((id) => {
      const novel = all.find((n) => n.id === id);
      if (novel?.category) {
        counts[novel.category] = (counts[novel.category] || 0) + 3;
      }
    });

    phraseLikes?.forEach((item) => {
      if (item.novelCategory) {
        counts[item.novelCategory] = (counts[item.novelCategory] || 0) + 1;
      }
    });

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
  }, [categoryStats, novels, userLikedIds, phraseLikes]);

  // プロフィール編集ステート
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleStartEdit = () => {
    if (currentUser) {
      setEditUsername(currentUser.username);
      setEditBio(currentUser.bio || '');
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim()) return;
    await updateProfile({
      username: editUsername.trim(),
      bio: editBio.trim(),
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // ユーザーが投稿した作品（ローカルまたはユーザー名一致）
  const allNovels = [...novels.shorts, ...novels.regulars];
  const userWorks = allNovels.filter(
    (n) =>
      n.id.startsWith('user-') ||
      (currentUser && n.author?.username?.toLowerCase() === currentUser.username.toLowerCase())
  );
  const userWorksShortsCount = userWorks.filter((n) => n.type === 'short').length;
  const userWorksRegularsCount = userWorks.filter((n) => n.type === 'regular').length;
  const filteredUserWorks = userWorks.filter((n) => {
    if (formatFilter === 'short') return n.type === 'short';
    if (formatFilter === 'regular') return n.type === 'regular';
    return true;
  });

  // 現在のアカウントのしおり保存作品（リアルタイム連動）
  const bookmarkedNovels = allNovels.filter((n) => userBookmarkedIds?.has(n.id));
  const bookmarkedShortsCount = bookmarkedNovels.filter((n) => n.type === 'short').length;
  const bookmarkedRegularsCount = bookmarkedNovels.filter((n) => n.type === 'regular').length;
  const filteredBookmarkedNovels = bookmarkedNovels.filter((n) => {
    if (formatFilter === 'short') return n.type === 'short';
    if (formatFilter === 'regular') return n.type === 'regular';
    return true;
  });

  // 現在のアカウントのいいねした作品（リアルタイム連動・解除時に即時同期）
  const likedNovels = allNovels.filter((n) => userLikedIds?.has(n.id));
  const likedShortsCount = likedNovels.filter((n) => n.type === 'short').length;
  const likedRegularsCount = likedNovels.filter((n) => n.type === 'regular').length;
  const filteredLikedNovels = likedNovels.filter((n) => {
    if (formatFilter === 'short') return n.type === 'short';
    if (formatFilter === 'regular') return n.type === 'regular';
    return true;
  });

  // おすすめ作品（ユーザーのいいねカテゴリ傾向に基づく推薦）
  const recommendedItems = recommendedNovels || [];
  const recommendedShortsCount = recommendedItems.filter((item) => item.novel.type === 'short').length;
  const recommendedRegularsCount = recommendedItems.filter((item) => item.novel.type === 'regular').length;
  const filteredRecommendedItems = recommendedItems.filter((item) => {
    if (formatFilter === 'short') return item.novel.type === 'short';
    if (formatFilter === 'regular') return item.novel.type === 'regular';
    return true;
  });

  // フォーマット切り替えタブ（ユーザーページ内表示）
  const renderFormatFilterBar = (totalCount: number, shortCount: number, regularCount: number) => (
    <div
      id="mypage-format-filter"
      className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 text-xs font-semibold scrollbar-none"
    >
      <button
        type="button"
        onClick={() => setFormatFilter('all')}
        className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
          formatFilter === 'all'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
            : 'bg-[#0d1a13] text-neutral-400 border border-[#163123] hover:text-white hover:bg-[#12241b]'
        }`}
      >
        すべて ({totalCount})
      </button>
      <button
        type="button"
        onClick={() => setFormatFilter('short')}
        className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
          formatFilter === 'short'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
            : 'bg-[#0d1a13] text-neutral-400 border border-[#163123] hover:text-white hover:bg-[#12241b]'
        }`}
      >
        <Flame className="w-3.5 h-3.5 text-rose-500" />
        <span>ショート小説のみ ({shortCount})</span>
      </button>
      <button
        type="button"
        onClick={() => setFormatFilter('regular')}
        className={`px-3.5 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
          formatFilter === 'regular'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
            : 'bg-[#0d1a13] text-neutral-400 border border-[#163123] hover:text-white hover:bg-[#12241b]'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5 text-teal-300" />
        <span>通常小説・連載のみ ({regularCount})</span>
      </button>
    </div>
  );

  return (
    <div
      id="mypage-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-sans"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b1611] border border-[#1b3a2a] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative text-white"
      >
        {/* モーダルヘッダー */}
        <div className="px-6 py-4 border-b border-[#152e21] flex items-center justify-between shrink-0 bg-[#09140e]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold tracking-wide text-white">マイページ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツスクロール領域 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* ユーザープロフィールカード */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0f241a] to-[#08130e] border border-[#1d4230] relative overflow-hidden shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={
                    currentUser?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser?.username || 'ユーザー'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400/40 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-[#041a12] rounded-lg p-1">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-3">
                    <div>
                      <label className="text-[11px] text-neutral-400">表示名</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full bg-[#070e0a] border border-[#1b3d2b] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400">自己紹介</label>
                      <textarea
                        rows={2}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full bg-[#070e0a] border border-[#1b3d2b] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1 rounded-lg border border-[#1b3d2b] text-[11px] text-neutral-300 hover:bg-white/5"
                      >
                        キャンセル
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-emerald-400 text-[#041a12] font-bold text-[11px] hover:bg-emerald-300"
                      >
                        保存
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white tracking-wide">
                        {currentUser?.username || 'ゲスト読者'}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        読書マスター
                      </span>
                      <button
                        onClick={handleStartEdit}
                        className="p-1 text-neutral-400 hover:text-emerald-300 transition-colors"
                        title="プロフィールを編集"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-neutral-500" />
                      <span>{currentUser?.email || 'guest@novelflow.jp'}</span>
                    </p>

                    <p className="text-xs text-neutral-300 mt-2 line-clamp-2 leading-relaxed font-serif">
                      {currentUser?.bio || '物語を読むこと、書くことが好きです。'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 統計バー */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-[#173626] text-center">
              <div className="p-2 rounded-xl bg-[#08120d]/70">
                <div className="text-base sm:text-lg font-bold text-emerald-300">{userWorks.length}</div>
                <div className="text-[10px] text-neutral-400">投稿作品</div>
              </div>
              <div className="p-2 rounded-xl bg-[#08120d]/70">
                <div className="text-base sm:text-lg font-bold text-teal-300">{bookmarkedNovels.length}</div>
                <div className="text-[10px] text-neutral-400">しおり保存</div>
              </div>
              <div className="p-2 rounded-xl bg-[#08120d]/70">
                <div className="text-base sm:text-lg font-bold text-rose-400">{likedNovels.length}</div>
                <div className="text-[10px] text-neutral-400">いいね</div>
              </div>
            </div>
          </div>

          {/* 読書傾向・好みのカテゴリ（いいね分析） */}
          {userCategoryStats.sortedCategories.length > 0 ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c1c14] to-[#09150f] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/30">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>あなたの好みのカテゴリ傾向</span>
                    <span className="text-[10px] text-emerald-400 font-normal">（いいね分析中）</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {userCategoryStats.sortedCategories.map((item, idx) => (
                      <span
                        key={item.category}
                        className={`text-xs px-3 py-1 rounded-full font-sans flex items-center gap-1.5 transition-all ${
                          idx === 0
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 font-bold shadow-xs'
                            : 'bg-[#12261b] text-neutral-300 border border-[#1b3f2c]'
                        }`}
                      >
                        <span className="text-[11px]">{idx === 0 ? '👑' : '★'}</span>
                        <span>{item.category}</span>
                        <span className="text-[10px] opacity-75">({item.score}pt)</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-xs text-neutral-400 sm:text-right shrink-0 bg-[#07130d]/60 px-3 py-2 rounded-xl border border-[#14291e]">
                <div>いいね済み: <span className="text-emerald-400 font-bold">{userLikedIds?.size || 0}</span> 作品</div>
                {(phraseLikes?.length || 0) > 0 && (
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    フレーズいいね: {phraseLikes?.length} 件
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#0d1c15] border border-[#183628] flex items-center gap-3 shadow-md">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs text-neutral-300 leading-relaxed">
                作品の「いいね（❤️）」や文のフレーズいいねを行うと、あなたの好みのジャンル傾向が自動分析され、おすすめ作品の推薦順序に反映されます。
              </div>
            </div>
          )}

          {/* 保存成功通知 */}
          {savedSuccess && (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              <span>プロフィールを更新しました</span>
            </div>
          )}

          {/* サブタブ切り替え */}
          <div>
            <div className="flex border-b border-[#163123] mb-4 gap-3 sm:gap-4 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveSubTab('works')}
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 shrink-0 ${
                  activeSubTab === 'works'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>投稿した作品 ({userWorks.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('bookmarks')}
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 shrink-0 ${
                  activeSubTab === 'bookmarks'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>しおり・読書履歴 ({bookmarkedNovels.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('likes')}
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 shrink-0 ${
                  activeSubTab === 'likes'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>いいねした作品 ({likedNovels.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('recommendations')}
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 shrink-0 ${
                  activeSubTab === 'recommendations'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>おすすめ作品 ({recommendedItems.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('phrase_likes')}
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 shrink-0 ${
                  activeSubTab === 'phrase_likes'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>フレーズいいね ({phraseLikes.length})</span>
              </button>
            </div>

            {/* タブ1: 投稿作品 */}
            {activeSubTab === 'works' && (
              <div>
                {userWorks.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                    <p className="text-xs text-neutral-400 mb-3">まだ投稿した作品がありません</p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenPublish();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] text-xs font-bold shadow-md hover:brightness-110 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>今すぐ新しい作品を投稿する</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {renderFormatFilterBar(userWorks.length, userWorksShortsCount, userWorksRegularsCount)}

                    {filteredUserWorks.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                        <p className="text-xs text-neutral-400">選択した形式の投稿作品はありません</p>
                        <button
                          onClick={() => setFormatFilter('all')}
                          className="mt-2 text-xs text-emerald-400 underline font-medium cursor-pointer"
                        >
                          すべての形式を表示
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredUserWorks.map((novel) => (
                          <div
                            key={novel.id}
                            onClick={() => {
                              onClose();
                              if (novel.type === 'short') {
                                const idx = novels.shorts.findIndex((s) => s.id === novel.id);
                                onSelectShort(idx >= 0 ? idx : 0);
                              } else {
                                onSelectRegular(novel);
                              }
                            }}
                            className="p-3.5 rounded-2xl bg-[#091510] hover:bg-[#0f241a] border border-[#163123] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    novel.type === 'short'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                  }`}
                                >
                                  {novel.type === 'short' ? 'ショート小説' : '通常小説'}
                                </span>
                                <span className="text-[10px] text-neutral-400">{novel.category}</span>
                              </div>
                              <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 truncate font-serif">
                                {novel.title}
                              </h4>
                              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                全{novel.pages.length}話 • {novel.synopsis || 'あらすじなし'}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* タブ2: しおり */}
            {activeSubTab === 'bookmarks' && (
              <div>
                {bookmarkedNovels.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                    <Bookmark className="w-8 h-8 text-teal-500/30 mx-auto mb-2" />
                    <p className="text-xs text-neutral-300 font-medium">まだしおりを挟んだ作品がありません</p>
                    <p className="text-[11px] text-neutral-500 mt-1">作品の読書中にしおりボタンを押すと、ここに保存されます</p>
                  </div>
                ) : (
                  <div>
                    {renderFormatFilterBar(bookmarkedNovels.length, bookmarkedShortsCount, bookmarkedRegularsCount)}

                    {filteredBookmarkedNovels.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                        <p className="text-xs text-neutral-400">選択した形式のしおり作品はありません</p>
                        <button
                          onClick={() => setFormatFilter('all')}
                          className="mt-2 text-xs text-emerald-400 underline font-medium cursor-pointer"
                        >
                          すべての形式を表示
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredBookmarkedNovels.map((novel) => (
                          <div
                            key={novel.id}
                            onClick={() => {
                              onClose();
                              if (novel.type === 'short') {
                                const idx = novels.shorts.findIndex((s) => s.id === novel.id);
                                onSelectShort(idx >= 0 ? idx : 0);
                              } else {
                                onSelectRegular(novel);
                              }
                            }}
                            className="p-3.5 rounded-2xl bg-[#091510] hover:bg-[#0f241a] border border-[#163123] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 pr-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                  <Bookmark className="w-3 h-3 fill-current" />
                                  <span>しおり保存中</span>
                                </span>
                                <span
                                  className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                                    novel.type === 'short'
                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                      : 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                                  }`}
                                >
                                  {novel.type === 'short' ? 'ショート' : '通常小説'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white group-hover:text-teal-200 truncate font-serif">
                                {novel.title}
                              </h4>
                              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                著：{novel.author?.username || '作者'} • {novel.category}
                              </p>
                            </div>
                            <span className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 group-hover:bg-teal-400 group-hover:text-[#041a12] transition-colors shrink-0">
                              続きから読む
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* タブ3: いいね */}
            {activeSubTab === 'likes' && (
              <div>
                {likedNovels.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                    <Heart className="w-8 h-8 text-rose-500/30 mx-auto mb-2" />
                    <p className="text-xs text-neutral-300 font-medium">まだいいねした作品がありません</p>
                    <p className="text-[11px] text-neutral-500 mt-1">作品のハートマークを押すと、ここに一覧表示されます</p>
                  </div>
                ) : (
                  <div>
                    {renderFormatFilterBar(likedNovels.length, likedShortsCount, likedRegularsCount)}

                    {filteredLikedNovels.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                        <p className="text-xs text-neutral-400">選択した形式のいいね作品はありません</p>
                        <button
                          onClick={() => setFormatFilter('all')}
                          className="mt-2 text-xs text-emerald-400 underline font-medium cursor-pointer"
                        >
                          すべての形式を表示
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredLikedNovels.map((novel) => (
                          <div
                            key={novel.id}
                            className="p-3.5 rounded-2xl bg-[#091510] hover:bg-[#0f241a] border border-[#163123] transition-all flex items-center justify-between group"
                          >
                            <div
                              onClick={() => {
                                onClose();
                                if (novel.type === 'short') {
                                  const idx = novels.shorts.findIndex((s) => s.id === novel.id);
                                  onSelectShort(idx >= 0 ? idx : 0);
                                } else {
                                  onSelectRegular(novel);
                                }
                              }}
                              className="min-w-0 pr-3 flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] text-rose-400 flex items-center gap-1">
                                  <Heart className="w-3 h-3 fill-current" />
                                  <span>いいね済み（作品全体: {novel.likesCount || 0} いいね）</span>
                                </span>
                                <span
                                  className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                                    novel.type === 'short'
                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                      : 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                                  }`}
                                >
                                  {novel.type === 'short' ? 'ショート' : '通常小説'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white group-hover:text-rose-200 truncate font-serif">
                                {novel.title}
                              </h4>
                              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                著：{novel.author?.username || '作者'} • {novel.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {onToggleLike && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLike(novel.id);
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer"
                                  title="いいねを解除"
                                >
                                  解除
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  if (novel.type === 'short') {
                                    const idx = novels.shorts.findIndex((s) => s.id === novel.id);
                                    onSelectShort(idx >= 0 ? idx : 0);
                                  } else {
                                    onSelectRegular(novel);
                                  }
                                }}
                                className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-[#041a12] transition-colors cursor-pointer"
                              >
                                作品を見る
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* タブ4: おすすめ作品（パーソナライズ推薦） */}
            {activeSubTab === 'recommendations' && (
              <div>
                {recommendedItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                    <Compass className="w-8 h-8 text-emerald-500/30 mx-auto mb-2" />
                    <p className="text-xs text-neutral-300 font-medium">まだ推薦できる作品がありません</p>
                    <p className="text-[11px] text-neutral-500 mt-1">作品にいいねをすると、あなたの好みに合わせたおすすめがここに表示されます</p>
                  </div>
                ) : (
                  <div>
                    {renderFormatFilterBar(recommendedItems.length, recommendedShortsCount, recommendedRegularsCount)}

                    {filteredRecommendedItems.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                        <p className="text-xs text-neutral-400">選択した形式のおすすめ作品はありません</p>
                        <button
                          onClick={() => setFormatFilter('all')}
                          className="mt-2 text-xs text-emerald-400 underline font-medium cursor-pointer"
                        >
                          すべての形式を表示
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredRecommendedItems.map((item) => {
                          const isShort = item.novel.type === 'short';
                          return (
                            <div
                              key={`mypage-rec-${item.novel.id}`}
                              className="p-3.5 rounded-2xl bg-[#091510] hover:bg-[#0f241a] border border-[#163123] transition-all flex items-center justify-between group"
                            >
                              <div
                                onClick={() => {
                                  onClose();
                                  if (isShort) {
                                    const idx = novels.shorts.findIndex((s) => s.id === item.novel.id);
                                    onSelectShort(idx >= 0 ? idx : 0);
                                  } else {
                                    onSelectRegular(item.novel);
                                  }
                                }}
                                className="min-w-0 pr-3 flex-1 cursor-pointer"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                                      item.isTopMatch
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-[#142b20] text-emerald-400 border border-[#1d4230]'
                                    }`}
                                  >
                                    {item.recommendationTag}
                                  </span>
                                  <span
                                    className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                                      isShort
                                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                                        : 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                                    }`}
                                  >
                                    {isShort ? 'ショート' : `全${item.novel.pages.length}話`}
                                  </span>
                                  <span className="text-[10px] text-neutral-400">{item.novel.category}</span>
                                </div>
                                <h4 className="text-sm font-bold text-white group-hover:text-emerald-200 truncate font-serif">
                                  {item.novel.title}
                                </h4>
                                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                  著：{item.novel.author?.username || '作者'} • {item.novel.synopsis || 'あらすじなし'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {onToggleLike && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleLike(item.novel.id);
                                    }}
                                    className={`flex items-center gap-1 font-semibold px-2 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                                      userLikedIds?.has(item.novel.id)
                                        ? 'text-rose-400 font-bold bg-rose-500/20 border border-rose-500/30'
                                        : 'text-neutral-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 border border-white/10'
                                    }`}
                                    title={userLikedIds?.has(item.novel.id) ? 'いいね解除' : 'いいね！'}
                                  >
                                    <Heart
                                      className={`w-3.5 h-3.5 transition-colors ${
                                        userLikedIds?.has(item.novel.id) ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'
                                      }`}
                                    />
                                    <span>{item.novel.likesCount || 0}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    if (isShort) {
                                      const idx = novels.shorts.findIndex((s) => s.id === item.novel.id);
                                      onSelectShort(idx >= 0 ? idx : 0);
                                    } else {
                                      onSelectRegular(item.novel);
                                    }
                                  }}
                                  className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-[#041a12] transition-colors cursor-pointer"
                                >
                                  {isShort ? 'スワイプ' : '読む'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* タブ4: フレーズいいね */}
            {activeSubTab === 'phrase_likes' && (
              <div>
                {phraseLikes.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#08120d] border border-[#14291e]">
                    <Quote className="w-8 h-8 text-rose-500/30 mx-auto mb-2" />
                    <p className="text-xs text-neutral-300 font-medium">まだいいねしたフレーズがありません</p>
                    <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
                      読書中にお気に入りの文章を選択またはタップすると「フレーズいいね」としてここに保存され、いつでも振り返ることができます。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {phraseLikes.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-[#091510] border border-[#163123] hover:border-[#1d4430] transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                              {item.novelCategory || '小説'}
                            </span>
                            <span className="text-xs font-bold text-white font-serif truncate max-w-[170px]">
                              {item.novelTitle}
                            </span>
                            <span className="text-[11px] text-neutral-400 font-sans truncate">
                              {item.authorName}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 shrink-0">
                            {item.chapterTitle || `${item.pageNumber}ページ目`}
                          </span>
                        </div>

                        {/* 引用テキスト */}
                        <blockquote className="text-sm text-neutral-100 font-serif leading-relaxed pl-3 border-l-2 border-rose-400 my-2.5 bg-[#050e09] py-2 pr-2 rounded-r-xl whitespace-pre-wrap">
                          「{item.phrase}」
                        </blockquote>

                        <div className="flex items-center justify-between pt-2 border-t border-[#12281d] text-xs">
                          <button
                            onClick={() => {
                              onClose();
                              const shortIdx = novels.shorts.findIndex((s) => s.id === item.novelId);
                              if (shortIdx >= 0) {
                                onSelectShort(shortIdx, item.pageNumber - 1);
                              } else {
                                const reg = novels.regulars.find((r) => r.id === item.novelId);
                                if (reg) {
                                  onSelectRegular(reg, item.pageNumber - 1);
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-bold py-1 hover:underline"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>この場面を読む</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                const textToCopy = `『${item.phrase}』\n—— ${item.authorName || '作者'}「${item.novelTitle}」より`;
                                if (navigator.clipboard) await navigator.clipboard.writeText(textToCopy);
                                setCopiedPhraseId(item.id);
                                setTimeout(() => setCopiedPhraseId(null), 2000);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0e2218] hover:bg-[#153324] text-neutral-300 hover:text-white text-[11px] font-sans transition-colors border border-[#1b3d2b]"
                            >
                              {copiedPhraseId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">コピー完了</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>引用コピー</span>
                                </>
                              )}
                            </button>

                            {onRemovePhraseLike && (
                              <button
                                onClick={() => onRemovePhraseLike(item.id)}
                                className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="フレーズいいねを解除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* フッターアクションバー */}
        <div className="p-4 border-t border-[#152e21] bg-[#09140e] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12281d] hover:bg-[#1a382a] text-xs font-semibold text-emerald-300 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>別アカウントを作成 / 切替</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-neutral-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ログアウト</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
