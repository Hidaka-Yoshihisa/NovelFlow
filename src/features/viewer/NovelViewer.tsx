// src/features/viewer/NovelViewer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { NovelWithDetails, PhraseLike } from '@/types/database';
import { useNovelViewerGestures } from './hooks/useNovelViewerGestures';
import { NovelViewerHeader } from './components/NovelViewerHeader';
import { NovelViewerSidebar } from './components/NovelViewerSidebar';
import { NovelViewerBottomBar } from './components/NovelViewerBottomBar';
import { NovelSelectionPopups } from './components/NovelSelectionPopups';
import { NovelViewerModals } from './components/NovelViewerModals';

export interface NovelViewerProps {
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
  // ジェスチャー・操作系カスタムフック
  const {
    currentNovelIndex,
    currentPageIndex,
    setCurrentPageIndex,
    pageDirection,
    novelDirection,
    showOverlayMenu,
    showIntroCard,
    fontSize,
    setFontSize,
    isSentenceMode,
    setIsSentenceMode,
    activeToast,
    setActiveToast,
    doubleTapHeart,
    currentNovel,
    pages,
    totalPages,
    progressPercent,
    goToNextNovel,
    goToPrevNovel,
    handlePointerDown,
    handlePointerUp,
  } = useNovelViewerGestures({
    novels,
    initialNovelIndex,
    initialPageIndex,
    onToggleLike,
    userLikedIds,
  });

  // いいね・しおりのローカルキャッシュ同期
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

  useEffect(() => {
    if (userBookmarkedIds) {
      const map: Record<string, boolean> = {};
      novels.forEach((n) => {
        map[n.id] = userBookmarkedIds.has(n.id);
      });
      setIsBookmarked(map);
    }
  }, [userBookmarkedIds, novels]);

  // フレーズ選択ポップアップ状態
  const [selectionPopup, setSelectionPopup] = useState<{ text: string; x: number; y: number } | null>(null);
  const [activeLikedPhrasePopup, setActiveLikedPhrasePopup] = useState<{ item: PhraseLike; x: number; y: number } | null>(null);
  const [selectedSentenceForLike, setSelectedSentenceForLike] = useState<string | null>(null);

