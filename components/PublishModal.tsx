// components/PublishModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, BookOpen, Sparkles, Send, Check } from 'lucide-react';
import { publishNovel } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import type { NovelWithDetails } from '@/types/database';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novel: NovelWithDetails) => void;
}

export default function PublishModal({ isOpen, onClose, onSuccess }: PublishModalProps) {
  const { currentUser } = useAuth();
  const [novelType, setNovelType] = useState<'short' | 'regular'>('short');
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState(currentUser?.username || '');
  const [synopsis, setSynopsis] = useState('');
  const [category, setCategory] = useState('ファンタジー');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.username && !authorName) {
      setAuthorName(currentUser.username);
    }
  }, [currentUser]);

  // ページ・章データ
  const [pages, setPages] = useState<Array<{ chapter_title: string; content: string }>>([
    { chapter_title: '第1話', content: '' },
    { chapter_title: '第2話', content: '' },
  ]);

  if (!isOpen) return null;

  const handleAddPage = () => {
    setPages((prev) => [
      ...prev,
      {
        chapter_title: novelType === 'regular' ? `第${prev.length + 1}話` : `ページ${prev.length + 1}`,
        content: '',
      },
    ]);
  };

  const handleRemovePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePageChange = (index: number, field: 'chapter_title' | 'content', val: string) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || pages.every((p) => !p.content.trim())) {
      alert('タイトルと本文を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await publishNovel({
        title: title.trim(),
        authorName: authorName.trim() || 'あなた',
        synopsis: synopsis.trim(),
        type: novelType,
        category,
        pages: pages
          .filter((p) => p.content.trim())
          .map((p, idx) => ({
            page_number: idx + 1,
            chapter_title: p.chapter_title,
            content: p.content.trim(),
          })),
      });

      onSuccess(created);
      onClose();
    } catch (err) {
      console.error('Failed to publish novel:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0c1812] border border-[#1a3828] rounded-2xl max-w-2xl w-full p-6 text-left shadow-2xl my-8 flex flex-col max-h-[90vh]"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between pb-4 border-b border-[#183628]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">新しい作品を投稿する</h2>
              <p className="text-xs text-neutral-400">ショート小説・通常小説をプラットフォームへ公開</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#152e22] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
          {/* 小説種別トグル */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">作品タイプ</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNovelType('short')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  novelType === 'short'
                    ? 'border-emerald-400 bg-emerald-500/10 text-white shadow-sm'
                    : 'border-[#183628] bg-[#08120d]/60 text-neutral-400 hover:border-emerald-500/40'
                }`}
              >
                <div className="text-xs font-bold text-emerald-300 mb-0.5">ショート小説</div>
                <div className="text-[11px] text-neutral-400">
                  スワイプで手軽に読める短編（YouTube Shortsスタイル）
                </div>
              </button>

              <button
                type="button"
                onClick={() => setNovelType('regular')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  novelType === 'regular'
                    ? 'border-teal-400 bg-teal-500/10 text-white shadow-sm'
                    : 'border-[#183628] bg-[#08120d]/60 text-neutral-400 hover:border-teal-500/40'
                }`}
              >
                <div className="text-xs font-bold text-teal-300 mb-0.5">通常の小説（連載・中長編）</div>
                <div className="text-[11px] text-neutral-400">
                  各話ごとの目次や長文が読めるスタンダード形式
                </div>
              </button>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">タイトル *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：真夜中の鍵屋"
                className="w-full bg-[#08120d] border border-[#183628] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">ペンネーム / 作者名</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="例：月読 司"
                className="w-full bg-[#08120d] border border-[#183628] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">ジャンル</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#08120d] border border-[#183628] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="ファンタジー">ファンタジー</option>
                <option value="SF・サイバーパンク">SF・サイバーパンク</option>
                <option value="ミステリー・サスペンス">ミステリー・サスペンス</option>
                <option value="恋愛・ドラマ">恋愛・ドラマ</option>
                <option value="ホラー・怪談">ホラー・怪談</option>
                <option value="コメディ・日常">コメディ・日常</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">あらすじ / キャッチコピー</label>
              <input
                type="text"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="一言で表す読者の引き"
                className="w-full bg-[#08120d] border border-[#183628] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* 本文 / ページ入力エリア */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300">
                {novelType === 'short' ? 'ページごとの本文' : '各話の本文'}
              </label>
              <button
                type="button"
                onClick={handleAddPage}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{novelType === 'short' ? 'ページを追加' : '話を追加'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {pages.map((p, idx) => (
                <div key={idx} className="bg-[#0e1c15] border border-[#183628] rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={p.chapter_title}
                      onChange={(e) => handlePageChange(idx, 'chapter_title', e.target.value)}
                      placeholder={novelType === 'short' ? `ページ ${idx + 1}` : `第 ${idx + 1} 話タイトル`}
                      className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none"
                    />
                    {pages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePage(idx)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                        title="削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    required={idx === 0}
                    value={p.content}
                    onChange={(e) => handlePageChange(idx, 'content', e.target.value)}
                    placeholder="本文を入力してください..."
                    className="w-full bg-[#060e0a] border border-[#163124] rounded-lg p-2.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 font-serif leading-[1.85]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* フッター */}
          <div className="pt-4 border-t border-[#183628] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#1a3828] text-xs text-neutral-300 hover:bg-[#152e22] transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] font-bold text-xs shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '投稿中...' : '作品を投稿する'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
