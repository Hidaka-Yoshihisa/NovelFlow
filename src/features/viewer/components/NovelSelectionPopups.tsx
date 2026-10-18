// src/features/viewer/components/NovelSelectionPopups.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, Sparkles } from 'lucide-react';
import type { PhraseLike, NovelWithDetails } from '@/types/database';

interface NovelSelectionPopupsProps {
  currentNovel: NovelWithDetails;
  selectionPopup: { text: string; x: number; y: number } | null;
  onCloseSelectionPopup: () => void;
  onLikeCurrentSelection: (e: React.MouseEvent) => void;

  activeLikedPhrasePopup: { item: PhraseLike; x: number; y: number } | null;
  onCloseActiveLikedPhrasePopup: () => void;
  onCopyQuote: (phrase: string) => void;
  onRemoveLikedPhrase: (id: string) => void;

  selectedSentenceForLike: string | null;
  onCloseSentenceModal: () => void;
  onConfirmSentenceLike: (sentence: string) => void;

  doubleTapHeart: { id: number; x: number; y: number } | null;
}

export function NovelSelectionPopups({
  currentNovel,
  selectionPopup,
  onCloseSelectionPopup,
  onLikeCurrentSelection,
  activeLikedPhrasePopup,
  onCloseActiveLikedPhrasePopup,
  onCopyQuote,
  onRemoveLikedPhrase,
  selectedSentenceForLike,
  onCloseSentenceModal,
  onConfirmSentenceLike,
  doubleTapHeart,
}: NovelSelectionPopupsProps) {
  return (
    <>
      {/* 選択テキストへのフレーズいいねフローティングアクション */}
      <AnimatePresence>
        {selectionPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-50 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b120a]/95 text-[#fbf6ec] shadow-[0_10px_35px_rgba(0,0,0,0.5)] border border-[#a88a68]/45 backdrop-blur-md"
            style={{
              left: `${Math.min(Math.max(selectionPopup.x, 110), window.innerWidth - 110)}px`,
              top: `${selectionPopup.y}px`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onLikeCurrentSelection}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 transition-colors py-0.5 px-2 rounded-full hover:bg-white/10 active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>フレーズいいね</span>
              <span className="text-[10px] text-[#c4b5a0] bg-black/40 px-1.5 py-0.2 rounded-full font-sans">
                {selectionPopup.text.length}字
              </span>
            </button>
            <div className="w-px h-3 bg-white/20" />
            <button
              onClick={onCloseSelectionPopup}
              className="text-neutral-400 hover:text-white p-1 rounded-full text-xs"
              title="閉じる"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* いいね済みフレーズタップ時の詳細・解除ポップアップ */}
      <AnimatePresence>
        {activeLikedPhrasePopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="fixed z-50 -translate-x-1/2 bg-[#19110a]/95 border border-[#523c28] text-[#f7f2ea] p-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs select-none max-w-xs w-[85vw]"
            style={{
              left: `${Math.min(Math.max(activeLikedPhrasePopup.x, 120), window.innerWidth - 120)}px`,
              top: `${activeLikedPhrasePopup.y}px`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-1 text-rose-400 font-bold mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>いいねしたフレーズ</span>
              </span>
              <button
                onClick={onCloseActiveLikedPhrasePopup}
                className="text-neutral-400 hover:text-white p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-[#d4c3b0] italic mb-2 line-clamp-2 bg-[#261a10] p-1.5 rounded-lg border border-[#3d2c1c]">
              「{activeLikedPhrasePopup.item.phrase}」
            </p>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#2d1e13]">
              <button
                onClick={() => onCopyQuote(activeLikedPhrasePopup.item.phrase)}
                className="px-2 py-1 rounded bg-[#2e1f14] hover:bg-[#3d2a1c] text-[#d6b998] text-[11px]"
              >
                引用コピー
              </button>
              <button
                onClick={() => onRemoveLikedPhrase(activeLikedPhrasePopup.item.id)}
                className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-[11px] border border-rose-800/40"
              >
                解除
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 文タップモードでの確認カード */}
      <AnimatePresence>
        {selectedSentenceForLike && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90vw] p-4 rounded-2xl bg-[#17100b]/95 border border-[#523b28] shadow-2xl text-[#f5ebd9] backdrop-blur-md"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>この文にいいねしますか？</span>
            </div>
            <p className="text-xs italic text-[#d4c3b0] mb-3 line-clamp-3 bg-[#241a12] p-2.5 rounded-xl border border-[#3b2c1f]">
              「{selectedSentenceForLike}」
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCloseSentenceModal}
                className="px-3 py-1.5 rounded-xl text-xs text-[#a3917f] hover:text-[#f5ebd9] hover:bg-white/5"
              >
                キャンセル
              </button>
              <button
                onClick={() => onConfirmSentenceLike(selectedSentenceForLike)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-rose-900/30"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>いいねする</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ダブルタップハートアニメーション演出 */}
      <AnimatePresence>
        {doubleTapHeart && (
          <motion.div
            key={doubleTapHeart.id}
            initial={{ scale: 0.3, opacity: 0, y: 0 }}
            animate={{ scale: [0.3, 1.3, 1], opacity: [0, 1, 0.9], y: -20 }}
            exit={{ scale: 1.4, opacity: 0, y: -40 }}
            transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
            className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center drop-shadow-[0_10px_20px_rgba(225,29,72,0.5)]"
            style={{ left: doubleTapHeart.x, top: doubleTapHeart.y }}
          >
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 stroke-[1.5]" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
