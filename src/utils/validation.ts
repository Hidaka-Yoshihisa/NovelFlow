// src/utils/validation.ts
import { z } from 'zod';

/**
 * ページ・章データ入力スキーマ
 */
export const NovelPageInputSchema = z.object({
  page_number: z.number().int().min(1).max(100).optional(),
  chapter_title: z.string().max(100, '章タイトルは100文字以内で入力してください').nullable().optional(),
  content: z
    .string()
    .min(1, '本文を入力してください')
    .max(20000, '1ページあたりの本文は20,000文字以内で入力してください'),
});

/**
 * POST /api/novels - 新規作品投稿ペイロード検証スキーマ
 */
export const CreateNovelSchema = z.object({
  title: z
    .string('タイトルが必要です')
    .trim()
    .min(1, 'タイトルが必要です')
    .max(120, 'タイトルは120文字以内で入力してください'),
  synopsis: z
    .string()
    .max(1000, 'あらすじは1,000文字以内で入力してください')
    .optional()
    .default(''),
  authorName: z
    .string()
    .max(60, 'ペンネームは60文字以内で入力してください')
    .optional()
    .default('名無し作家'),
  type: z.enum(['short', 'regular']).optional().default('short'),
  category: z
    .string()
    .max(50, 'カテゴリは50文字以内で指定してください')
    .optional(),
  pages: z
    .array(NovelPageInputSchema)
    .min(1, '少なくとも1ページ以上の本文が必要です')
    .max(50, '一度に投稿できるページ数は最大50ページです')
    .optional(),
});

/**
 * POST /api/novels/:id/like - いいねトグル検証スキーマ
 */
export const ToggleLikeSchema = z.object({
  userId: z.string().max(128).optional().default('anonymous-user'),
  action: z.enum(['like', 'unlike']).optional(),
});

/**
 * POST /api/phrase-likes - フレーズいいね追加検証スキーマ
 */
export const CreatePhraseLikeSchema = z.object({
  userId: z.string().max(128).optional().default('anonymous-user'),
  novelId: z
    .string('作品IDは必須です')
    .trim()
    .min(1, '作品IDは必須です')
    .max(128),
  novelTitle: z.string().max(120).optional().default('作品'),
  novelCategory: z.string().max(50).optional().default('ショート'),
  authorName: z.string().max(60).optional().default('作者'),
  pageNumber: z
    .union([
      z.number().int().min(1).max(500),
      z
        .string()
        .regex(/^\d+$/)
        .transform((v) => Number(v)),
    ])
    .optional()
    .default(1),
  chapterTitle: z.string().max(100).nullable().optional(),
  phrase: z
    .string('フレーズ内容は必須です')
    .trim()
    .min(1, 'フレーズ内容は必須です')
    .max(500, 'フレーズは500文字以内で指定してください'),
  surroundingContext: z.string().max(500).optional().default(''),
});

/**
 * POST /api/generate - Gemini API 小説・あらすじ生成エンドポイント検証スキーマ
 */
export const GenerateNovelSchema = z.object({
  prompt: z
    .string('生成テーマ・プロンプトは必須です')
    .trim()
    .min(1, '生成テーマ・プロンプトを入力してください')
    .max(500, 'プロンプトは500文字以内で入力してください'),
  category: z.string().max(50).optional().default('ファンタジー'),
  type: z.enum(['short', 'regular']).optional().default('short'),
});

export type CreateNovelInput = z.infer<typeof CreateNovelSchema>;
export type ToggleLikeInput = z.infer<typeof ToggleLikeSchema>;
export type CreatePhraseLikeInput = z.infer<typeof CreatePhraseLikeSchema>;
export type GenerateNovelInput = z.infer<typeof GenerateNovelSchema>;
