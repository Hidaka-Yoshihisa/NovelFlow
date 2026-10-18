// src/features/viewer/hooks/useNovelViewerGestures.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import type { NovelWithDetails } from '@/types/database';
import { recordInteraction } from '@/lib/supabase';

interface UseNovelViewerGesturesProps {
  novels: NovelWithDetails[];
  initialNovelIndex?: number;
  initialPageIndex?: number;
  onToggleLike?: (novelId: string) => Promise<void> | void;
  userLikedIds?: Set<string>;
}

export function useNovelViewerGestures({
  novels,
  initialNovelIndex = 0,
  initialPageIndex = 0,
  onToggleLike,
  userLikedIds,
}: UseNovelViewerGesturesProps) {
  const [currentNovelIndex, setCurrentNovelIndex] = useState(initialNovelIndex);
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [pageDirection, setPageDirection] = useState<1 | -1>(1);
  const [novelDirection, setNovelDirection] = useState<1 | -1>(1);

  const [showOverlayMenu, setShowOverlayMenu] = useState(false);
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [isSentenceMode, setIsSentenceMode] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // ダブルタップハート演出
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ id: number; x: number; y: number } | null>(null);

  // ダブルタップ判定用のタイマーと参照
  const lastTapTimeRef = useRef<number>(0);
  const singleTapTimerRef = useRef<any>(null);
  const touchStartPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const currentNovel = novels[currentNovelIndex] || novels[0];
  const pages = currentNovel?.pages || [];
  const totalPages = Math.max(pages.length, 1);

  // 1pxプログレスバー用の進捗率
  const progressPercent = ((currentPageIndex + 1) / totalPages) * 100;

  // 外部からの初期ページ番号指定の反映
  useEffect(() => {
    if (initialPageIndex !== undefined && initialPageIndex >= 0) {
      setCurrentPageIndex(initialPageIndex);
    }
  }, [initialPageIndex]);

  // 作品切り替え時のタイトル＆作者名フェードアウトUI（1秒後に消滅）
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
    const timer = setTimeout(() => setActiveToast(null), 2500);
    return () => clearTimeout(timer);
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
      }
    };
  }, []);

  // ページ送り（水平）
  const goToNextPage = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setPageDirection(1);
      setCurrentPageIndex((prev) => prev + 1);
    } else if (currentNovelIndex < novels.length - 1) {
      setNovelDirection(1);
      setCurrentNovelIndex((prev) => prev + 1);
      setCurrentPageIndex(0);
    }
  }, [currentPageIndex, pages.length, currentNovelIndex, novels.length]);

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
      setCurrentPageIndex(0);
    }
  }, [currentNovelIndex, novels.length]);

  const goToPrevNovel = useCallback(() => {
    if (currentNovelIndex > 0) {
      setNovelDirection(-1);
      setCurrentNovelIndex((prev) => prev - 1);
      setCurrentPageIndex(0);
    }
  }, [currentNovelIndex]);

  // キーボード操作対応
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextNovel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevNovel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, goToNextNovel, goToPrevNovel]);

  // ポインター押下
  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  // 画面タップ処理（左1/3・中央1/3・右1/3判定 ＋ 中央ダブルタップでいいね）
  const handlePointerUp = (
    e: React.PointerEvent,
    triggerLike: (novelId: string) => void
  ) => {
    const dx = Math.abs(e.clientX - touchStartPos.current.x);
    const dy = Math.abs(e.clientY - touchStartPos.current.y);
    const dt = Date.now() - touchStartPos.current.time;

    // スワイプ操作やテキスト選択操作時はスキップ
    if (dx > 10 || dy > 10 || dt > 400) return;

    // テキスト選択がある場合は選択ポップアップを優先
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    // 文タップ選択モード中の場合は本文側のクリックに任せる
    if (isSentenceMode) return;

    const width = window.innerWidth;
    const x = e.clientX;
    const tapXRatio = x / width;

    if (tapXRatio < 0.33) {
      // 左1/3：前のページへ
      goToPrevPage();
    } else if (tapXRatio > 0.67) {
      // 右1/3：次のページへ
      goToNextPage();
    } else {
      // 中央1/3：ダブルタップで「いいね」、シングルタップで「メニュー表示/非表示」
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;

      if (timeSinceLastTap < 300) {
        // ダブルタップ成功！
        if (singleTapTimerRef.current) {
          clearTimeout(singleTapTimerRef.current);
          singleTapTimerRef.current = null;
        }

        if (currentNovel) {
          triggerLike(currentNovel.id);
          const heartId = now;
          setDoubleTapHeart({ id: heartId, x: e.clientX, y: e.clientY });
          setTimeout(() => {
            setDoubleTapHeart((prev) => (prev?.id === heartId ? null : prev));
          }, 800);
        }
        lastTapTimeRef.current = 0;
      } else {
        // シングルタップの保留
        lastTapTimeRef.current = now;
        singleTapTimerRef.current = setTimeout(() => {
          setShowOverlayMenu((prev) => !prev);
          singleTapTimerRef.current = null;
        }, 280);
      }
    }
  };

  return {
    currentNovelIndex,
    setCurrentNovelIndex,
    currentPageIndex,
    setCurrentPageIndex,
    pageDirection,
    novelDirection,
    showOverlayMenu,
    setShowOverlayMenu,
    showIntroCard,
    fontSize,
    setFontSize,
    isSentenceMode,
    setIsSentenceMode,
    activeToast,
    setActiveToast,
    doubleTapHeart,
    setDoubleTapHeart,
    currentNovel,
    pages,
    totalPages,
    progressPercent,
    goToNextPage,
    goToPrevPage,
    goToNextNovel,
    goToPrevNovel,
    handlePointerDown,
    handlePointerUp,
  };
}
