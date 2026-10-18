// src/features/viewer/components/NovelViewerSidebar.tsx
import React from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Sparkles,
  Coins,
  Quote,
} from 'lucide-react';
import type { NovelWithDetails, PhraseLike } from '@/types/database';

interface NovelViewerSidebarProps {
  currentNovel: NovelWithDetails;
  novelLiked: boolean;
  novelLikes: number;
  commentsCount: number;
  isBookmarked: boolean;
  currentNovelPhraseLikes: PhraseLike[];
  onTriggerLike: (novelId: string) => void;
  onOpenComments: () => void;
  onOpenPhraseLikes: () => void;
  onToggleBookmark: () => void;
  onOpenTip: () => void;
  onShare: () => void;
  onShowToast: (msg: string) => void;
}

export function NovelViewerSidebar({
  currentNovel,
  novelLiked,
  novelLikes,
  commentsCount,
  isBookmarked,
  currentNovelPhraseLikes,
  onTriggerLike,
  onOpenComments,
  onOpenPhraseLikes,
  onToggleBookmark,
  onOpenTip,
  onShare,
  onShowToast,
}: NovelViewerSidebarProps) {
  return (
    <motion.aside
      id="novel-action-sidebar"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="absolute right-4 bottom-14 z-40 flex flex-col items-center gap-4"
    >
      {/* 作者アイコン */}
      <div
        className="relative cursor-pointer group"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onShowToast(`${currentNovel.author?.username || '作者'} の作品`);
        }}
      >
        <div className="w-11 h-11 rounded-full border-2 border-[#b89f82] overflow-hidden bg-[#e0d2bf] shadow-md">
          {currentNovel.author?.avatar_url ? (
            <img
              src={currentNovel.author.avatar_url}
              alt={currentNovel.author.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-sans font-bold text-[#443325]">
              {currentNovel.author?.username?.[0] || '著'}
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#a3513a] text-white rounded-full p-0.5 shadow">
          <Sparkles className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* いいねボタン */}
      <button
        id="btn-like-novel"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (currentNovel) onTriggerLike(currentNovel.id);
        }}
        className="flex flex-col items-center gap-1 group"
        title="いいね（中央2回タップでも可能）"
      >
        <motion.div
          whileTap={{ scale: 0.75 }}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors ${
            novelLiked
              ? 'bg-rose-50 text-rose-600 border border-rose-300'
              : 'bg-[#ede3d1]/90 text-[#4c392c] border border-[#cfbdab] group-hover:bg-[#e4d6c0]'
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-transform duration-200 ${
              novelLiked ? 'fill-current scale-110' : ''
            }`}
          />
        </motion.div>
        <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
          {novelLikes}
        </span>
      </button>

      {/* コメントボタン */}
      <button
        id="btn-comment-novel"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onOpenComments();
        }}
        className="flex flex-col items-center gap-1 group"
        title="感想コメント"
      >
        <motion.div
          whileTap={{ scale: 0.85 }}
          className="w-11 h-11 rounded-full bg-[#ede3d1]/90 text-[#4c392c] border border-[#cfbdab] flex items-center justify-center group-hover:bg-[#e4d6c0] shadow-md transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
        </motion.div>
        <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
          {commentsCount}
        </span>
      </button>

      {/* フレーズいいね一覧（振り返り）ボタン */}
      <button
        id="btn-phrase-likes-novel"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onOpenPhraseLikes();
        }}
        className="flex flex-col items-center gap-1 group"
        title="フレーズいいね一覧・振り返り"
      >
        <motion.div
          whileTap={{ scale: 0.85 }}
          className="w-11 h-11 rounded-full bg-[#ede3d1]/90 text-rose-700 border border-[#cfbdab] flex items-center justify-center group-hover:bg-[#e4d6c0] shadow-md transition-colors relative"
        >
          <Quote className="w-5 h-5 text-rose-600" />
          {currentNovelPhraseLikes.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-sans font-bold flex items-center justify-center shadow-xs">
              {currentNovelPhraseLikes.length}
            </span>
          )}
        </motion.div>
        <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
          フレーズ
        </span>
      </button>

      {/* しおりボタン */}
      <button
        id="btn-bookmark-novel"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={onToggleBookmark}
        className="flex flex-col items-center gap-1 group"
        title="しおり"
      >
        <motion.div
          whileTap={{ scale: 0.85 }}
          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors ${
            isBookmarked
              ? 'bg-[#a3513a] text-[#f7f3e8] border border-[#873e2b]'
              : 'bg-[#ede3d1]/90 text-[#4c392c] border border-[#cfbdab] group-hover:bg-[#e4d6c0]'
          }`}
        >
          <Bookmark
            className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`}
          />
        </motion.div>
        <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
          保存
        </span>
      </button>

      {/* 投げ銭（応援機能）ボタン */}
      <button
        id="btn-tip-novel"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onOpenTip();
        }}
        className="flex flex-col items-center gap-1 group"
        title="作家に投げ銭・チップを贈る"
      >
        <motion.div
          whileTap={{ scale: 0.85 }}
          className="w-11 h-11 rounded-full bg-[#ebd9bd]/90 text-[#855725] border border-[#cfb591] flex items-center justify-center group-hover:bg-[#e2cbaf] shadow-md transition-colors"
        >
          <Coins className="w-5 h-5" />
        </motion.div>
        <span className="text-[11px] font-sans font-medium text-[#734b20] drop-shadow-sm">
          投げ銭
        </span>
      </button>

      {/* 共有ボタン */}
      <button
        id="btn-share-novel"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onClick={onShare}
        className="flex flex-col items-center gap-1 group"
        title="共有"
      >
        <motion.div
          whileTap={{ scale: 0.85 }}
          className="w-11 h-11 rounded-full bg-[#ede3d1]/90 text-[#4c392c] border border-[#cfbdab] flex items-center justify-center group-hover:bg-[#e4d6c0] shadow-md transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </motion.div>
        <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
          共有
        </span>
      </button>
    </motion.aside>
  );
}
