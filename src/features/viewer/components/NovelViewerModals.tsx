// src/features/viewer/components/NovelViewerModals.tsx
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, X, Send, Check } from 'lucide-react';
import type { NovelWithDetails, PhraseLike } from '@/types/database';
import PhraseLikesModal from '@/components/PhraseLikesModal';

interface NovelViewerModalsProps {
  currentNovel: NovelWithDetails;
  currentPageNumber: number;

  // 投げ銭モーダル
  showTipModal: boolean;
  onCloseTipModal: () => void;
  selectedTipAmount: number;
  setSelectedTipAmount: (amount: number) => void;
  onSendTip: () => void;

  // コメントシート
  showCommentModal: boolean;
  onCloseCommentModal: () => void;
  currentComments: Array<{ id: string; user: string; text: string; time: string }>;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  onAddComment: (e: React.FormEvent) => void;

  // フレーズいいね一覧モーダル
  showPhraseLikesModal: boolean;
  onClosePhraseLikesModal: () => void;
  currentNovelPhraseLikes: PhraseLike[];
  onSelectPhrasePage: (page: number) => void;
  onRemovePhraseLike?: (id: string) => void;

  // トースト
  activeToast: string | null;
}

export function NovelViewerModals({
  currentNovel,
  currentPageNumber,
  showTipModal,
  onCloseTipModal,
  selectedTipAmount,
  setSelectedTipAmount,
  onSendTip,
  showCommentModal,
  onCloseCommentModal,
  currentComments,
  newCommentText,
  setNewCommentText,
  onAddComment,
  showPhraseLikesModal,
  onClosePhraseLikesModal,
  currentNovelPhraseLikes,
  onSelectPhrasePage,
  onRemovePhraseLike,
  activeToast,
}: NovelViewerModalsProps) {
  return (
    <>
      {/* 投げ銭モーダル */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseTipModal}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="bg-[#0c1812] border border-emerald-500/30 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">作家への応援投げ銭</h3>
              <p className="text-xs text-neutral-400 mb-5">
                『{currentNovel.title}』の作者（{currentNovel.author?.username}）へチップを贈ります。
              </p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {[100, 300, 500, 1000, 2000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedTipAmount(amount)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectedTipAmount === amount
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-[#183628] bg-[#08120d] text-neutral-300 hover:border-emerald-500/40'
                    }`}
                  >
                    ¥{amount.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onCloseTipModal}
                  className="flex-1 py-2.5 rounded-xl border border-[#1a3828] text-xs text-neutral-300 hover:bg-[#152e22] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={onSendTip}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] font-bold text-xs shadow-lg hover:brightness-110 transition-all"
                >
                  ¥{selectedTipAmount.toLocaleString()} を贈る
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* コメントモーダル */}
      <AnimatePresence>
        {showCommentModal && (
          <motion.div
            id="novel-comments-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseCommentModal}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end font-sans"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="bg-[#121216] border-t border-neutral-800 rounded-t-2xl p-5 max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-sm font-semibold text-white">
                  コメント ({currentComments.length})
                </h3>
                <button
                  onClick={onCloseCommentModal}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                {currentComments.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-6">
                    まだコメントはありません。最初の感想を残してみましょう！
                  </p>
                ) : (
                  currentComments.map((cmt) => (
                    <div key={cmt.id} className="text-left text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-neutral-300">{cmt.user}</span>
                        <span className="text-[10px] text-neutral-500">{cmt.time}</span>
                      </div>
                      <p className="text-neutral-200 leading-relaxed">{cmt.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={onAddComment} className="pt-3 border-t border-neutral-800 flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="感想や考察をひとこと..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="p-2 bg-white text-black rounded-full disabled:opacity-30 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* フレーズいいね一覧ドロワー */}
      <PhraseLikesModal
        isOpen={showPhraseLikesModal}
        onClose={onClosePhraseLikesModal}
        novelTitle={currentNovel.title}
        authorName={currentNovel.author?.username}
        phraseLikes={currentNovelPhraseLikes}
        currentPageNumber={currentPageNumber}
        onSelectPage={onSelectPhrasePage}
        onRemovePhraseLike={onRemovePhraseLike}
      />

      {/* 通知トースト */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 border border-neutral-700/70 text-white text-xs font-sans px-4 py-2 rounded-full shadow-2xl backdrop-blur-md pointer-events-none flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
