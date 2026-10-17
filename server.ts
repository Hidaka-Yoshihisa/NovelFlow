import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_SHORT_NOVELS, INITIAL_REGULAR_NOVELS } from './lib/supabase';
import type { NovelWithDetails } from './types/database';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

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
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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
  const clean = rawId.trim();
  if (clean.startsWith('user-')) return clean;
  return `user-${clean}`;
}

function getUserLikedNovelIds(likesData: LikesData, rawUserId: string): string[] {
  if (!rawUserId) return [];
  const normalized = normalizeUserId(rawUserId);
  const bareId = rawUserId.replace(/^user-/, '');
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
  const userId = (req.query.userId as string) || '';
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

// 新規作品投稿（全端末へ共有・永続化）
app.post('/api/novels', (req, res) => {
  try {
    const { title, synopsis, authorName, type, category, pages } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'タイトルが必要です' });
    }

    const novelId = `novel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const authorId = `author-${Date.now()}`;

    const newNovel: NovelWithDetails = {
      id: novelId,
      author_id: authorId,
      title: title.trim(),
      synopsis: synopsis ? synopsis.trim() : '',
      status: 'published',
      type: type === 'regular' ? 'regular' : 'short',
      category: category || (type === 'regular' ? '通常小説' : 'ショート'),
      created_at: new Date().toISOString(),
      author: {
        id: authorId,
        username: authorName ? authorName.trim() : '名無し作家',
        avatar_url:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      likesCount: 0,
      commentsCount: 0,
      tipsTotal: 0,
      pages:
        Array.isArray(pages) && pages.length > 0
          ? pages.map((p: any, idx: number) => ({
              id: `p-${novelId}-${idx + 1}`,
              novel_id: novelId,
              page_number: p.page_number || idx + 1,
              chapter_title: p.chapter_title || null,
              content: p.content || '',
            }))
          : [
              {
                id: `p-${novelId}-1`,
                novel_id: novelId,
                page_number: 1,
                content: synopsis || '本文がありません',
              },
            ],
    };

    const currentNovels = readNovels();
    writeNovels([newNovel, ...currentNovels]);

    res.json({ success: true, novel: newNovel });
  } catch (err: any) {
    console.error('Failed to create novel:', err);
    res.status(500).json({ error: err.message || '投稿に失敗しました' });
  }
});

// いいねの切り替え・保持エンドポイント
app.post('/api/novels/:id/like', (req, res) => {
  try {
    const novelId = req.params.id;
    const rawUserId = req.body.userId || 'anonymous-user';
    const userId = normalizeUserId(rawUserId);
    const bareId = rawUserId.replace(/^user-/, '');
    const action = req.body.action; // 'like' | 'unlike'

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
  const userId = (req.query.userId as string) || 'anonymous-user';
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
    const rawUserId = (req.query.userId as string) || 'anonymous-user';
    const userId = normalizeUserId(rawUserId);
    const novelId = req.query.novelId as string | undefined;

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

// フレーズいいね追加
app.post('/api/phrase-likes', (req, res) => {
  try {
    const rawUserId = req.body.userId || 'anonymous-user';
    const userId = normalizeUserId(rawUserId);
    const {
      novelId,
      novelTitle,
      novelCategory,
      authorName,
      pageNumber,
      chapterTitle,
      phrase,
      surroundingContext,
    } = req.body;

    if (!novelId || !phrase || typeof phrase !== 'string') {
      return res.status(400).json({ error: '作品IDとフレーズ内容は必須です' });
    }

    const all = readPhraseLikes();
    const targetPage = Number(pageNumber) || 1;
    const cleanPhrase = phrase.trim();

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
      novelId,
      novelTitle: novelTitle || '作品',
      novelCategory: novelCategory || 'ショート',
      authorName: authorName || '作者',
      pageNumber: targetPage,
      chapterTitle: chapterTitle || null,
      phrase: cleanPhrase,
      surroundingContext: (surroundingContext || '').slice(0, 300),
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
    const id = req.params.id;
    const rawUserId = (req.query.userId as string) || (req.body?.userId as string);
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
