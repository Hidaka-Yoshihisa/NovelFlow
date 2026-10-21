// lib/firestoreService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';
import type { NovelWithDetails, PhraseLike } from '@/types/database';
import {
  sanitizeText,
  sanitizeMultilineText,
  sanitizeNovelData,
  sanitizePhraseLikeData,
} from '../src/utils/sanitize';

const NOVELS_COLLECTION = 'novels';
const NOVEL_LIKES_COLLECTION = 'novel_likes';
const PHRASE_LIKES_COLLECTION = 'phrase_likes';

/**
 * FirestoreのID正規表現 ^[a-zA-Z0-9_\-]+$ に適合するようIDを正規化
 */
export function toSafeFirestoreId(rawId: string): string {
  const cleaned = sanitizeText(rawId, 120).replace(/[^a-zA-Z0-9_\-]/g, '-');
  return cleaned || 'anonymous-user';
}

/**
 * Firestoreのルール（isValidNovel）に完全準拠する形にNovelデータを整形
 */
export function formatNovelForFirestore(novel: NovelWithDetails): NovelWithDetails {
  const safe = sanitizeNovelData(novel);
  const safeId = toSafeFirestoreId(safe.id || `novel-${Date.now()}`);
  const safeAuthorId = toSafeFirestoreId(safe.author_id || safe.author?.id || 'author-anon');

  return {
    id: safeId,
    author_id: safeAuthorId,
    title: sanitizeText(safe.title, 120) || '無題の作品',
    synopsis: sanitizeMultilineText(safe.synopsis || '', 1000),
    status: safe.status === 'draft' ? 'draft' : 'published',
    type: safe.type === 'regular' ? 'regular' : 'short',
    category: sanitizeText(safe.category || (safe.type === 'regular' ? '通常小説' : 'ショート'), 50),
    created_at: (safe.created_at || new Date().toISOString()).slice(0, 64),
    author: {
      id: safeAuthorId,
      username: sanitizeText(safe.author?.username || '名無し作家', 60) || '名無し作家',
      avatar_url:
        safe.author?.avatar_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    likesCount: Math.max(0, Number(safe.likesCount) || 0),
    commentsCount: Math.max(0, Number(safe.commentsCount) || 0),
    tipsTotal: Math.max(0, Number(safe.tipsTotal) || 0),
    pages:
      Array.isArray(safe.pages) && safe.pages.length > 0
        ? safe.pages.slice(0, 50).map((p, idx) => ({
            id: toSafeFirestoreId(p.id || `p-${safeId}-${idx + 1}`),
            novel_id: safeId,
            page_number: Number(p.page_number) || idx + 1,
            chapter_title: p.chapter_title ? sanitizeText(p.chapter_title, 100) : null,
            content: sanitizeMultilineText(p.content || '', 20000) || ' ',
          }))
        : [
            {
              id: `p-${safeId}-1`,
              novel_id: safeId,
              page_number: 1,
              chapter_title: null,
              content: sanitizeMultilineText(safe.synopsis || '本文', 20000) || '本文',
            },
          ],
  };
}

/**
 * Firestoreへ作品を保存・公開（開発環境・共有URL・全端末で即時共有）
 */
export async function saveNovelToFirestore(novel: NovelWithDetails): Promise<NovelWithDetails> {
  const formatted = formatNovelForFirestore(novel);
  const docPath = `${NOVELS_COLLECTION}/${formatted.id}`;
  try {
    await setDoc(doc(db, NOVELS_COLLECTION, formatted.id), formatted);
    return formatted;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * ローカルや開発サーバーにのみ存在する投稿作品をFirestoreへ自動マイグレーション
 */
export async function syncLocalNovelsToFirestore(
  localOrServerNovels: NovelWithDetails[]
): Promise<void> {
  if (typeof window === 'undefined' || !localOrServerNovels.length) return;

  try {
    const q = query(
      collection(db, NOVELS_COLLECTION),
      where('status', '==', 'published')
    );
    const snap = await getDocs(q);
    const existingIds = new Set<string>();
    snap.forEach((d) => existingIds.add(d.id));

    for (const novel of localOrServerNovels) {
      const safeId = toSafeFirestoreId(novel.id);
      if (!existingIds.has(safeId)) {
        const formatted = formatNovelForFirestore(novel);
        await setDoc(doc(db, NOVELS_COLLECTION, formatted.id), formatted);
        existingIds.add(formatted.id);
      }
    }
  } catch (error) {
    console.warn('Initial Firestore migration check skipped or failed:', error);
  }
}

/**
 * Firestoreから公開済み作品一覧を取得
 */
export async function fetchNovelsFromFirestore(): Promise<NovelWithDetails[]> {
  try {
    const q = query(
      collection(db, NOVELS_COLLECTION),
      where('status', '==', 'published')
    );
    const snapshot = await getDocs(q);
    const list: NovelWithDetails[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as NovelWithDetails;
      if (data && data.id) {
        list.push(sanitizeNovelData(data));
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, NOVELS_COLLECTION);
  }
}

/**
 * Firestoreの公開作品をリアルタイム購読（onSnapshot）
 */
export function subscribePublishedNovels(
  onUpdate: (novels: NovelWithDetails[]) => void
): () => void {
  const q = query(
    collection(db, NOVELS_COLLECTION),
    where('status', '==', 'published')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: NovelWithDetails[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as NovelWithDetails;
        if (data && data.id) {
          list.push(sanitizeNovelData(data));
        }
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, NOVELS_COLLECTION);
      } catch {
        // Logged by handleFirestoreError
      }
    }
  );
}

/**
 * ユーザーのいいね済み作品ID一覧をFirestoreから取得
 */
export async function fetchUserLikedIdsFromFirestore(rawUserId: string): Promise<string[]> {
  const safeUserId = toSafeFirestoreId(rawUserId);
  try {
    const q = query(
      collection(db, NOVEL_LIKES_COLLECTION),
      where('userId', '==', safeUserId)
    );
    const snap = await getDocs(q);
    const likedIds: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data && data.isLiked === true && typeof data.novelId === 'string') {
        likedIds.push(data.novelId);
      }
    });
    return likedIds;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, NOVEL_LIKES_COLLECTION);
  }
}

