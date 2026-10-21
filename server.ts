import express from 'express';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_SHORT_NOVELS, INITIAL_REGULAR_NOVELS } from './lib/supabase';
import type { NovelWithDetails } from './types/database';
import {
  CreateNovelSchema,
  ToggleLikeSchema,
  CreatePhraseLikeSchema,
  GenerateNovelSchema,
} from './src/utils/validation';
import {
  sanitizeText,
  sanitizeMultilineText,
  sanitizeNovelData,
  sanitizePhraseLikeData,
} from './src/utils/sanitize';

const app = express();
const PORT = 3000;

// Cloud Run 等のリバースプロキシ配下で正しくクライアントIPを識別するための設定
app.set('trust proxy', 1);

// -------------------------------------------------------------
// セキュリティ設定: ペイロードサイズ制限 & レートリミット (express-rate-limit)
// -------------------------------------------------------------
app.use(express.json({ limit: '1mb' }));

// 1. API全般の標準レートリミット（15分あたり最大200リクエスト）
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: 'リクエスト数が多すぎます。しばらく時間をおいてから再度お試しください。',
  },
});

// 2. 投稿・書き込み系エンドポイントのレートリミット（15分あたり最大30回）
const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: '短時間での連続投稿・操作が検出されました。しばらく待ってから再度お試しください。',
  },
});

// 3. Gemini API 呼び出しエンドポイント専用レートリミット（15分あたり最大10回: クォータ枯渇・不正利用防止）
const geminiGenerateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error:
      'AI生成リクエストの制限回数（15分あたり10回）に達しました。クォータ保護のため、しばらく時間をおいてから再度お試しください。',
  },
});

app.use('/api', apiLimiter);

const DATA_DIR = path.join(process.cwd(), 'data');
const NOVELS_FILE = path.join(DATA_DIR, 'novels.json');
const LIKES_FILE = path.join(DATA_DIR, 'likes.json');
const PHRASE_LIKES_FILE = path.join(DATA_DIR, 'phrase_likes.json');

