// components/RegularNovelViewer.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ArrowLeft,
  Sparkles,
  ChevronUp,
  Check,
  X,
  Send,
  Coins,
  List,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { NovelWithDetails } from '@/types/database';
import { recordInteraction } from '@/lib/supabase';

interface RegularNovelViewerProps {
  novel: NovelWithDetails;
  onBack: () => void;
  onOpenPublish?: () => void;
  onToggleLike?: (novelId: string) => Promise<void> | void;
  userLikedIds?: Set<string>;
}

export default function RegularNovelViewer({
  novel,
  onBack,
  onOpenPublish,
  onToggleLike,
  userLikedIds,
}: RegularNovelViewerProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [chapterDirection, setChapterDirection] = useState<1 | -1>(1);

  // UI表示状態
  const [showOverlayMenu, setShowOverlayMenu] = useState(false);
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isLiked, setIsLiked] = useState<boolean>(() => userLikedIds?.has(novel.id) || false);
  const [likeCount, setLikeCount] = useState<number>(novel.likesCount || 0);

  useEffect(() => {
    if (userLikedIds) {
      setIsLiked(userLikedIds.has(novel.id));
    }
  }, [userLikedIds, novel.id]);

  useEffect(() => {
    setLikeCount(novel.likesCount || 0);
  }, [novel.likesCount]);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [showToc, setShowToc] = useState<boolean>(false);

  // 中央ダブルタップ「いいね」のアニメーション表示用ステート
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ id: number; x: number; y: number } | null>(null);

  // 投げ銭モーダル
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(500);

  // コメントシート
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentsList, setCommentsList] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: 'c1', user: 'ミッドナイト読者', text: '展開が熱い！次の話が楽しみです。', time: '15分前' },
    { id: 'c2', user: 'アオイ', text: '描写がとても丁寧で世界観に引き込まれました。', time: '1時間前' },
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // タップ判定用の参照
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<any>(null);
  const touchStartPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const pages = novel.pages || [];
  const currentChapter = pages[currentChapterIndex] || pages[0] || {
    id: 'p-default',
    novel_id: novel.id,
    content: '',
    page_number: 1,
    chapter_title: null,
  };
  const totalChapters = Math.max(pages.length, 1);

  // 1pxプログレスバー用の進捗率
  const progressPercent = ((currentChapterIndex + 1) / totalChapters) * 100;

  // 作品を開いたときのみタイトル＆作者名フェードアウトUIを表示（1秒後にフワッと消滅）
  useEffect(() => {
    setShowIntroCard(true);

    const timer = setTimeout(() => {
      setShowIntroCard(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [novel?.id]);

  // 閲覧履歴記録（話数ごと）
  useEffect(() => {
    if (novel?.id) {
      recordInteraction(novel.id, 'view', currentChapterIndex + 1);
    }
  }, [novel?.id, currentChapterIndex]);

  // トースト自動消去
  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 2500);
    return () => clearTimeout(t);
  }, [activeToast]);

  // コンポーネントアンマウント時のタイマークリア
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
    };
  }, []);

  // 章送り（次話・前話）
  const goToNextChapter = useCallback(() => {
    if (currentChapterIndex < pages.length - 1) {
      setPageDirection(1);
      setChapterDirection(1);
      setCurrentChapterIndex((prev) => prev + 1);
    } else {
      setActiveToast('最新話です。次回更新をお楽しみに！');
    }
  }, [currentChapterIndex, pages.length]);

  const goToPrevChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      setPageDirection(-1);
      setChapterDirection(-1);
      setCurrentChapterIndex((prev) => prev - 1);
    } else {
      setActiveToast('第1話です');
    }
  }, [currentChapterIndex]);

  // キーボード操作対応
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntroCard || showCommentModal || showTipModal || showToc) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
        goToNextChapter();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevChapter();
      } else if (e.key === 'Escape') {
        setShowOverlayMenu(false);
        setShowToc(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextChapter, goToPrevChapter, showCommentModal, showTipModal, showToc, showIntroCard]);

  // いいね切り替え関数
  const triggerLike = useCallback((forcedState?: boolean) => {
    const nextLiked = forcedState !== undefined ? forcedState : !isLiked;
    if (isLiked === nextLiked) return;

    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    onToggleLike?.(novel.id);
    recordInteraction(novel.id, 'like', currentChapterIndex + 1);
  }, [isLiked, novel.id, currentChapterIndex, onToggleLike]);

  // 画面タップ処理（左1/3・中央1/3・右1/3判定 ＋ 中央ダブルタップでいいね）
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showIntroCard) return;
    touchStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showIntroCard) return;
    const dx = e.clientX - touchStartPos.current.x;
    const dy = e.clientY - touchStartPos.current.y;
    const dt = Date.now() - touchStartPos.current.time;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // ドラッグやスワイプとみなす移動量
    if (distance > 25 || dt > 600) {
      return;
    }

    const screenWidth = window.innerWidth;
    const tapX = e.clientX;
    const leftThird = screenWidth * 0.33;
    const rightThird = screenWidth * 0.67;

    if (tapX < leftThird) {
      // 左1/3：前話
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      goToPrevChapter();
    } else if (tapX > rightThird) {
      // 右1/3：次話
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      goToNextChapter();
    } else {
      // 中央1/3：ダブルタップ検知（ダブルタップなら「いいね」、シングルタップならメニュー開閉）
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      if (timeSinceLastTap > 0 && timeSinceLastTap < 400) {
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        lastTapTimeRef.current = 0;

        // 中央ハートポップアップアニメーションを表示
        setDoubleTapHeart({ id: now, x: e.clientX, y: e.clientY });
        setTimeout(() => setDoubleTapHeart(null), 1000);

        if (!isLiked) {
          triggerLike(true);
        }
      } else {
        lastTapTimeRef.current = now;
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
        }
        singleTapTimerRef.current = setTimeout(() => {
          setShowOverlayMenu((prev) => !prev);
          singleTapTimerRef.current = null;
          lastTapTimeRef.current = 0;
        }, 380);
      }
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);
    setActiveToast(nextBookmarked ? 'しおりを挟みました' : 'しおりを解除しました');
    recordInteraction(novel.id, 'bookmark', currentChapterIndex + 1);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setActiveToast('作品のリンクをコピーしました');
        return;
      } catch {}
    }
    setActiveToast('作品をシェアしました');
  };

  const handleSendTip = () => {
    setShowTipModal(false);
    setActiveToast(`作家に ¥${selectedTipAmount.toLocaleString()} の投げ銭を贈りました！`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setCommentsList([
      {
        id: `c-${Date.now()}`,
        user: 'あなた',
        text: newCommentText.trim(),
        time: 'たった今',
      },
      ...commentsList,
    ]);
    setNewCommentText('');
  };

  // 行間を厳密に 1.8 ～ 2.0 に設定したスタイルクラス
  const fontSizes = {
    sm: 'text-[15px] sm:text-[16px] leading-[1.85]',
    base: 'text-[17px] sm:text-[19px] leading-[1.9]',
    lg: 'text-[19px] sm:text-[22px] leading-[1.95]',
  };

  return (
    <div
      id="regular-novel-viewer-container"
      className="relative w-screen h-screen parchment-texture parchment-vignette text-[#26201a] overflow-hidden select-none font-serif touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* 本の中央のわずかな背表紙折り目シャドウ（見開き感の演出） */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-20 book-crease-shadow pointer-events-none z-0" />

      {/* 垂直スワイプ（章・話切り替え） */}
      <motion.div
        key={`chapter-${currentChapter.id || currentChapterIndex}`}
        className="w-full h-full relative z-10"
        initial={{ opacity: 0, y: chapterDirection === 1 ? 50 : -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: chapterDirection === 1 ? -50 : 50 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y < -70 && info.velocity.y < 200) {
            goToNextChapter();
          } else if (info.offset.y > 70 && info.velocity.y > -200) {
            goToPrevChapter();
          }
        }}
      >
        {/* ページめくり（水平スライド）本文 */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-6 sm:px-14 md:px-20 max-w-3xl mx-auto">
          <AnimatePresence mode="wait" custom={pageDirection}>
            <motion.div
              key={`chapter-${currentChapter.id || currentChapterIndex}-content`}
              custom={pageDirection}
              initial={{
                opacity: 0,
                x: pageDirection === 1 ? 40 : -40,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                x: pageDirection === 1 ? -40 : 40,
                scale: 0.98,
              }}
              transition={{
                duration: 0.26,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="w-full flex flex-col justify-center max-w-2xl text-left tracking-wide"
            >
              {/* 章タイトルバッジ */}
              {currentChapter.chapter_title && (
                <div className="mb-4 text-[#8b6f4e] text-xs sm:text-sm font-sans font-semibold tracking-wider uppercase">
                  {currentChapter.chapter_title}
                </div>
              )}

              {/* 本文：行間を1.8〜2.0に調整した文字だけのミニマルUI（羊皮紙に刻まれた墨インク色） */}
              <div
                className={`text-[#221c17] whitespace-pre-wrap font-normal ${fontSizes[fontSize]} transition-all duration-200 antialiased max-h-[72vh] overflow-y-auto pr-2 scrollbar-none`}
                style={{
                  textRendering: 'optimizeLegibility',
                  letterSpacing: '0.04em',
                }}
              >
                {currentChapter.content}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* フェードアウトUI（タイトル＆作者名：新しく作品を開いたときのみ1秒でフェードアウト） */}
        <AnimatePresence>
          {showIntroCard && (
            <motion.div
              id="regular-intro-overlay"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#f7f3e8]/85 backdrop-blur-[2px] pointer-events-auto px-6 cursor-default select-none"
            >
              <div className="max-w-md text-center">
                <span className="inline-block text-[11px] font-sans tracking-[0.25em] text-[#8b6f4e] uppercase mb-3 border border-[#c4a984]/50 px-3 py-1 rounded-full bg-[#ede4d3]/60">
                  NOVEL • {novel.category || '通常小説'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-[#1e1711] mb-2 leading-relaxed">
                  {novel.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#8b6f4e] font-sans tracking-wide mb-2">
                  {currentChapter.chapter_title || `第 ${currentChapterIndex + 1} 話`}
                </p>
                <p className="text-sm sm:text-base text-[#5c4936] font-sans tracking-wide">
                  著：{novel.author?.username || '作者不詳'}
                </p>
                {novel.synopsis && (
                  <p className="mt-4 text-xs sm:text-sm text-[#73604e] line-clamp-2 italic max-w-xs mx-auto">
                    {novel.synopsis}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 次話案内 */}
        {currentChapterIndex < pages.length - 1 && !showIntroCard && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none text-[#8b7355] font-sans text-xs tracking-wider"
          >
            <ChevronUp className="w-4 h-4 animate-bounce text-[#735c41]" />
            <span>上にスワイプで次の話へ</span>
          </motion.div>
        )}
      </motion.div>

      {/* 中央ダブルタップ時のビッグハートアニメーション */}
      <AnimatePresence>
        {doubleTapHeart && (
          <motion.div
            key={doubleTapHeart.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.3, 1.4, 1.1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 text-rose-600 drop-shadow-[0_4px_20px_rgba(225,29,72,0.4)]"
            style={{ left: doubleTapHeart.x, top: doubleTapHeart.y }}
          >
            <Heart className="w-24 h-24 fill-current" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 画面端のタップ可能エリア案内 */}
      <div className="absolute inset-0 pointer-events-none flex z-20">
        <div className="w-1/3 h-full hover:bg-black/[0.01] transition-colors" />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full hover:bg-black/[0.01] transition-colors" />
      </div>

      {/* トグル式メニュー（画面中央タップで現れるオーバーレイ） */}
      <AnimatePresence>
        {showOverlayMenu && (
          <>
            {/* 上部ヘッダー */}
            <motion.header
              id="regular-overlay-header"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-[#e8ddc9]/95 via-[#ede3d1]/80 to-transparent backdrop-blur-[2px] border-b border-[#d8c7ad]/40"
            >
              <div className="flex items-center gap-3">
                <button
                  id="btn-back"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                  }}
                  className="p-2 rounded-full bg-[#dacaba] hover:bg-[#cfbdab] text-[#2c221a] transition-colors shadow-sm"
                  title="一覧へ戻る"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-semibold text-[#201812] tracking-wide truncate max-w-[180px] sm:max-w-xs">
                      {novel.title}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#dacaba] text-[#4f3d2f] font-sans border border-[#c5b19b]">
                      {novel.category || '通常小説'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6e5a48] font-sans">
                    {novel.author?.username || '作者'} • {currentChapter.chapter_title || `第 ${currentChapterIndex + 1} 話`}
                  </p>
                </div>
              </div>

              {/* 目次・フォントサイズ調整 */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {/* 目次ボタン */}
                <button
                  onClick={() => setShowToc(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#8b6f4e] text-white hover:bg-[#785e40] text-xs font-sans transition-all shadow-sm"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>目次</span>
                </button>

                <div className="flex items-center bg-[#dacaba] rounded-full p-1 border border-[#c7b5a1]">
                  <button
                    onClick={() => setFontSize('sm')}
                    className={`px-2 py-1 text-xs rounded-full font-sans transition-all ${
                      fontSize === 'sm' ? 'bg-[#3b2d21] text-[#f7f3e8] font-bold shadow-sm' : 'text-[#5e4b3c] hover:text-[#2a1f16]'
                    }`}
                  >
                    小
                  </button>
                  <button
                    onClick={() => setFontSize('base')}
                    className={`px-2 py-1 text-xs rounded-full font-sans transition-all ${
                      fontSize === 'base' ? 'bg-[#3b2d21] text-[#f7f3e8] font-bold shadow-sm' : 'text-[#5e4b3c] hover:text-[#2a1f16]'
                    }`}
                  >
                    中
                  </button>
                  <button
                    onClick={() => setFontSize('lg')}
                    className={`px-2 py-1 text-xs rounded-full font-sans transition-all ${
                      fontSize === 'lg' ? 'bg-[#3b2d21] text-[#f7f3e8] font-bold shadow-sm' : 'text-[#5e4b3c] hover:text-[#2a1f16]'
                    }`}
                  >
                    大
                  </button>
                </div>
              </div>
            </motion.header>

            {/* 右下アクションメニュー */}
            <motion.aside
              id="regular-action-sidebar"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 bottom-14 z-40 flex flex-col items-center gap-4"
            >
              {/* 作者アイコン */}
              <div
                className="relative cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(`${novel.author?.username || '作者'} の作品`);
                }}
              >
                <div className="w-11 h-11 rounded-full border-2 border-[#b89f82] overflow-hidden bg-[#e0d2bf] shadow-md">
                  {novel.author?.avatar_url ? (
                    <img
                      src={novel.author.avatar_url}
                      alt={novel.author.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-sans font-bold text-[#443325]">
                      {novel.author?.username?.[0] || '著'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#a3513a] text-white rounded-full p-0.5 shadow">
                  <Sparkles className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* いいねボタン */}
              <button
                id="btn-like-regular"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerLike();
                }}
                className="flex flex-col items-center gap-1 group"
                title="いいね（中央2回タップでも可能）"
              >
                <motion.div
                  whileTap={{ scale: 0.75 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors ${
                    isLiked
                      ? 'bg-rose-50 text-rose-600 border border-rose-300'
                      : 'bg-[#ede3d1]/90 text-[#4c392c] border border-[#cfbdab] group-hover:bg-[#e4d6c0]'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isLiked ? 'fill-current scale-110' : ''
                    }`}
                  />
                </motion.div>
                <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
                  {likeCount}
                </span>
              </button>

              {/* コメントボタン */}
              <button
                id="btn-comment-regular"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCommentModal(true);
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
                  {commentsList.length}
                </span>
              </button>

              {/* 目次クイックボタン */}
              <button
                id="btn-toc-regular"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowToc(true);
                }}
                className="flex flex-col items-center gap-1 group"
                title="目次"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="w-11 h-11 rounded-full bg-[#ede3d1]/90 text-[#4c392c] border border-[#cfbdab] flex items-center justify-center group-hover:bg-[#e4d6c0] shadow-md transition-colors"
                >
                  <List className="w-5 h-5 text-[#8b6f4e]" />
                </motion.div>
                <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
                  目次
                </span>
              </button>

              {/* しおりボタン */}
              <button
                id="btn-bookmark-regular"
                onClick={handleToggleBookmark}
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
                    className={`w-5 h-5 ${
                      isBookmarked ? 'fill-current' : ''
                    }`}
                  />
                </motion.div>
                <span className="text-[11px] font-sans font-medium text-[#4a392b] drop-shadow-sm">
                  保存
                </span>
              </button>

              {/* 投げ銭（応援機能）ボタン */}
              <button
                id="btn-tip-regular"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTipModal(true);
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
                id="btn-share-regular"
                onClick={handleShare}
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

            {/* 話数表示 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-5 left-5 z-40 font-sans text-xs text-[#5c4936] tracking-wider bg-[#ede3d1]/90 backdrop-blur-sm px-3 py-1 rounded-full border border-[#d8c7ad] shadow-sm"
            >
              話数 {currentChapterIndex + 1} / {totalChapters}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 1pxプログレスバー：画面最下部に小説の進捗を極細ラインで常に表示 */}
      <div
        id="regular-1px-progress-track"
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d9c9b4] z-50 overflow-hidden"
      >
        <motion.div
          id="regular-1px-progress-bar"
          className="h-full bg-[#a05b38] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 目次ドロワー */}
      <AnimatePresence>
        {showToc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowToc(false)}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end font-sans"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-80 bg-[#f7f2e7] h-full border-l border-[#d8c8b4] p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#d8c8b4]">
                <h3 className="text-sm font-bold text-[#2a2018] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#8b6f4e]" />
                  <span>各話一覧・目次</span>
                </h3>
                <button
                  onClick={() => setShowToc(false)}
                  className="p-1 text-[#6b5847] hover:text-[#201812]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-2">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentChapterIndex(idx);
                      setShowToc(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between ${
                      idx === currentChapterIndex
                        ? 'bg-[#ede2d1] text-[#332215] border border-[#bfa68a] font-semibold shadow-sm'
                        : 'bg-[#f0e8dc]/60 text-[#4d3d2f] hover:bg-[#ede3d1] border border-transparent'
                    }`}
                  >
                    <span className="truncate">
                      {p.chapter_title || `第 ${idx + 1} 話`}
                    </span>
                    <span className="text-[10px] text-[#85705d]">#{idx + 1}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 投げ銭モーダル */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTipModal(false)}
            className="absolute inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#fcfaf5] border border-[#d8c8b4] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-[#faecd6] text-[#9c6328] mx-auto flex items-center justify-center mb-3">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#2a2018] mb-1">作家への応援投げ銭</h3>
              <p className="text-xs text-[#6e5d4d] mb-5">
                『{novel.title}』の作者（{novel.author?.username}）へチップを贈ります。
              </p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {[100, 300, 500, 1000, 2000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedTipAmount(amount)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      selectedTipAmount === amount
                        ? 'border-[#8b6f4e] bg-[#f2e7d5] text-[#3d2c1f]'
                        : 'border-[#dfd1bf] bg-[#f8f4ec] text-[#524133] hover:border-[#b89d81]'
                    }`}
                  >
                    ¥{amount.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTipModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#d8c8b4] text-xs text-[#524133] hover:bg-[#ede2d1] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSendTip}
                  className="flex-1 py-2.5 rounded-xl bg-[#8b6f4e] text-white font-bold text-xs shadow-md hover:bg-[#785e40] transition-all"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommentModal(false)}
            className="absolute inset-0 z-50 bg-black/45 backdrop-blur-sm flex flex-col justify-end font-sans"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#fcfaf5] border-t border-[#d8c8b4] rounded-t-3xl p-5 max-h-[70vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#d8c8b4]">
                <h3 className="text-sm font-bold text-[#2a2018] flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#8b6f4e]" />
                  <span>感想コメント ({commentsList.length})</span>
                </h3>
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="p-1 rounded-full text-[#6b5847] hover:text-[#201812]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3">
                {commentsList.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#f5ede0] border border-[#decbb7]">
                    <div className="flex items-center justify-between text-xs text-[#6e5d4d] mb-1">
                      <span className="font-semibold text-[#2b2016]">{c.user}</span>
                      <span className="text-[10px]">{c.time}</span>
                    </div>
                    <p className="text-xs text-[#423326] leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="pt-3 border-t border-[#d8c8b4] flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="作者に感想を届ける..."
                  className="flex-1 bg-[#f5ede0] border border-[#d8c8b4] rounded-xl px-4 py-2 text-xs text-[#201812] placeholder-[#8a7664] focus:outline-none focus:border-[#8b6f4e]"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="p-2 rounded-xl bg-[#8b6f4e] text-white disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* トースト */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2e231b]/95 border border-[#4d3a2e] text-[#f7f3e8] text-xs font-sans px-4 py-2 rounded-full shadow-2xl backdrop-blur-md pointer-events-none flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
