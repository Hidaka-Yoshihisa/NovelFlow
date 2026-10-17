// components/NovelViewer.tsx
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
  Quote,
} from 'lucide-react';
import type { NovelWithDetails, PhraseLike } from '@/types/database';
import { recordInteraction } from '@/lib/supabase';
import PhraseLikesModal from './PhraseLikesModal';

interface NovelViewerProps {
  novels: NovelWithDetails[];
  initialNovelIndex?: number;
  initialPageIndex?: number;
  onBack?: () => void;
  onOpenPublish?: () => void;
  onToggleLike?: (novelId: string) => Promise<void> | void;
  userLikedIds?: Set<string>;
  userBookmarkedIds?: Set<string>;
  onToggleBookmark?: (novelId: string) => void;
  phraseLikes?: PhraseLike[];
  onAddPhraseLike?: (phraseData: Omit<PhraseLike, 'id' | 'createdAt'>) => Promise<void> | void;
  onRemovePhraseLike?: (id: string) => Promise<void> | void;
}

export default function NovelViewer({
  novels,
  initialNovelIndex = 0,
  initialPageIndex = 0,
  onBack,
  onOpenPublish,
  onToggleLike,
  userLikedIds,
  userBookmarkedIds,
  onToggleBookmark,
  phraseLikes = [],
  onAddPhraseLike,
  onRemovePhraseLike,
}: NovelViewerProps) {
  const [currentNovelIndex, setCurrentNovelIndex] = useState(initialNovelIndex);
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [novelDirection, setNovelDirection] = useState<1 | -1>(1);

  // UI表示状態
  const [showOverlayMenu, setShowOverlayMenu] = useState(false);
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isLiked, setIsLiked] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (userLikedIds) {
      novels.forEach((n) => {
        if (userLikedIds.has(n.id)) map[n.id] = true;
      });
    }
    return map;
  });
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (userLikedIds) {
      const map: Record<string, boolean> = {};
      novels.forEach((n) => {
        map[n.id] = userLikedIds.has(n.id);
      });
      setIsLiked(map);
    }
  }, [userLikedIds, novels]);

  useEffect(() => {
    const counts: Record<string, number> = {};
    novels.forEach((n) => {
      counts[n.id] = n.likesCount || 0;
    });
    setLikeCounts(counts);
  }, [novels]);
  const [isBookmarked, setIsBookmarked] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    if (userBookmarkedIds) {
      novels.forEach((n) => {
        if (userBookmarkedIds.has(n.id)) map[n.id] = true;
      });
    }
    return map;
  });

  useEffect(() => {
    if (userBookmarkedIds) {
      const map: Record<string, boolean> = {};
      novels.forEach((n) => {
        map[n.id] = userBookmarkedIds.has(n.id);
      });
      setIsBookmarked(map);
    }
  }, [userBookmarkedIds, novels]);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // 中央ダブルタップ「いいね」のアニメーション表示用ステート
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ id: number; x: number; y: number } | null>(null);

  // フレーズいいね関連ステート
  const [showPhraseLikesModal, setShowPhraseLikesModal] = useState(false);
  const [isSentenceMode, setIsSentenceMode] = useState(false); // 文タップ選択モード
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; x: number; y: number } | null>(null);
  const [activeLikedPhrasePopup, setActiveLikedPhrasePopup] = useState<{ item: PhraseLike; x: number; y: number } | null>(null);
  const [selectedSentenceForLike, setSelectedSentenceForLike] = useState<string | null>(null);

  // 投げ銭モーダル
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(300);

  // コメントシート
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentsList, setCommentsList] = useState<Record<string, Array<{ id: string; user: string; text: string; time: string }>>>({
    'short-1': [
      { id: 'c1', user: '読書好きの猫', text: '金木犀の香りの描写が素敵すぎる...', time: '10分前' },
      { id: 'c2', user: 'ミッドナイト', text: '「誰かの記憶になる番」で鳥肌が立ちました。', time: '1時間前' },
    ],
    'short-2': [
      { id: 'c3', user: 'ゆき', text: '秒速1メートルという設定が切なくて美しい。', time: '30分前' },
    ],
  });
  const [newCommentText, setNewCommentText] = useState('');

  // ダブルタップ判定用のタイマーと参照
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<any>(null);
  const touchStartPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const currentNovel = novels[currentNovelIndex] || novels[0];
  const pages = currentNovel?.pages || [];
  const currentPage = pages[currentPageIndex] || { content: '', page_number: 1 };
  const totalPages = Math.max(pages.length, 1);

  // 1pxプログレスバー用の進捗率
  const progressPercent = ((currentPageIndex + 1) / totalPages) * 100;

  // 外部からの初期ページ番号指定の反映
  useEffect(() => {
    if (initialPageIndex !== undefined && initialPageIndex >= 0) {
      setCurrentPageIndex(initialPageIndex);
    }
  }, [initialPageIndex]);

  // ページ・作品切り替え時に選択ポップアップ類を安全にクリア
  useEffect(() => {
    setSelectionPopup(null);
    setActiveLikedPhrasePopup(null);
    setSelectedSentenceForLike(null);
  }, [currentPageIndex, currentNovelIndex]);

  // 作品切り替え時のタイトル＆作者名フェードアウトUI（1秒後にフワッと消滅）
  useEffect(() => {
    setShowIntroCard(true);
    setCurrentPageIndex(0);

    const timer = setTimeout(() => {
      setShowIntroCard(false);
    }, 1000);

    if (currentNovel?.id) {
      recordInteraction(currentNovel.id, 'view', 1);
    }

    return () => clearTimeout(timer);
  }, [currentNovelIndex, currentNovel?.id]);

  // トースト自動消去
  useEffect(() => {
    if (!activeToast) return;
    const t = setTimeout(() => setActiveToast(null), 2500);
    return () => clearTimeout(t);
  }, [activeToast]);

  // ページ進捗記録
  useEffect(() => {
    if (currentNovel?.id) {
      recordInteraction(currentNovel.id, 'view', currentPageIndex + 1);
    }
  }, [currentPageIndex, currentNovel?.id]);

  // コンポーネントアンマウント時のタイマークリア
  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
    };
  }, []);

  // ページ送り（水平）
  const goToNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setPageDirection(1);
      setCurrentPageIndex((prev) => prev + 1);
    } else {
      setActiveToast('最終ページです。上にスワイプで次のショート小説へ');
    }
  }, [currentPageIndex, pages.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setPageDirection(-1);
      setCurrentPageIndex((prev) => prev - 1);
    }
  }, [currentPageIndex]);

  // 小説切り替え（垂直）
  const goToNextNovel = useCallback(() => {
    if (currentNovelIndex < novels.length - 1) {
      setNovelDirection(1);
      setCurrentNovelIndex((prev) => prev + 1);
    } else {
      setActiveToast('最新の作品まで読み切りました');
    }
  }, [currentNovelIndex, novels.length]);

  const goToPrevNovel = useCallback(() => {
    if (currentNovelIndex > 0) {
      setNovelDirection(-1);
      setCurrentNovelIndex((prev) => prev - 1);
    }
  }, [currentNovelIndex]);

  // キーボード操作対応
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntroCard || showCommentModal || showTipModal) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowDown') {
        goToNextNovel();
      } else if (e.key === 'ArrowUp') {
        goToPrevNovel();
      } else if (e.key === 'Escape') {
        setShowOverlayMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, goToNextNovel, goToPrevNovel, showCommentModal, showTipModal, showIntroCard]);

  // いいね切り替え関数
  const triggerLike = useCallback((novelId: string, forcedState?: boolean) => {
    const currentLiked = isLiked[novelId] ?? (userLikedIds?.has(novelId) || false);
    const nextLiked = forcedState !== undefined ? forcedState : !currentLiked;
    if (currentLiked === nextLiked) return;

    const targetNovel = novels.find((n) => n.id === novelId) || currentNovel;
    const currentCount = likeCounts[novelId] ?? (targetNovel?.likesCount || 0);

    setIsLiked((prev) => ({ ...prev, [novelId]: nextLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [novelId]: nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
    }));

    onToggleLike?.(novelId);
    recordInteraction(novelId, 'like', currentPageIndex + 1);
  }, [isLiked, userLikedIds, likeCounts, novels, currentNovel, currentPageIndex, onToggleLike]);

  // 現在の作品のフレーズいいね一覧
  const currentNovelPhraseLikes = (phraseLikes || []).filter(
    (item) => item.novelId === currentNovel.id
  );

  // テキスト選択の検知（マウスドラッグや長押し選択）
  const handleTextSelectionCheck = () => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (text.length >= 2 && text.length <= 300) {
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setSelectionPopup({
              text,
              x: rect.left + rect.width / 2,
              y: Math.max(16, rect.top - 52),
            });
          }
        } catch {}
      }
    }, 20);
  };

  // 選択テキストへのフレーズいいね
  const handleLikeCurrentSelection = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectionPopup || !currentNovel) return;
    const phrase = selectionPopup.text;
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();

    await onAddPhraseLike?.({
      userId: '',
      novelId: currentNovel.id,
      novelTitle: currentNovel.title,
      novelCategory: currentNovel.category || 'ショート',
      authorName: currentNovel.author?.username || '作者',
      pageNumber: currentPageIndex + 1,
      chapterTitle: `${currentPageIndex + 1}ページ目`,
      phrase,
      surroundingContext: currentPage.content,
    });

    setActiveToast(`「${phrase.slice(0, 14)}${phrase.length > 14 ? '…' : ''}」にいいねしました！`);
  };

  // 文タップモードでの文いいね
  const handleLikeSentence = async (sentence: string) => {
    if (!sentence || !currentNovel) return;
    setSelectedSentenceForLike(null);

    await onAddPhraseLike?.({
      userId: '',
      novelId: currentNovel.id,
      novelTitle: currentNovel.title,
      novelCategory: currentNovel.category || 'ショート',
      authorName: currentNovel.author?.username || '作者',
      pageNumber: currentPageIndex + 1,
      chapterTitle: `${currentPageIndex + 1}ページ目`,
      phrase: sentence,
      surroundingContext: currentPage.content,
    });

    setActiveToast(`「${sentence.slice(0, 14)}${sentence.length > 14 ? '…' : ''}」にいいねしました！`);
  };

  // 本文中のフレーズハイライト＋文選択の描画ロジック
  const renderHighlightedContent = () => {
    const rawContent = currentPage.content || '';
    const pagePhrases = currentNovelPhraseLikes.filter(
      (item) => item.pageNumber === currentPageIndex + 1
    );

    if (pagePhrases.length === 0 && !isSentenceMode) {
      return rawContent;
    }

    const matches: { start: number; end: number; item: PhraseLike }[] = [];
    for (const item of pagePhrases) {
      if (!item.phrase) continue;
      let idx = rawContent.indexOf(item.phrase);
      while (idx !== -1) {
        matches.push({ start: idx, end: idx + item.phrase.length, item });
        idx = rawContent.indexOf(item.phrase, idx + item.phrase.length);
      }
    }

    matches.sort((a, b) => a.start - b.start);
    const nonOverlapping: typeof matches = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    const renderNormalSubText = (text: string, keyPrefix: string) => {
      if (!isSentenceMode) return text;
      const sentenceRegex = /([^。！？\n]+[。！？]?|\n+)/g;
      const parts = text.match(sentenceRegex) || [text];
      return parts.map((part, pIdx) => {
        if (part === '\n' || /^\n+$/.test(part)) {
          return <span key={`${keyPrefix}-br-${pIdx}`}>{part}</span>;
        }
        return (
          <span
            key={`${keyPrefix}-sent-${pIdx}`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSentenceForLike(part.trim());
            }}
            className="hover:bg-rose-500/15 cursor-pointer transition-colors p-0 m-0 inline underline decoration-transparent hover:decoration-rose-400 decoration-1 underline-offset-4 text-inherit font-inherit"
            style={{
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
            title="クリックしてこの文にいいね"
          >
            {part}
          </span>
        );
      });
    };

    for (let i = 0; i < nonOverlapping.length; i++) {
      const m = nonOverlapping[i];
      if (m.start > currentIndex) {
        const normalChunk = rawContent.slice(currentIndex, m.start);
        elements.push(
          <React.Fragment key={`chunk-${currentIndex}`}>
            {renderNormalSubText(normalChunk, `chunk-${currentIndex}`)}
          </React.Fragment>
        );
      }

      elements.push(
        <mark
          key={`phrase-${m.item.id}-${m.start}`}
          onClick={(e) => {
            e.stopPropagation();
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setActiveLikedPhrasePopup({
              item: m.item,
              x: rect.left + rect.width / 2,
              y: Math.max(20, rect.top - 60),
            });
          }}
          className="bg-rose-400/20 text-inherit font-inherit p-0 m-0 inline underline decoration-rose-500/60 decoration-2 underline-offset-4 cursor-pointer hover:bg-rose-400/35 transition-colors"
          style={{
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
          }}
          title="いいねしたフレーズ（タップして詳細・解除）"
        >
          {rawContent.slice(m.start, m.end)}
        </mark>
      );

      currentIndex = m.end;
    }

    if (currentIndex < rawContent.length) {
      const trailingChunk = rawContent.slice(currentIndex);
      elements.push(
        <React.Fragment key={`chunk-${currentIndex}`}>
          {renderNormalSubText(trailingChunk, `chunk-${currentIndex}`)}
        </React.Fragment>
      );
    }

    return elements;
  };

  // 画面タップ処理（左1/3・中央1/3・右1/3判定 ＋ 中央ダブルタップでいいね）
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showIntroCard || showCommentModal || showTipModal || showPhraseLikesModal) return;
    touchStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showIntroCard) return;

    // 1. 各種モーダル表示中はページ送りを完全ブロック
    if (showCommentModal || showTipModal || showPhraseLikesModal) {
      return;
    }

    // 2. メニュー表示中はページ移動を完全に無効化（誤操作・連動ページ送りの完全防止）
    // メニュー表示中に画面（本文や余白）をタップした場合は、メニューを閉じるのみとし、ページ送りは行わない
    if (showOverlayMenu) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      setShowOverlayMenu(false);
      return;
    }

    // 3. テキスト選択中の場合はページめくりやメニュー開閉を抑制（誤操作防止）
    const sel = typeof window !== 'undefined' ? window.getSelection() : null;
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      return;
    }

    // 4. 選択ポップアップやいいね済みポップアップ表示中の場合は、タップで閉じるのみ（ページめくり防止）
    if (selectionPopup) {
      setSelectionPopup(null);
      window.getSelection()?.removeAllRanges();
      return;
    }
    if (activeLikedPhrasePopup) {
      setActiveLikedPhrasePopup(null);
      return;
    }

    // 5. 文選択モード中はタップによるページ送りを無効化
    if (isSentenceMode) {
      return;
    }

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
      // 左1/3：前ページ
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      goToPrevPage();
    } else if (tapX > rightThird) {
      // 右1/3：次ページ
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapTimeRef.current = 0;
      goToNextPage();
    } else {
      // 中央1/3：ダブルタップ検知（ダブルタップなら「いいね」、シングルタップならメニュー開閉）
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      // 400ms以内の2回目のタップであれば確実にダブルタップと判定
      if (timeSinceLastTap > 0 && timeSinceLastTap < 400) {
        // 直前のシングルタップ用タイマーを即座に破棄（メニュー開閉を完全に阻止）
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }
        lastTapTimeRef.current = 0;

        // 中央ハートポップアップアニメーションを表示
        setDoubleTapHeart({ id: now, x: e.clientX, y: e.clientY });
        setTimeout(() => setDoubleTapHeart(null), 1000);

        // いいねをオンに設定（既にいいね状態でもハートポップアップを表示し、未いいねならいいね＋カウント増加）
        if (currentNovel) {
          const novelId = currentNovel.id;
          if (!isLiked[novelId]) {
            triggerLike(novelId, true);
          }
        }
      } else {
        // 1回目のタップ：ダブルタップ判定時間（380ms）待機し、次のタップが無ければメニューを開閉
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
    if (!currentNovel) return;
    const novelId = currentNovel.id;
    const bookmarked = !isBookmarked[novelId];
    setIsBookmarked((prev) => ({ ...prev, [novelId]: bookmarked }));
    setActiveToast(bookmarked ? 'しおりを挟みました' : 'しおりを解除しました');
    onToggleBookmark?.(novelId);
    recordInteraction(novelId, 'bookmark', currentPageIndex + 1);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentNovel) return;
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
    setActiveToast(`作家に ${selectedTipAmount}円 の投げ銭を贈りました！`);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentNovel) return;
    const novelId = currentNovel.id;
    const list = commentsList[novelId] || [];
    setCommentsList({
      ...commentsList,
      [novelId]: [
        {
          id: `c-${Date.now()}`,
          user: 'あなた',
          text: newCommentText.trim(),
          time: 'たった今',
        },
        ...list,
      ],
    });
    setNewCommentText('');
  };

  // 行間を厳密に 1.8 ～ 2.0 に設定したスタイルクラス
  const fontSizes = {
    sm: 'text-[15px] sm:text-[16px] leading-[1.85]',
    base: 'text-[17px] sm:text-[19px] leading-[1.9]',
    lg: 'text-[19px] sm:text-[22px] leading-[1.95]',
  };

  if (!currentNovel) return null;

  const novelLiked = isLiked[currentNovel.id] ?? (userLikedIds?.has(currentNovel.id) || false);
  const novelLikes = likeCounts[currentNovel.id] ?? (currentNovel.likesCount || 0);
  const currentComments = commentsList[currentNovel.id] || [];

  return (
    <div
      id="novel-viewer-container"
      className="relative w-screen h-screen parchment-texture parchment-vignette text-[#26201a] overflow-hidden select-none font-serif touch-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* 垂直スワイプ（小説切り替え） */}
      <motion.div
        key={`novel-${currentNovel.id}`}
        className="w-full h-full relative z-10"
        initial={{ opacity: 0, y: novelDirection === 1 ? 50 : -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: novelDirection === 1 ? -50 : 50 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y < -70 && info.velocity.y < 200) {
            goToNextNovel();
          } else if (info.offset.y > 70 && info.velocity.y > -200) {
            goToPrevNovel();
          }
        }}
      >
        {/* ページめくり（水平スライド）本文 */}
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center px-6 sm:px-14 md:px-20 max-w-3xl mx-auto">
          <AnimatePresence mode="wait" custom={pageDirection}>
            <motion.div
              key={`novel-${currentNovel.id}-page-${currentPageIndex}`}
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
              {/* 文選択モード中のステータスインジケーター */}
              {isSentenceMode && (
                <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-800 text-xs font-sans self-center shadow-xs animate-in fade-in select-none">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>文をタップして直接フレーズいいねできます</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSentenceMode(false);
                    }}
                    className="ml-2 text-rose-700 hover:text-rose-900 underline text-[11px] font-bold"
                  >
                    通常読書へ
                  </button>
                </div>
              )}

              {/* 本文：行間を1.8〜2.0に調整した文字だけのミニマルUI（羊皮紙に刻まれた墨インク色） */}
              <div
                onMouseUp={handleTextSelectionCheck}
                onTouchEnd={handleTextSelectionCheck}
                className={`text-[#221c17] whitespace-pre-wrap font-normal ${fontSizes[fontSize]} antialiased select-text cursor-text`}
                style={{
                  textRendering: 'optimizeLegibility',
                  letterSpacing: '0.04em',
                }}
              >
                {renderHighlightedContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* フェードアウトUI（タイトル＆作者名：1秒でフェードアウト） */}
        <AnimatePresence>
          {showIntroCard && (
            <motion.div
              id="novel-intro-overlay"
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
                  SHORT NOVEL • {currentNovel.category || 'ショート'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-[#1e1711] mb-3 leading-relaxed">
                  {currentNovel.title}
                </h1>
                <p className="text-sm sm:text-base text-[#5c4936] font-sans tracking-wide">
                  著：{currentNovel.author?.username || '作者不詳'}
                </p>
                {currentNovel.synopsis && (
                  <p className="mt-4 text-xs sm:text-sm text-[#73604e] line-clamp-2 italic max-w-xs mx-auto">
                    {currentNovel.synopsis}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 最終ページのスワイプ案内（中央タップ時のオーバーレイメニューでのみ表示） */}
      </motion.div>

      {/* 中央ダブルタップ時のビッグハートアニメーション */}
      <AnimatePresence>
        {doubleTapHeart && (
          <motion.div
            key={doubleTapHeart.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9] }}
            exit={{ scale: 1.4, opacity: 0, y: -40 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              left: `${doubleTapHeart.x}px`,
              top: `${doubleTapHeart.y}px`,
            }}
          >
            <div className="relative">
              <Heart className="w-24 h-24 text-rose-600 fill-rose-600 drop-shadow-[0_4px_20px_rgba(225,29,72,0.4)]" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 rounded-full bg-rose-500/20 blur-md"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* トグル式メニュー（画面中央タップで表示） */}
      <AnimatePresence>
        {showOverlayMenu && (
          <>
            {/* 上部ヘッダー */}
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

            {/* 右下アクションメニュー */}
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
                  setActiveToast(`${currentNovel.author?.username || '作者'} の作品`);
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
                  if (currentNovel) triggerLike(currentNovel.id);
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
                  {currentComments.length}
                </span>
              </button>

              {/* フレーズいいね一覧（振り返り）ボタン */}
              <button
                id="btn-phrase-likes-novel"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPhraseLikesModal(true);
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
                onClick={handleToggleBookmark}
                className="flex flex-col items-center gap-1 group"
                title="しおり"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-colors ${
                    isBookmarked[currentNovel.id]
                      ? 'bg-[#a3513a] text-[#f7f3e8] border border-[#873e2b]'
                      : 'bg-[#ede3d1]/90 text-[#4c392c] border border-[#cfbdab] group-hover:bg-[#e4d6c0]'
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      isBookmarked[currentNovel.id] ? 'fill-current' : ''
                    }`}
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
                id="btn-share-novel"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
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

            {/* ページ番号表示 */}
            <motion.div
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-5 left-5 z-40 font-sans text-xs text-[#5c4936] tracking-wider bg-[#ede3d1]/90 backdrop-blur-sm px-3 py-1 rounded-full border border-[#d8c7ad] shadow-sm"
            >
              Page {currentPageIndex + 1} / {totalPages} • ショート {currentNovelIndex + 1}/{novels.length}
            </motion.div>

            {/* 中央タップ時にのみ表示される「上にスワイプで次の作品へ」ガイド */}
            {currentPageIndex === pages.length - 1 && (
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
      </AnimatePresence>

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

      {/* 投げ銭モーダル */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTipModal(false)}
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
                  onClick={() => setShowTipModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#1a3828] text-xs text-neutral-300 hover:bg-[#152e22] transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSendTip}
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
            onClick={() => setShowCommentModal(false)}
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
                  onClick={() => setShowCommentModal(false)}
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

              <form onSubmit={handleAddComment} className="pt-3 border-t border-neutral-800 flex gap-2">
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
              onClick={handleLikeCurrentSelection}
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
              onClick={() => {
                setSelectionPopup(null);
                window.getSelection()?.removeAllRanges();
              }}
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
                onClick={() => setActiveLikedPhrasePopup(null)}
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
                onClick={async () => {
                  const textToCopy = `『${activeLikedPhrasePopup.item.phrase}』\n—— ${currentNovel.author?.username || '作者'}「${currentNovel.title}」より`;
                  if (navigator.clipboard) await navigator.clipboard.writeText(textToCopy);
                  setActiveToast('引用文をコピーしました');
                  setActiveLikedPhrasePopup(null);
                }}
                className="px-2 py-1 rounded bg-[#2e1f14] hover:bg-[#3d2a1c] text-[#d6b998] text-[11px]"
              >
                引用コピー
              </button>
              <button
                onClick={async () => {
                  const id = activeLikedPhrasePopup.item.id;
                  setActiveLikedPhrasePopup(null);
                  await onRemovePhraseLike?.(id);
                  setActiveToast('フレーズいいねを解除しました');
                }}
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
                onClick={() => setSelectedSentenceForLike(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#a3917f] hover:text-[#f5ebd9] hover:bg-white/5"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleLikeSentence(selectedSentenceForLike)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-rose-900/30"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>いいねする</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* フレーズいいね一覧ドロワー */}
      <PhraseLikesModal
        isOpen={showPhraseLikesModal}
        onClose={() => setShowPhraseLikesModal(false)}
        novelTitle={currentNovel.title}
        authorName={currentNovel.author?.username}
        phraseLikes={currentNovelPhraseLikes}
        currentPageNumber={currentPageIndex + 1}
        onSelectPage={(page) => {
          setCurrentPageIndex(page - 1);
        }}
        onRemovePhraseLike={(id) => {
          onRemovePhraseLike?.(id);
          setActiveToast('フレーズいいねを解除しました');
        }}
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
    </div>
  );
}
