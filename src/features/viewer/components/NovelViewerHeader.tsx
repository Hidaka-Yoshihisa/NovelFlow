// src/features/viewer/components/NovelViewerHeader.tsx
import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { NovelWithDetails } from '@/types/database';

interface NovelViewerHeaderProps {
  currentNovel: NovelWithDetails;
  fontSize: 'sm' | 'base' | 'lg';
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
  isSentenceMode: boolean;
  setIsSentenceMode: React.Dispatch<React.SetStateAction<boolean>>;
  onBack?: () => void;
  onOpenPublish?: () => void;
}

export function NovelViewerHeader({
  currentNovel,
  fontSize,
  setFontSize,
  isSentenceMode,
  setIsSentenceMode,
  onBack,
  onOpenPublish,
}: NovelViewerHeaderProps) {
  return (
    <motion.header
      id="novel-overlay-header"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-[#e8ddc9]/95 via-[#ede3d1]/80 to-transparent backdrop-blur-[2px] border-b border-[#d8c7ad]/40"
    >
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            id="btn-back"
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="p-2 rounded-full bg-[#dacaba] hover:bg-[#cfbdab] text-[#2c221a] transition-colors shadow-sm"
            title="ホーム・一覧へ戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-[#201812] tracking-wide truncate max-w-[180px] sm:max-w-xs">
              {currentNovel.title}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#dacaba] text-[#4f3d2f] font-sans border border-[#c5b19b]">
              {currentNovel.category || 'ショート'}
            </span>
          </div>
          <p className="text-xs text-[#6e5a48] font-sans">
            {currentNovel.author?.username || '作者'}
          </p>
        </div>
      </div>

      {/* フォントサイズ調整 & 投稿ボタン */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {onOpenPublish && (
          <button
            onClick={onOpenPublish}
            className="px-3 py-1 rounded-full bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-sans transition-colors shadow-sm"
          >
            投稿
          </button>
        )}
        <button
          onClick={() => setIsSentenceMode((prev) => !prev)}
          className={`px-2.5 py-1 rounded-full text-xs font-sans transition-all shadow-xs border flex items-center gap-1 ${
            isSentenceMode
              ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/20 font-bold'
              : 'bg-[#dacaba] text-[#5e4b3c] border-[#c7b5a1] hover:text-[#2a1f16]'
          }`}
          title="文をタップして直接いいねするモード"
        >
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>{isSentenceMode ? '文選択中' : '文選択'}</span>
        </button>
        <div className="flex items-center bg-[#dacaba] rounded-full p-1 border border-[#c7b5a1]">
          <button
            onClick={() => setFontSize('sm')}
            className={`px-2 py-1 text-xs rounded-full font-sans transition-all ${
              fontSize === 'sm'
                ? 'bg-[#3b2d21] text-[#f7f3e8] font-bold shadow-sm'
                : 'text-[#5e4b3c] hover:text-[#2a1f16]'
            }`}
          >
            小
          </button>
          <button
            onClick={() => setFontSize('base')}
            className={`px-2 py-1 text-xs rounded-full font-sans transition-all ${
              fontSize === 'base'
                ? 'bg-[#3b2d21] text-[#f7f3e8] font-bold shadow-sm'
                : 'text-[#5e4b3c] hover:text-[#2a1f16]'
            }`}
          >
            中
          </button>
          <button
            onClick={() => setFontSize('lg')}
            className={`px-2 py-1 text-xs rounded-full font-sans transition-all ${
              fontSize === 'lg'
                ? 'bg-[#3b2d21] text-[#f7f3e8] font-bold shadow-sm'
                : 'text-[#5e4b3c] hover:text-[#2a1f16]'
            }`}
          >
            大
          </button>
        </div>
      </div>
    </motion.header>
  );
}