// 初期ストレージの作成（初期いいね数は全作品0に設定）
function initStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(NOVELS_FILE)) {
    const allInitial: NovelWithDetails[] = [
      ...INITIAL_SHORT_NOVELS.map((n) => ({ ...n, likesCount: 0 })),
      ...INITIAL_REGULAR_NOVELS.map((n) => ({ ...n, likesCount: 0 })),
    ];
    fs.writeFileSync(NOVELS_FILE, JSON.stringify(allInitial, null, 2), 'utf-8');
  }

  if (!fs.existsSync(LIKES_FILE)) {
    fs.writeFileSync(
      LIKES_FILE,
      JSON.stringify({ likesCounts: {}, userLikes: {} }, null, 2),
      'utf-8'
    );
  }

  if (!fs.existsSync(PHRASE_LIKES_FILE)) {
    fs.writeFileSync(PHRASE_LIKES_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

initStorage();

function readPhraseLikes(): any[] {
  try {
    if (!fs.existsSync(PHRASE_LIKES_FILE)) return [];
    const raw = fs.readFileSync(PHRASE_LIKES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(sanitizePhraseLikeData) : [];
  } catch (err) {
    console.error('Error reading phrase likes file:', err);
    return [];
  }
}

function writePhraseLikes(data: any[]) {
  try {
    fs.writeFileSync(PHRASE_LIKES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing phrase likes file:', err);
  }
}

function readNovels(): NovelWithDetails[] {
  try {
    const raw = fs.readFileSync(NOVELS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(sanitizeNovelData) : [];
  } catch (err) {
    console.error('Error reading novels file:', err);
    return [];
  }
}

function writeNovels(novels: NovelWithDetails[]) {
  try {
    fs.writeFileSync(NOVELS_FILE, JSON.stringify(novels, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing novels file:', err);
  }
}

interface LikesData {
  likesCounts: Record<string, number>;
  userLikes: Record<string, Record<string, boolean>>;
}

function readLikes(): LikesData {
  try {
    const raw = fs.readFileSync(LIKES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading likes file:', err);
    return { likesCounts: {}, userLikes: {} };
  }
}

function writeLikes(data: LikesData) {
  try {
    fs.writeFileSync(LIKES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing likes file:', err);
  }
}

// -------------------------------------------------------------
// ユーティリティ: ユーザーIDの正規化といいね状態検索
// -------------------------------------------------------------
function normalizeUserId(rawId?: string): string {
  if (!rawId || rawId === 'anonymous-user') return 'anonymous-user';
  const clean = sanitizeText(rawId, 128);
  if (!clean) return 'anonymous-user';
  if (clean.startsWith('user-')) return clean;
  return `user-${clean}`;
}

function getUserLikedNovelIds(likesData: LikesData, rawUserId: string): string[] {
  if (!rawUserId) return [];
  const normalized = normalizeUserId(rawUserId);
  const bareId = sanitizeText(rawUserId, 128).replace(/^user-/, '');
  const candidateKeys = Array.from(new Set([normalized, rawUserId, bareId]));

  const liked = new Set<string>();
  for (const k of candidateKeys) {
    const userMap = likesData.userLikes[k];
    if (userMap && typeof userMap === 'object') {
      for (const [novelId, isLiked] of Object.entries(userMap)) {
        if (isLiked === true) {
          liked.add(novelId);
        } else if (isLiked === false) {
          liked.delete(novelId);
        }
      }
    }
  }
  return Array.from(liked);
}

// -------------------------------------------------------------
// API ルート定義 (Viteミドルウェアの前に配置)
// -------------------------------------------------------------

// 作品一覧取得（別端末からの新規投稿や更新されたいいね数を完全反映）
app.get('/api/novels', (req, res) => {
  const userId = sanitizeText((req.query.userId as string) || '', 128);
  const novels = readNovels();
  const likesData = readLikes();

  // 計算された確実な全ユーザーいいね数（現在有効なtrueのみ）を集計
  const exactCounts: Record<string, number> = {};
  for (const novel of novels) {
    exactCounts[novel.id] = 0;
  }
  for (const uId of Object.keys(likesData.userLikes)) {
    const userMap = likesData.userLikes[uId];
    if (userMap && typeof userMap === 'object') {
      for (const [novelId, isLiked] of Object.entries(userMap)) {
        if (isLiked === true) {
          exactCounts[novelId] = (exactCounts[novelId] || 0) + 1;
        }
      }
    }
  }

  const merged = novels.map((novel) => {
    const count = exactCounts[novel.id] ?? 0;
    return {
      ...novel,
      likesCount: count,
    };
  });

  likesData.likesCounts = exactCounts;
  writeLikes(likesData);
  writeNovels(merged);

  const shortNovels = merged.filter((n) => n.type === 'short');
  const regularNovels = merged.filter((n) => n.type !== 'short');

  const userLikedNovelIds = userId ? getUserLikedNovelIds(likesData, userId) : [];

  res.json({
    shortNovels,
    regularNovels,
    userLikedIds: userLikedNovelIds,
    likesCounts: exactCounts,
  });
});

// 新規作品投稿（Zodスキーマ検証 + DOMPurifyサニタイズ + レートリミット）
app.post('/api/novels', mutationLimiter, (req, res) => {
  try {
    const parsed = CreateNovelSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        error: firstIssue?.message || '入力データが不正です',
        details: parsed.error.issues,
      });
    }

    const { title, synopsis, authorName, type, category, pages } = parsed.data;

    const cleanTitle = sanitizeText(title, 120);
    if (!cleanTitle) {
      return res.status(400).json({ error: '有効なタイトルを入力してください' });
    }

    const cleanSynopsis = sanitizeMultilineText(synopsis, 1000);
    const cleanAuthor = sanitizeText(authorName, 60) || '名無し作家';
    const cleanCategory =
      sanitizeText(category, 50) || (type === 'regular' ? '通常小説' : 'ショート');

    const novelId = `novel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const authorId = `author-${Date.now()}`;

    const sanitizedPages =
      Array.isArray(pages) && pages.length > 0
        ? pages
            .map((p, idx) => ({
              id: `p-${novelId}-${idx + 1}`,
              novel_id: novelId,
              page_number: p.page_number || idx + 1,
              chapter_title: p.chapter_title ? sanitizeText(p.chapter_title, 100) : null,
              content: sanitizeMultilineText(p.content, 20000),
            }))
            .filter((p) => p.content.length > 0)
        : [
            {
              id: `p-${novelId}-1`,
              novel_id: novelId,
              page_number: 1,
              chapter_title: null,
              content: cleanSynopsis || '本文がありません',
            },
          ];

    if (sanitizedPages.length === 0) {
      return res.status(400).json({ error: '有効な本文が必要です' });
    }

    const newNovel: NovelWithDetails = {
      id: novelId,
      author_id: authorId,
      title: cleanTitle,
      synopsis: cleanSynopsis,
      status: 'published',
      type: type === 'regular' ? 'regular' : 'short',
      category: cleanCategory,
      created_at: new Date().toISOString(),
      author: {
        id: authorId,
        username: cleanAuthor,
        avatar_url:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      likesCount: 0,
      commentsCount: 0,
      tipsTotal: 0,
      pages: sanitizedPages,
    };

    const currentNovels = readNovels();
    writeNovels([newNovel, ...currentNovels]);

    res.json({ success: true, novel: newNovel });
  } catch (err: any) {
    console.error('Failed to create novel:', err);
    res.status(500).json({ error: err.message || '投稿に失敗しました' });
  }
});

// いいねの切り替え・保持エンドポイント（Zod検証）
app.post('/api/novels/:id/like', (req, res) => {
  try {
    const novelId = sanitizeText(req.params.id, 128);
    if (!novelId) {
      return res.status(400).json({ error: '不正な作品IDです' });
    }

    const parsed = ToggleLikeSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        error: 'リクエスト形式が不正です',
        details: parsed.error.issues,
      });
    }

    const rawUserId = parsed.data.userId || 'anonymous-user';
    const userId = normalizeUserId(rawUserId);
    const bareId = sanitizeText(rawUserId, 128).replace(/^user-/, '');
    const action = parsed.data.action;

    const likesData = readLikes();

    // 既存の非正規化キー（例: bare dev-xxx）のいいね履歴があれば統合してマイグレーション
    if (bareId !== userId && likesData.userLikes[bareId]) {
      likesData.userLikes[userId] = {
        ...likesData.userLikes[bareId],
        ...(likesData.userLikes[userId] || {}),
      };
      delete likesData.userLikes[bareId];
    }

    if (!likesData.userLikes[userId]) {
      likesData.userLikes[userId] = {};
    }

    const currentlyLiked = Boolean(likesData.userLikes[userId][novelId]);
    let nextLiked: boolean;
    if (action === 'like') {
      nextLiked = true;
    } else if (action === 'unlike') {
      nextLiked = false;
    } else {
      nextLiked = !currentlyLiked;
    }

    likesData.userLikes[userId][novelId] = nextLiked;

    // 全ユーザーのいいねを再集計し、カウンターのズレや不整合を完全に防止
    let totalCount = 0;
    for (const uId of Object.keys(likesData.userLikes)) {
      if (likesData.userLikes[uId]?.[novelId] === true) {
        totalCount++;
      }
    }
    likesData.likesCounts[novelId] = totalCount;

    writeLikes(likesData);

    // novels.jsonにも反映
    const novels = readNovels();
    const targetNovel = novels.find((n) => n.id === novelId);
    if (targetNovel) {
      targetNovel.likesCount = totalCount;
      writeNovels(novels);
    }

    res.json({
      success: true,
      novelId,
      likesCount: totalCount,
      isLiked: nextLiked,
    });
  } catch (err: any) {
    console.error('Failed to toggle like:', err);
    res.status(500).json({ error: err.message || 'いいね処理に失敗しました' });
  }
});

// ユーザーのいいね状態取得
app.get('/api/likes', (req, res) => {
  const userId = sanitizeText((req.query.userId as string) || 'anonymous-user', 128);
  const likesData = readLikes();
  const likedNovelIds = getUserLikedNovelIds(likesData, userId);

  res.json({
    likesCounts: likesData.likesCounts,
    likedNovelIds,
  });
});

// フレーズいいね一覧取得
app.get('/api/phrase-likes', (req, res) => {
  try {
    const rawUserId = sanitizeText((req.query.userId as string) || 'anonymous-user', 128);
    const userId = normalizeUserId(rawUserId);
    const novelId = req.query.novelId ? sanitizeText(req.query.novelId as string, 128) : undefined;

    const all = readPhraseLikes();
    const filtered = all.filter((item) => {
      const itemUserId = normalizeUserId(item.userId);
      const matchesUser = itemUserId === userId;
      const matchesNovel = novelId ? item.novelId === novelId : true;
      return matchesUser && matchesNovel;
    });

    res.json({ phraseLikes: filtered });
  } catch (err: any) {
    console.error('Failed to get phrase likes:', err);
    res.status(500).json({ error: 'フレーズいいねの取得に失敗しました' });
  }
});

// フレーズいいね追加（Zodスキーマ検証 + DOMPurifyサニタイズ + レートリミット）
app.post('/api/phrase-likes', mutationLimiter, (req, res) => {
  try {
    const parsed = CreatePhraseLikeSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        error: firstIssue?.message || '作品IDとフレーズ内容は必須です',
        details: parsed.error.issues,
      });
    }

    const {
      userId: rawUserId,
      novelId,
      novelTitle,
      novelCategory,
      authorName,
      pageNumber,
      chapterTitle,
      phrase,
      surroundingContext,
    } = parsed.data;

    const userId = normalizeUserId(rawUserId);
    const cleanPhrase = sanitizeText(phrase, 500);
    if (!cleanPhrase) {
      return res.status(400).json({ error: '有効なフレーズ内容を指定してください' });
    }

    const all = readPhraseLikes();
    const targetPage = Number(pageNumber) || 1;

    const existing = all.find(
      (item) =>
        normalizeUserId(item.userId) === userId &&
        item.novelId === novelId &&
        item.pageNumber === targetPage &&
        item.phrase.trim() === cleanPhrase
    );

    if (existing) {
      return res.json({ success: true, phraseLike: existing, isNew: false });
    }

    const newPhraseLike = {
      id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      novelId: sanitizeText(novelId, 128),
      novelTitle: sanitizeText(novelTitle, 120) || '作品',
      novelCategory: sanitizeText(novelCategory, 50) || 'ショート',
      authorName: sanitizeText(authorName, 60) || '作者',
      pageNumber: targetPage,
      chapterTitle: chapterTitle ? sanitizeText(chapterTitle, 100) : null,
      phrase: cleanPhrase,
      surroundingContext: sanitizeMultilineText(surroundingContext, 300),
      createdAt: new Date().toISOString(),
    };

    all.unshift(newPhraseLike);
    writePhraseLikes(all);

    res.json({ success: true, phraseLike: newPhraseLike, isNew: true });
  } catch (err: any) {
    console.error('Failed to add phrase like:', err);
    res.status(500).json({ error: 'フレーズいいねの保存に失敗しました' });
  }
});

// フレーズいいね解除
app.delete('/api/phrase-likes/:id', (req, res) => {
  try {
    const id = sanitizeText(req.params.id, 128);
    const rawUserId =
      (req.query.userId as string) || (req.body?.userId as string) || undefined;
    const userId = rawUserId ? normalizeUserId(rawUserId) : undefined;

    const all = readPhraseLikes();
    const initialLen = all.length;
    const updated = all.filter((item) => {
      if (item.id !== id) return true;
      if (userId && normalizeUserId(item.userId) !== userId) return true;
      return false;
    });

    writePhraseLikes(updated);
    res.json({ success: true, id, removed: updated.length < initialLen });
  } catch (err: any) {
    console.error('Failed to delete phrase like:', err);
    res.status(500).json({ error: 'フレーズいいねの解除に失敗しました' });
  }
});

// Gemini API 小説生成エンドポイント（厳格なレートリミット + Zodスキーマ検証 + DOMPurifyサニタイズ）
app.post('/api/generate', geminiGenerateLimiter, async (req, res) => {
  try {
    const parsed = GenerateNovelSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        error: firstIssue?.message || '不正な生成リクエストです',
        details: parsed.error.issues,
      });
    }

    const cleanPrompt = sanitizeText(parsed.data.prompt, 500);
    const cleanCategory = sanitizeText(parsed.data.category, 50) || 'ファンタジー';
    const novelType = parsed.data.type;

    if (!cleanPrompt) {
      return res.status(400).json({ error: '有効なプロンプトを入力してください' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'サーバー側で GEMINI_API_KEY が設定されていません。',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `カテゴリ「${cleanCategory}」の${
        novelType === 'regular' ? '連載小説の導入章' : '3ページ構成のショート小説'
      }を執筆してください。\nテーマ・キーワード: ${cleanPrompt}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: '小説のタイトル（120文字以内）' },
            synopsis: { type: Type.STRING, description: '魅力的なあらすじ（300文字以内）' },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapter_title: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ['content'],
              },
            },
          },
          required: ['title', 'synopsis', 'pages'],
        },
      },
    });

    const rawJson = response.text || '{}';
    const generated = JSON.parse(rawJson);

    return res.json({
      success: true,
      result: {
        title: sanitizeText(generated.title, 120),
        synopsis: sanitizeMultilineText(generated.synopsis, 1000),
        pages: Array.isArray(generated.pages)
          ? generated.pages.map((p: any, idx: number) => ({
              page_number: idx + 1,
              chapter_title: p.chapter_title ? sanitizeText(p.chapter_title, 100) : `ページ${idx + 1}`,
              content: sanitizeMultilineText(p.content, 20000),
            }))
          : [],
      },
    });
  } catch (err: any) {
    console.error('Gemini generation error:', err);
    return res.status(500).json({
      error: 'AI生成処理中にエラーが発生しました。しばらく待ってから再度お試しください。',
    });
  }
});

// -------------------------------------------------------------
// Vite ミドルウェア・サーバー起動
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
