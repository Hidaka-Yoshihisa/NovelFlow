import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Copy, Check, ExternalLink, Trash2, Quote, Sparkles } from 'lucide-react';
import type { PhraseLike } from '@/types/database';

interface PhraseLikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  novelTitle: string;
  authorName?: string;
  phraseLikes: PhraseLike[];
  onSelectPage?: (pageNumber: number) => void;
  onRemovePhraseLike: (id: string) => void;
  currentPageNumber?: number;
}

export default function PhraseLikesModal({
  isOpen,
  onClose,
  novelTitle,
  authorName,
  phraseLikes,
  onSelectPage,
  onRemovePhraseLike,
  currentPageNumber,
}: PhraseLikesModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (item: PhraseLike) => {
    const textToCopy = `『${item.phrase}』\n—— ${item.authorName || authorName || '作者'}「${item.novelTitle || novelTitle}」より`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans select-none"
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-[#140e0a] border border-[#3d2a1d] rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-[#f3ece0]"
      >
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-[#2d1f15] bg-[#1a120c] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-full bg-rose-500/20 text-rose-400">
              <Quote className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-wide text-[#f7f2ea] flex items-center gap-2">
                <span>フレーズいいね一覧</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-500/20 text-rose-300 font-sans border border-rose-500/30">
                  {phraseLikes.length}件
                </span>
              </h3>
              <p className="text-[11px] text-[#a89582] truncate max-w-[240px]">
                {novelTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#a89582] hover:text-[#f7f2ea] hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ガイドミニバナー */}
        <div className="px-5 py-2.5 bg-[#211710] border-b border-[#2d1f15] text-[11px] text-[#baa48f] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>本文の文字を選択またはタップでいいねできます</span>
          </span>
        </div>

        {/* フレーズ一覧 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {phraseLikes.length === 0 ? (
            <div className="py-12 px-6 text-center rounded-2xl bg-[#18110b] border border-[#2b1e15]">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400/60 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
                <Heart className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#e8ded0] mb-1 font-serif">
                心に響いたフレーズを記録しよう
              </h4>
              <p className="text-xs text-[#a08d7b] leading-relaxed max-w-xs mx-auto">
                作品を読んでいるとき、お気に入りの1文や言葉を選択すると「フレーズいいね」ができます。
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#baa48f] bg-[#241a12] px-3 py-1.5 rounded-full border border-[#3b2a1c]">
                <span>💡 画面中央タップ ➔「文選択モード」で1タップいいねも可能</span>
              </div>
            </div>
          ) : (
            phraseLikes.map((item) => {
              const isCurrent = currentPageNumber === item.pageNumber;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-[#221710] border-amber-600/40 shadow-sm'
                      : 'bg-[#18110b] border-[#2b1e15] hover:border-[#3d2c1e]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-sans font-semibold bg-[#2e1f14] text-[#d6b998] border border-[#443020]">
                        {item.chapterTitle || `${item.pageNumber}ページ目`}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-amber-400 font-sans font-bold flex items-center gap-1">
                          ● 現在閲覧中
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#8c7866] font-sans">
                      {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* 引用文 */}
                  <blockquote className="text-sm text-[#f7f2ea] font-serif leading-relaxed pl-3 border-l-2 border-rose-400/80 my-2.5 whitespace-pre-wrap">
                    {item.phrase}
                  </blockquote>

                  {/* アクションボタン */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#26190f] text-xs">
                    {onSelectPage && (
                      <button
                        onClick={() => {
                          onSelectPage(item.pageNumber);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-sans text-amber-300/90 hover:text-amber-200 hover:underline py-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>このページへジャンプ</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleCopy(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#271b12] hover:bg-[#342419] text-[#c9b7a4] hover:text-[#f3ece0] text-[11px] font-sans transition-colors border border-[#3d2a1d]"
                        title="引用文をコピー"
                      >
                        {copiedId === item.id ? (
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

                      <button
                        onClick={() => onRemovePhraseLike(item.id)}
                        className="p-1 rounded-lg text-[#877462] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="フレーズいいねを解除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
