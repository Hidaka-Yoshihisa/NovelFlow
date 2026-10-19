// src/pages/HomePage.tsx
import React, { useState } from 'react';
import NovelViewer from '@/src/features/viewer/NovelViewer';
import RegularNovelViewer from '@/components/RegularNovelViewer';
import PublishModal from '@/components/PublishModal';
import MyPageModal from '@/components/MyPageModal';
import AuthModal from '@/components/AuthModal';
import { AppIcon } from '@/components/AppIcon';
import { useAuth } from '@/lib/authContext';
import { useNovelFeed } from '@/src/hooks/useNovelFeed';
import { usePhraseBookmark } from '@/src/hooks/usePhraseBookmark';
import { useNovelRecommendation } from '@/src/hooks/useNovelRecommendation';
import { HeaderNav } from '@/src/features/home/components/HeaderNav';
import { BottomNav } from '@/src/features/home/components/BottomNav';
import { HomeTabView } from '@/src/features/home/components/HomeTabView';
import { ExploreTabView } from '@/src/features/home/components/ExploreTabView';
import { LibraryTabView } from '@/src/features/home/components/LibraryTabView';
import FeatureGuideModal, { GUIDE_STORAGE_KEY } from '@/src/features/guide/FeatureGuideModal';
import type { NovelWithDetails } from '@/types/database';