  // 投げ銭 & コメントシート状態
  const [showTipModal, setShowTipModal] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(300);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showPhraseLikesModal, setShowPhraseLikesModal] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentsList, setCommentsList] = useState<Record<string, Array<{ id: string; user: string; text: string; time: string }>>>({
    'short-1': [
      { id: 'c1', user: '読書好きの猫', text: '金木犀の香りの描写が素敵すぎる...', time: '10分前' },
      { id: 'c2', user: 'ミッドナイト', text: '「誰かの記憶になる番」で鳥肌が立ちました。', time: '1時間前' },
    ],
    'short-2': [
      { id: 'c3', user: 'ゆき', text: '秒速1メートルという設定が切なくて美しい。', time: '30分前' },
    ],
  });

  const currentPage = pages[currentPageIndex] || { content: '', page_number: 1 };

  // ページ・作品切り替え時にポップアップを安全にクリア
  useEffect(() => {
    setSelectionPopup(null);
    setActiveLikedPhrasePopup(null);
    setSelectedSentenceForLike(null);
  }, [currentPageIndex, currentNovelIndex]);

  // いいね切り替え関数
  const triggerLike = useCallback(
    (novelId: string) => {
      const currentlyLiked = isLiked[novelId] ?? (userLikedIds?.has(novelId) || false);
      const nextLiked = !currentlyLiked;

      setIsLiked((prev) => ({ ...prev, [novelId]: nextLiked }));
      setLikeCounts((prev) => ({
        ...prev,
        [novelId]: Math.max(0, (prev[novelId] ?? currentNovel?.likesCount ?? 0) + (nextLiked ? 1 : -1)),
      }));

      onToggleLike?.(novelId);
    },
    [isLiked, userLikedIds, currentNovel, onToggleLike]
  );

  // 現在の作品のフレーズいいね一覧
  const currentNovelPhraseLikes = (phraseLikes || []).filter(
    (item) => item.novelId === currentNovel?.id
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

  // 本文中のフレーズハイライト＋文選択の描画ロジック（改行・文字送りを1ミリも狂わせない保護処理）
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

  // しおりトグル
  const handleBookmarkClick = () => {
    if (!currentNovel) return;
    const nextVal = !isBookmarked[currentNovel.id];
    setIsBookmarked((prev) => ({ ...prev, [currentNovel.id]: nextVal }));
    onToggleBookmark?.(currentNovel.id);
    setActiveToast(nextVal ? 'しおりを挟みました' : 'しおりを外しました');
  };

  // 投げ銭送信
  const handleSendTip = () => {
    setShowTipModal(false);
    setActiveToast(`¥${selectedTipAmount.toLocaleString()} の投げ銭を贈りました！ありがとうございます！`);
  };

  // コメント投稿
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentNovel) return;
    const newCmt = {
      id: `c-${Date.now()}`,
      user: 'あなた',
      text: newCommentText.trim(),
      time: '今',
    };
    setCommentsList((prev) => ({
      ...prev,
      [currentNovel.id]: [newCmt, ...(prev[currentNovel.id] || [])],
    }));
    setNewCommentText('');
    setActiveToast('コメントを投稿しました');
  };

  // 共有
  const handleShare = async () => {
    if (!currentNovel) return;
    const shareData = {
      title: currentNovel.title,
      text: `『${currentNovel.title}』${currentNovel.author?.username ? `著: ${currentNovel.author.username}` : ''} - NovelFlowでショート小説を読もう`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      setActiveToast('作品リンクをクリップボードにコピーしました');
    }
  };

  // 行間スタイル
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
      onPointerUp={(e) => handlePointerUp(e, triggerLike)}
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
                <p className="text-sm text-[#5a4635] tracking-widest font-sans">
                  {currentNovel.author?.username || '作者'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* オーバーレイメニュー（中央タップ時にトグル表示） */}
        <AnimatePresence>
          {showOverlayMenu && (
            <>
              <NovelViewerHeader
                currentNovel={currentNovel}
                fontSize={fontSize}
                setFontSize={setFontSize}
                isSentenceMode={isSentenceMode}
                setIsSentenceMode={setIsSentenceMode}
                onBack={onBack}
                onOpenPublish={onOpenPublish}
              />
              <NovelViewerSidebar
                currentNovel={currentNovel}
                novelLiked={novelLiked}
                novelLikes={novelLikes}
                commentsCount={currentComments.length}
                isBookmarked={Boolean(isBookmarked[currentNovel.id])}
                currentNovelPhraseLikes={currentNovelPhraseLikes}
                onTriggerLike={triggerLike}
                onOpenComments={() => setShowCommentModal(true)}
                onOpenPhraseLikes={() => setShowPhraseLikesModal(true)}
                onToggleBookmark={handleBookmarkClick}
                onOpenTip={() => setShowTipModal(true)}
                onShare={handleShare}
                onShowToast={(msg) => setActiveToast(msg)}
              />
            </>
          )}
        </AnimatePresence>

        {/* 下部プログレスバー & ナビゲーション表示 */}
        <NovelViewerBottomBar
          currentPageIndex={currentPageIndex}
          totalPages={totalPages}
          currentNovelIndex={currentNovelIndex}
          totalNovels={novels.length}
          isLastPage={currentPageIndex === pages.length - 1}
          showOverlayMenu={showOverlayMenu}
          progressPercent={progressPercent}
        />
      </motion.div>

      {/* フレーズ選択・文選択・ダブルタップポップアップ */}
      <NovelSelectionPopups
        currentNovel={currentNovel}
        selectionPopup={selectionPopup}
        onCloseSelectionPopup={() => {
          setSelectionPopup(null);
          window.getSelection()?.removeAllRanges();
        }}
        onLikeCurrentSelection={handleLikeCurrentSelection}
        activeLikedPhrasePopup={activeLikedPhrasePopup}
        onCloseActiveLikedPhrasePopup={() => setActiveLikedPhrasePopup(null)}
        onCopyQuote={async (phrase) => {
          const textToCopy = `『${phrase}』\n—— ${currentNovel.author?.username || '作者'}「${currentNovel.title}」より`;
          if (navigator.clipboard) await navigator.clipboard.writeText(textToCopy);
          setActiveToast('引用文をコピーしました');
          setActiveLikedPhrasePopup(null);
        }}
        onRemoveLikedPhrase={async (id) => {
          setActiveLikedPhrasePopup(null);
          await onRemovePhraseLike?.(id);
          setActiveToast('フレーズいいねを解除しました');
        }}
        selectedSentenceForLike={selectedSentenceForLike}
        onCloseSentenceModal={() => setSelectedSentenceForLike(null)}
        onConfirmSentenceLike={handleLikeSentence}
        doubleTapHeart={doubleTapHeart}
      />

      {/* モーダル群（投げ銭、コメント、フレーズ一覧、トースト） */}
      <NovelViewerModals
        currentNovel={currentNovel}
        currentPageNumber={currentPageIndex + 1}
        showTipModal={showTipModal}
        onCloseTipModal={() => setShowTipModal(false)}
        selectedTipAmount={selectedTipAmount}
        setSelectedTipAmount={setSelectedTipAmount}
        onSendTip={handleSendTip}
        showCommentModal={showCommentModal}
        onCloseCommentModal={() => setShowCommentModal(false)}
        currentComments={currentComments}
        newCommentText={newCommentText}
        setNewCommentText={setNewCommentText}
        onAddComment={handleAddComment}
        showPhraseLikesModal={showPhraseLikesModal}
        onClosePhraseLikesModal={() => setShowPhraseLikesModal(false)}
        currentNovelPhraseLikes={currentNovelPhraseLikes}
        onSelectPhrasePage={(page) => setCurrentPageIndex(page - 1)}
        onRemovePhraseLike={(id) => {
          onRemovePhraseLike?.(id);
          setActiveToast('フレーズいいねを解除しました');
        }}
        activeToast={activeToast}
      />
    </div>
  );
}
