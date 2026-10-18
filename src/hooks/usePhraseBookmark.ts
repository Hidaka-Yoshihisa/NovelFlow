// src/hooks/usePhraseBookmark.ts
import { useState, useEffect } from 'react';
import type { PhraseLike } from '@/types/database';
import {
  getLocalUserPhraseLikes,
  fetchUserPhraseLikes,
  createPhraseLike,
  deletePhraseLike,
  getEffectiveUserId,
} from '@/lib/supabase';
import type { UserAccount } from '@/lib/authContext';

interface UsePhraseBookmarkOptions {
  currentUser: UserAccount | null;
}

export function usePhraseBookmark({ currentUser }: UsePhraseBookmarkOptions) {
  const [userPhraseLikes, setUserPhraseLikes] = useState<PhraseLike[]>(() =>
    getLocalUserPhraseLikes(getEffectiveUserId(currentUser))
  );

  // ユーザー切り替え時のローカル復元 ＆ リモート同期
  useEffect(() => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    setUserPhraseLikes(getLocalUserPhraseLikes(effectiveUserId));

    fetchUserPhraseLikes(effectiveUserId).then((likes) => {
      if (Array.isArray(likes)) {
        setUserPhraseLikes(likes);
      }
    });
  }, [currentUser?.id]);

  // フレーズいいねの新規追加（重複登録防止）
  const handleAddPhraseLike = async (params: Omit<PhraseLike, 'id' | 'createdAt'>): Promise<void> => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    const result = await createPhraseLike({ ...params, userId: effectiveUserId });
    setUserPhraseLikes((prev) => {
      const exists = prev.some(
        (p) =>
          p.id === result.id ||
          (p.novelId === result.novelId &&
            p.pageNumber === result.pageNumber &&
            p.phrase.trim() === result.phrase.trim())
      );
      if (exists) return prev;
      return [result, ...prev];
    });
  };

  // フレーズいいねの解除
  const handleRemovePhraseLike = async (id: string) => {
    const effectiveUserId = getEffectiveUserId(currentUser);
    await deletePhraseLike(id, effectiveUserId);
    setUserPhraseLikes((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    userPhraseLikes,
    setUserPhraseLikes,
    handleAddPhraseLike,
    handleRemovePhraseLike,
  };
}
