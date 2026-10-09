// components/MyPageModal.tsx
'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import type { NovelWithDetails } from '@/types/database';

interface MyPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  novels: {
    shorts: NovelWithDetails[];
    regulars: NovelWithDetails[];
  };
  onSelectShort: (index: number) => void;
  onSelectRegular: (novel: NovelWithDetails) => void;
  onOpenPublish: () => void;
  onOpenAuth: () => void;
}

export default function MyPageModal({
  isOpen,
  onClose,
  novels,
  onSelectShort,
  onSelectRegular,
  onOpenPublish,
  onOpenAuth,
}: MyPageModalProps) {
  const { currentUser, logout, updateProfile, isAuthenticated } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'works' | 'bookmarks' | 'likes'>('works');

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

  // ブックマークサンプル／リスト
  const bookmarkedNovels = allNovels.slice(0, 4);
  // いいねした作品サンプル／リスト
  const likedNovels = allNovels.slice(2, 6);

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

          {/* 保存成功通知 */}
          {savedSuccess && (
            <div className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs border border-emerald-500/30 flex items-center gap-2">
              <Check className="w-3.5 h-3.5" />
              <span>プロフィールを更新しました</span>
            </div>
          )}

          {/* サブタブ切り替え */}
          <div>
            <div className="flex border-b border-[#163123] mb-4 gap-4">
              <button
                onClick={() => setActiveSubTab('works')}
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
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
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
                  activeSubTab === 'bookmarks'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>しおり・読書履歴</span>
              </button>
              <button
                onClick={() => setActiveSubTab('likes')}
                className={`pb-2 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
                  activeSubTab === 'likes'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>いいねした作品</span>
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] text-xs font-bold shadow-md hover:brightness-110"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>今すぐ新しい作品を投稿する</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userWorks.map((novel) => (
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

            {/* タブ2: しおり */}
            {activeSubTab === 'bookmarks' && (
              <div className="space-y-2">
                {bookmarkedNovels.map((novel) => (
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
                      <div className="text-[10px] text-emerald-400 mb-0.5 flex items-center gap-1">
                        <Bookmark className="w-3 h-3 fill-current" />
                        <span>しおり挟み中（第1話）</span>
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

            {/* タブ3: いいね */}
            {activeSubTab === 'likes' && (
              <div className="space-y-2">
                {likedNovels.map((novel) => (
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
                      <div className="text-[10px] text-rose-400 mb-0.5 flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>いいね済み</span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-rose-200 truncate font-serif">
                        {novel.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        著：{novel.author?.username || '作者'} • {novel.category}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
                      作品を見る
                    </span>
                  </div>
                ))}
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
