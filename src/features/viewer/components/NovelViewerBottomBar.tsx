// src/features/viewer/components/NovelViewerBottomBar.tsx
import React from 'react';
import { motion } from 'motion/react';
import { ChevronUp } from 'lucide-react';

interface NovelViewerBottomBarProps {
  currentPageIndex: number;
  totalPages: number;
  currentNovelIndex: number;
  totalNovels: number;
  isLastPage: boolean;
  showOverlayMenu: boolean;
  progressPercent: number;
}

export function NovelViewerBottomBar({
  currentPageIndex,
  totalPages,
  currentNovelIndex,
  totalNovels,
  isLastPage,
  showOverlayMenu,
  progressPercent,
}: NovelViewerBottomBarProps) {
  return (
    <>
      {showOverlayMenu && (
        <>
          {/* 中央タップ時にのみ表示されるタップ操作ガイド */}
          <motion.div
            id="novel-tap-guide"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-[10px] sm:text-[11px] font-sans tracking-wider text-[#6e5538] bg-[#ede3d1]/95 backdrop-blur-sm px-3.5 py-1 rounded-full border border-[#d8c7ad]/80 shadow-sm whitespace-nowrap max-w-[92vw] truncate select-none"
          >
            タップ：左 ◀ | 中央 2回 ❤ / 1回 メニュー | 次へ ▶
          </motion.div>

          {/* ページ番号表示 */}
          <motion.div
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-5 left-5 z-40 font-sans text-xs text-[#5c4936] tracking-wider bg-[#ede3d1]/90 backdrop-blur-sm px-3 py-1 rounded-full border border-[#d8c7ad] shadow-sm select-none"
          >
            Page {currentPageIndex + 1} / {totalPages} • ショート {currentNovelIndex + 1}/{totalNovels}
          </motion.div>

          {/* 最終ページの「上にスワイプで次の作品へ」ガイド */}
          {isLastPage && (
            <motion.div
              id="novel-swipe-guide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 pointer-events-none text-[#6e5538] font-sans text-[11px] tracking-wider bg-[#ede3d1]/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-[#d8c7ad]/80 shadow-sm select-none"
            >
              <ChevronUp className="w-4 h-4 animate-bounce text-[#735c41]" />
              <span>上にスワイプして次のショート作品へ</span>
            </motion.div>
          )}
        </>
      )}

      {/* 1pxプログレスバー：画面最下部に小説の進捗を極細ラインで常に表示 */}
      <div
        id="novel-1px-progress-track"
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d9c9b4] z-50 overflow-hidden"
      >
        <motion.div
          id="novel-1px-progress-bar"
          className="h-full bg-[#a05b38] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </>
  );
}