export default function HomePage() {
  const { currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'library' | 'explore'>('home');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // 初回アクセス時に限り機能ガイドを自動表示
  React.useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(GUIDE_STORAGE_KEY);
      if (!isDismissed) {
        setIsGuideOpen(true);
      }
    } catch (err) {
      console.warn('Guide localStorage check error:', err);
    }
  }, []);

  // 1. 小説データ・いいね・しおり・検索 Custom Hook
  const {
    shortNovels,
    regularNovels,
    loading,
    userLikedIds,
    userBookmarkedIds,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredShortNovels,
    filteredRegularNovels,
    handleToggleLike,
    handleToggleBookmark,
    handleNovelPublished,
  } = useNovelFeed({ currentUser });

  // 2. フレーズいいね・ハイライト管理 Custom Hook
  const {
    userPhraseLikes,
    handleAddPhraseLike,
    handleRemovePhraseLike,
  } = usePhraseBookmark({ currentUser });

  // 3. 嗜好動的レコメンド・ソート Custom Hook
  const {
    exploreSort,
    setExploreSort,
    userCategoryStats,
    recommendedNovels,
  } = useNovelRecommendation({
    shortNovels,
    regularNovels,
    userLikedIds,
    userPhraseLikes,
  });

  // 閲覧中の通常小説・初期章番号
  const [selectedRegularNovel, setSelectedRegularNovel] = useState<NovelWithDetails | null>(null);
  const [selectedRegularChapterIndex, setSelectedRegularChapterIndex] = useState<number>(0);
  // 選択中のショート小説インデックス・初期ページ番号
  const [selectedShortIndex, setSelectedShortIndex] = useState<number>(0);
  const [selectedShortPageIndex, setSelectedShortPageIndex] = useState<number>(0);

  // モーダル管理
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'register' | 'login'>('register');

  // ローディング画面
  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#070d0a] flex flex-col items-center justify-center text-emerald-300 font-sans">
        <AppIcon className="w-14 h-14 mb-4 animate-pulse" roundedClassName="rounded-2xl" />
        <p className="text-xs tracking-widest uppercase text-emerald-400 font-medium">
          NovelFlow を読み込み中...
        </p>
      </div>
    );
  }

  // 1. 通常小説の読書ビュー
  if (selectedRegularNovel) {
    return (
      <RegularNovelViewer
        novel={selectedRegularNovel}
        initialChapterIndex={selectedRegularChapterIndex}
        onBack={() => {
          setSelectedRegularNovel(null);
          setSelectedRegularChapterIndex(0);
        }}
        onToggleLike={(id) => handleToggleLike(id, selectedRegularNovel, setSelectedRegularNovel)}
        userLikedIds={userLikedIds}
        userBookmarkedIds={userBookmarkedIds}
        onToggleBookmark={handleToggleBookmark}
        phraseLikes={userPhraseLikes}
        onAddPhraseLike={handleAddPhraseLike}
        onRemovePhraseLike={handleRemovePhraseLike}
      />
    );
  }

  // 2. ショート小説の全画面スワイプビュー（YouTube Shortsスタイル）
  if (activeTab === 'shorts' && shortNovels.length > 0) {
    return (
      <div className="relative w-screen h-screen overflow-hidden">
        <NovelViewer
          novels={shortNovels}
          initialNovelIndex={selectedShortIndex}
          initialPageIndex={selectedShortPageIndex}
          onBack={() => {
            setActiveTab('home');
            setSelectedShortPageIndex(0);
          }}
          onOpenPublish={() => setIsPublishModalOpen(true)}
          onToggleLike={(id) => handleToggleLike(id)}
          userLikedIds={userLikedIds}
          userBookmarkedIds={userBookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          phraseLikes={userPhraseLikes}
          onAddPhraseLike={handleAddPhraseLike}
          onRemovePhraseLike={handleRemovePhraseLike}
        />

        {/* 投稿モーダル */}
        <PublishModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onSuccess={(newNovel) =>
            handleNovelPublished(
              newNovel,
              (idx) => {
                setSelectedShortIndex(idx);
                setSelectedShortPageIndex(0);
                setActiveTab('shorts');
              },
              (novel) => {
                setSelectedRegularNovel(novel);
                setSelectedRegularChapterIndex(0);
              }
            )
          }
        />
      </div>
    );
  }

  // 3. ホーム画面 / 通常小説ライブラリ / レコメンドExplore画面
  return (
    <div className="w-screen h-screen bg-[#070d0a] text-[#e3e8e5] flex flex-col overflow-hidden font-sans">
      {/* ナビゲーションバー */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredShortNovels={filteredShortNovels}
        filteredRegularNovels={filteredRegularNovels}
        shortNovels={shortNovels}
        currentUser={currentUser}
        onOpenMyPage={() => setIsMyPageOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('register');
          setIsAuthModalOpen(true);
        }}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onSelectShort={(index) => {
          setSelectedShortIndex(index);
          setSelectedShortPageIndex(0);
          setActiveTab('shorts');
        }}
        onSelectRegular={(novel) => {
          setSelectedRegularNovel(novel);
          setSelectedRegularChapterIndex(0);
        }}
      />

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-28 lg:pb-8 max-w-[1680px] mx-auto w-full">
        {activeTab === 'explore' ? (
          <ExploreTabView
            recommendedNovels={recommendedNovels}
            exploreSort={exploreSort}
            setExploreSort={setExploreSort}
            userLikedIds={userLikedIds}
            onToggleLike={(id) => handleToggleLike(id)}
            onOpenMyPage={() => setIsMyPageOpen(true)}
            onSelectShortById={(novelId) => {
              const idx = shortNovels.findIndex((s) => s.id === novelId);
              setSelectedShortIndex(idx >= 0 ? idx : 0);
              setSelectedShortPageIndex(0);
              setActiveTab('shorts');
            }}
            onSelectRegularById={(novelId) => {
              const found = regularNovels.find((r) => r.id === novelId);
              if (found) {
                setSelectedRegularNovel(found);
                setSelectedRegularChapterIndex(0);
              }
            }}
          />
        ) : activeTab === 'home' ? (
          <HomeTabView
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            shortNovels={shortNovels}
            regularNovels={regularNovels}
            filteredShortNovels={filteredShortNovels}
            filteredRegularNovels={filteredRegularNovels}
            userLikedIds={userLikedIds}
            onToggleLike={(id) => handleToggleLike(id)}
            onSelectShort={(index) => {
              setSelectedShortIndex(index);
              setSelectedShortPageIndex(0);
              setActiveTab('shorts');
            }}
            onSelectRegular={(novel) => {
              setSelectedRegularNovel(novel);
              setSelectedRegularChapterIndex(0);
            }}
          />
        ) : (
          <LibraryTabView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredRegularNovels={filteredRegularNovels}
            userLikedIds={userLikedIds}
            onToggleLike={(id) => handleToggleLike(id)}
            onSelectRegular={(novel) => {
              setSelectedRegularNovel(novel);
              setSelectedRegularChapterIndex(0);
            }}
          />
        )}
      </main>

      {/* モバイル用常時下部ナビゲーションバー */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasAffinityScores={userCategoryStats.totalScore > 0}
        currentUser={currentUser}
        onOpenMyPage={() => setIsMyPageOpen(true)}
        onSelectShortsTab={() => {
          setSelectedShortIndex(0);
          setSelectedShortPageIndex(0);
          setActiveTab('shorts');
        }}
        onClearSearch={() => setSearchQuery('')}
      />

      {/* 投稿モーダル */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={(newNovel) =>
          handleNovelPublished(
            newNovel,
            (idx) => {
              setSelectedShortIndex(idx);
              setSelectedShortPageIndex(0);
              setActiveTab('shorts');
            },
            (novel) => {
              setSelectedRegularNovel(novel);
              setSelectedRegularChapterIndex(0);
            }
          )
        }
      />

      {/* マイページモーダル */}
      <MyPageModal
        isOpen={isMyPageOpen}
        onClose={() => setIsMyPageOpen(false)}
        novels={{ shorts: shortNovels, regulars: regularNovels }}
        userLikedIds={userLikedIds}
        userBookmarkedIds={userBookmarkedIds}
        onToggleLike={(id) => handleToggleLike(id)}
        onToggleBookmark={handleToggleBookmark}
        onSelectShort={(idx, page) => {
          setSelectedShortIndex(idx);
          setSelectedShortPageIndex(page ?? 0);
          setActiveTab('shorts');
        }}
        onSelectRegular={(novel, chapter) => {
          setSelectedRegularNovel(novel);
          setSelectedRegularChapterIndex(chapter ?? 0);
        }}
        onOpenPublish={() => setIsPublishModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('register');
          setIsAuthModalOpen(true);
        }}
        onOpenGuide={() => setIsGuideOpen(true)}
        phraseLikes={userPhraseLikes}
        onRemovePhraseLike={handleRemovePhraseLike}
        recommendedNovels={recommendedNovels}
      />

      {/* アカウント作成 / ログインモーダル */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* はじめてガイド・主要機能説明モーダル（初回アクセス時に自動表示 / 今後表示しない選択可能） */}
      <FeatureGuideModal
        isOpen={isGuideOpen}
        onClose={() => {
          setIsGuideOpen(false);
          setActiveTab('home');
        }}
        onStart={() => {
          setIsGuideOpen(false);
          setActiveTab('home');
          setSelectedRegularNovel(null);
          setSelectedRegularChapterIndex(0);
          setSelectedShortIndex(0);
          setSelectedShortPageIndex(0);
        }}
      />
    </div>
  );
}
