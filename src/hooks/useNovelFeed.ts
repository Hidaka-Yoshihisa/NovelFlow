// src/hooks/useNovelFeed.ts
import { useState, useEffect } from 'react';
import type { NovelWithDetails } from '@/types/database';
import {
  fetchAllNovels,
  toggleNovelLike,
  getLocalUserLikedIds,
  saveLocalUserLikedIds,
  getLocalUserBookmarkedIds,
  saveLocalUserBookmarkedIds,
  getEffectiveUserId,
  getLocalStoredNovels,
  saveLocalStoredNovels,
  mergeNovelCollections,
} from '@/lib/supabase';
import { subscribePublishedNovels } from '@/lib/firestoreService';
import type { UserAccount } from '@/lib/authContext';

interface UseNovelFeedOptions {
  currentUser: UserAccount | null;
}

export function useNovelFeed({ currentUser }: UseNovelFeedOptions) {
  const [shortNovels, setShortNovels] = useState<NovelWithDetails[]>([]);
  const [regularNovels, setRegularNovels] = useState<NovelWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [userLikedIds, setUserLikedIds] = useState<Set<string>>(() =>
    getLocalUserLikedIds(getEffectiveUserId(currentUser))
  );
  const [userBookmarkedIds, setUserBookmarkedIds] = useState<Set<string>>(() =>
    getLocalUserBookmarkedIds(getEffectiveUserId(currentUser))
  );

  // 検索・絞り込みフィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 小説データの読み込み（Firestore + サーバーAPI + ローカルキャッシュを完全統合）
  const loadNovels = async () => {
    try {
      setLoading(true);
      const effectiveUserId = getEffectiveUserId(currentUser);
      const data = await fetchAllNovels(effectiveUserId);
      setShortNovels(data.shortNovels);
      setRegularNovels(data.regularNovels);
      if (data.userLikedIds && Array.isArray(data.userLikedIds)) {
        const nextLikes = new Set(data.userLikedIds);
        setUserLikedIds(nextLikes);
        saveLocalUserLikedIds(nextLikes, effectiveUserId);
      }
    } catch (err) {
      console.error('Failed to load novels:', err);
    } finally {
      setLoading(false);
    }
  };

  // ユーザーID変更時のローカルキャッシュ復元 & 再同期
  useEffect(() => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    setUserLikedIds(getLocalUserLikedIds(effectiveUserId));
    setUserBookmarkedIds(getLocalUserBookmarkedIds(effectiveUserId));
    loadNovels();
  }, [currentUser?.id]);

  // Firebase Firestore リアルタイム購読（開発環境 ais-dev と 共有URL ais-pre の双方で即時反映）
  useEffect(() => {
    const unsubscribe = subscribePublishedNovels((firestoreNovels) => {
      const localList = getLocalStoredNovels();
      const merged = mergeNovelCollections(firestoreNovels, localList);
      setShortNovels(merged.shortNovels);
      setRegularNovels(merged.regularNovels);
      saveLocalStoredNovels([...merged.shortNovels, ...merged.regularNovels]);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // いいね切り替え処理（UI即時楽観的更新 ＋ Firestore & サーバー永続化 ＋ 全端末同期）
  const handleToggleLike = async (
    novelId: string,
    selectedRegularNovel?: NovelWithDetails | null,
    setSelectedRegularNovel?: React.Dispatch<React.SetStateAction<NovelWithDetails | null>>
  ) => {
    const isCurrentlyLiked = userLikedIds.has(novelId);
    const nextUserLikedIds = new Set(userLikedIds);
    if (isCurrentlyLiked) {
      nextUserLikedIds.delete(novelId);
    } else {
      nextUserLikedIds.add(novelId);
    }
    const effectiveUserId = getEffectiveUserId(currentUser);
    setUserLikedIds(nextUserLikedIds);
    saveLocalUserLikedIds(nextUserLikedIds, effectiveUserId);

    const delta = isCurrentlyLiked ? -1 : 1;
    setShortNovels((prev) =>
      prev.map((n) =>
        n.id === novelId ? { ...n, likesCount: Math.max(0, (n.likesCount || 0) + delta) } : n
      )
    );
    setRegularNovels((prev) =>
      prev.map((n) =>
        n.id === novelId ? { ...n, likesCount: Math.max(0, (n.likesCount || 0) + delta) } : n
      )
    );
    if (selectedRegularNovel && selectedRegularNovel.id === novelId && setSelectedRegularNovel) {
      setSelectedRegularNovel((prev) =>
        prev ? { ...prev, likesCount: Math.max(0, (prev.likesCount || 0) + delta) } : null
      );
    }

    try {
      const res = await toggleNovelLike(
        novelId,
        effectiveUserId,
        isCurrentlyLiked ? 'unlike' : 'like'
      );
      setShortNovels((prev) =>
        prev.map((n) => (n.id === novelId ? { ...n, likesCount: res.likesCount } : n))
      );
      setRegularNovels((prev) =>
        prev.map((n) => (n.id === novelId ? { ...n, likesCount: res.likesCount } : n))
      );
      if (selectedRegularNovel && selectedRegularNovel.id === novelId && setSelectedRegularNovel) {
        setSelectedRegularNovel((prev) =>
          prev ? { ...prev, likesCount: res.likesCount } : null
        );
      }
      setUserLikedIds((prev) => {
        const next = new Set(prev);
        if (res.isLiked) next.add(novelId);
        else next.delete(novelId);
        saveLocalUserLikedIds(next, effectiveUserId);
        return next;
      });
    } catch (err) {
      console.error('Failed to sync like:', err);
    }
  };

  // しおり切り替え処理（アカウント固有の同期・永続化）
  const handleToggleBookmark = (novelId: string) => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    const nextBookmarked = !userBookmarkedIds.has(novelId);
    const nextSet = new Set(userBookmarkedIds);
    if (nextBookmarked) nextSet.add(novelId);
    else nextSet.delete(novelId);
    setUserBookmarkedIds(nextSet);
    saveLocalUserBookmarkedIds(nextSet, effectiveUserId);
  };

  // 新規作品投稿完了時の即時反映
  const handleNovelPublished = (
    newNovel: NovelWithDetails,
    onNavigateShort?: (idx: number) => void,
    onNavigateRegular?: (novel: NovelWithDetails) => void
  ) => {
    if (newNovel.type === 'short') {
      setShortNovels((prev) => [newNovel, ...prev.filter((n) => n.id !== newNovel.id)]);
      onNavigateShort?.(0);
    } else {
      setRegularNovels((prev) => [newNovel, ...prev.filter((n) => n.id !== newNovel.id)]);
      onNavigateRegular?.(newNovel);
    }
  };

  // ショート小説の検索フィルタリング
  const filteredShortNovels = shortNovels.filter((novel) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = novel.title.toLowerCase().includes(q);
    const matchesSynopsis = novel.synopsis ? novel.synopsis.toLowerCase().includes(q) : false;
    const matchesAuthor = novel.author?.username ? novel.author.username.toLowerCase().includes(q) : false;
    const matchesCategory = novel.category ? novel.category.toLowerCase().includes(q) : false;
    const matchesContent = novel.pages.some((p) => p.content.toLowerCase().includes(q));
    return matchesTitle || matchesSynopsis || matchesAuthor || matchesCategory || matchesContent;
  });

  // 通常小説の検索＆ジャンルフィルタリング
  const filteredRegularNovels = regularNovels.filter((novel) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      novel.title.toLowerCase().includes(q) ||
      (novel.synopsis && novel.synopsis.toLowerCase().includes(q)) ||
      (novel.author?.username && novel.author.username.toLowerCase().includes(q)) ||
      (novel.category && novel.category.toLowerCase().includes(q)) ||
      novel.pages.some((p) => p.content.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === 'all' || novel.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return {
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
    loadNovels,
    handleToggleLike,
    handleToggleBookmark,
    handleNovelPublished,
  };
}