/**
 * 作品へのいいねをFirestoreへ記録・集計更新
 */
export async function toggleNovelLikeInFirestore(
  novelId: string,
  rawUserId: string,
  forceAction?: 'like' | 'unlike',
  fallbackNovel?: NovelWithDetails
): Promise<{ likesCount: number; isLiked: boolean }> {
  const safeNovelId = toSafeFirestoreId(novelId);
  const safeUserId = toSafeFirestoreId(rawUserId);
  const likeDocId = toSafeFirestoreId(`${safeNovelId}_${safeUserId}`);
  const likeDocRef = doc(db, NOVEL_LIKES_COLLECTION, likeDocId);
  const novelDocRef = doc(db, NOVELS_COLLECTION, safeNovelId);

  try {
    const existingLikeSnap = await getDoc(likeDocRef);
    const currentlyLiked = existingLikeSnap.exists()
      ? Boolean(existingLikeSnap.data()?.isLiked)
      : false;

    const nextLiked =
      forceAction !== undefined ? forceAction === 'like' : !currentlyLiked;

    const likePayload = {
      novelId: safeNovelId,
      userId: safeUserId,
      isLiked: nextLiked,
      updatedAt: new Date().toISOString().slice(0, 64),
    };

    if (existingLikeSnap.exists()) {
      await updateDoc(likeDocRef, {
        isLiked: nextLiked,
        updatedAt: likePayload.updatedAt,
      });
    } else {
      await setDoc(likeDocRef, likePayload);
    }

    // 対象小説ドキュメントのlikesCountを更新
    const novelSnap = await getDoc(novelDocRef);
    let nextCount = nextLiked ? 1 : 0;

    if (novelSnap.exists()) {
      const currentNovelData = novelSnap.data() as NovelWithDetails;
      const currentCount = Math.max(0, Number(currentNovelData.likesCount) || 0);
      if (currentlyLiked !== nextLiked) {
        nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));
      } else {
        nextCount = currentCount;
      }
      await updateDoc(novelDocRef, {
        likesCount: nextCount,
        commentsCount: Math.max(0, Number(currentNovelData.commentsCount) || 0),
        tipsTotal: Math.max(0, Number(currentNovelData.tipsTotal) || 0),
      });
    } else if (fallbackNovel) {
      const seeded = formatNovelForFirestore({
        ...fallbackNovel,
        likesCount: nextCount,
      });
      await setDoc(novelDocRef, seeded);
    }

    return { likesCount: nextCount, isLiked: nextLiked };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${NOVEL_LIKES_COLLECTION}/${likeDocId}`);
  }
}

/**
 * フレーズいいね一覧をFirestoreから取得
 */
export async function fetchPhraseLikesFromFirestore(
  rawUserId: string,
  novelId?: string
): Promise<PhraseLike[]> {
  const safeUserId = toSafeFirestoreId(rawUserId);
  try {
    const q = query(
      collection(db, PHRASE_LIKES_COLLECTION),
      where('userId', '==', safeUserId)
    );
    const snap = await getDocs(q);
    const list: PhraseLike[] = [];
    snap.forEach((d) => {
      const data = d.data() as PhraseLike;
      if (data && data.id) {
        if (!novelId || data.novelId === novelId) {
          list.push(sanitizePhraseLikeData(data));
        }
      }
    });
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PHRASE_LIKES_COLLECTION);
  }
}

/**
 * フレーズいいねをFirestoreに保存
 */
export async function savePhraseLikeToFirestore(item: PhraseLike): Promise<PhraseLike> {
  const sanitized = sanitizePhraseLikeData(item);
  const safeId = toSafeFirestoreId(sanitized.id || `pl-${Date.now()}`);
  const safeUserId = toSafeFirestoreId(sanitized.userId || 'anonymous-user');
  const safeNovelId = toSafeFirestoreId(sanitized.novelId || 'novel-unknown');

  const payload: PhraseLike = {
    id: safeId,
    userId: safeUserId,
    novelId: safeNovelId,
    novelTitle: sanitizeText(sanitized.novelTitle, 120) || '作品',
    novelCategory: sanitizeText(sanitized.novelCategory, 50) || 'ショート',
    authorName: sanitizeText(sanitized.authorName, 60) || '作者',
    pageNumber: Math.max(1, Math.min(500, Number(sanitized.pageNumber) || 1)),
    chapterTitle: sanitized.chapterTitle ? sanitizeText(sanitized.chapterTitle, 100) : undefined,
    phrase: sanitizeText(sanitized.phrase, 500) || 'フレーズ',
    surroundingContext: sanitized.surroundingContext
      ? sanitizeMultilineText(sanitized.surroundingContext, 500)
      : undefined,
    createdAt: (sanitized.createdAt || new Date().toISOString()).slice(0, 64),
  };

  // undefinedフィールドを除去（Firestoreはundefined値を拒否するため）
  const firestoreDoc: Record<string, any> = {
    id: payload.id,
    userId: payload.userId,
    novelId: payload.novelId,
    novelTitle: payload.novelTitle,
    novelCategory: payload.novelCategory,
    authorName: payload.authorName,
    pageNumber: payload.pageNumber,
    phrase: payload.phrase,
    createdAt: payload.createdAt,
  };
  if (payload.chapterTitle !== undefined) {
    firestoreDoc.chapterTitle = payload.chapterTitle;
  }
  if (payload.surroundingContext !== undefined) {
    firestoreDoc.surroundingContext = payload.surroundingContext;
  }

  try {
    await setDoc(doc(db, PHRASE_LIKES_COLLECTION, safeId), firestoreDoc);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PHRASE_LIKES_COLLECTION}/${safeId}`);
  }
}

/**
 * フレーズいいねをFirestoreから削除
 */
export async function removePhraseLikeFromFirestore(id: string): Promise<void> {
  const safeId = toSafeFirestoreId(id);
  try {
    await deleteDoc(doc(db, PHRASE_LIKES_COLLECTION, safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PHRASE_LIKES_COLLECTION}/${safeId}`);
  }
}
