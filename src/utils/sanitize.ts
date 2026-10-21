// src/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
import type { NovelWithDetails, PhraseLike } from '@/types/database';

/**
 * 単一行テキスト（タイトル・著者名・カテゴリ・フレーズ等）のXSSサニタイズ処理
 * DOMPurifyによりすべてのHTMLタグ・属性・スクリプトを除去し、プレーンテキストとして安全化します。
 */
export function sanitizeText(input: string | null | undefined, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';

  // DOMPurifyでHTMLタグ・スクリプト要素を完全除去
  const purified = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // 制御文字（改行・タブ以外）を除去しトリム
  const cleaned = purified
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  return maxLength > 0 ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * 複数行テキスト（小説本文・あらすじ等）のXSSサニタイズ処理
 * 改行・段落構造を維持したまま、悪意あるHTMLタグやイベントハンドラを無害化します。
 */
export function sanitizeMultilineText(input: string | null | undefined, maxLength = 20000): string {
  if (!input || typeof input !== 'string') return '';

  const purified = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  const cleaned = purified
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  return maxLength > 0 ? cleaned.slice(0, maxLength) : cleaned;
}

/**
 * 小説オブジェクト全体のサニタイズ（表示前・保存前の二重防御用）
 */
export function sanitizeNovelData(novel: NovelWithDetails): NovelWithDetails {
  return {
    ...novel,
    title: sanitizeText(novel.title, 120) || '無題の作品',
    synopsis: sanitizeMultilineText(novel.synopsis, 1000),
    category: sanitizeText(novel.category, 50) || 'その他',
    author: novel.author
      ? {
          ...novel.author,
          username: sanitizeText(novel.author.username, 60) || '名無し作家',
        }
      : novel.author,
    pages: Array.isArray(novel.pages)
      ? novel.pages.map((p) => ({
          ...p,
          chapter_title: p.chapter_title ? sanitizeText(p.chapter_title, 100) : null,
          content: sanitizeMultilineText(p.content, 20000),
        }))
      : [],
  };
}

/**
 * フレーズいいねデータのサニタイズ
 */
export function sanitizePhraseLikeData(item: PhraseLike): PhraseLike {
  return {
    ...item,
    novelTitle: sanitizeText(item.novelTitle, 120),
    novelCategory: sanitizeText(item.novelCategory, 50),
    authorName: sanitizeText(item.authorName, 60),
    chapterTitle: item.chapterTitle ? sanitizeText(item.chapterTitle, 100) : undefined,
    phrase: sanitizeText(item.phrase, 500),
    surroundingContext: item.surroundingContext
      ? sanitizeMultilineText(item.surroundingContext, 500)
      : undefined,
  };
}
