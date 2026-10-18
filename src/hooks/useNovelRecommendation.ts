// src/hooks/useNovelRecommendation.ts
import { useState, useMemo } from 'react';
import type { NovelWithDetails, PhraseLike } from '@/types/database';

export interface UserCategoryStats {
  scores: Record<string, number>;
  sortedCategories: Array<{ category: string; score: number }>;
  topCategories: string[];
  totalScore: number;
}

export interface RecommendedNovelItem {
  novel: NovelWithDetails;
  recommendationScore: number;
  recommendationTag: string;
  isTopMatch: boolean;
  categoryAffinity: number;
  isLiked: boolean;
}

interface UseNovelRecommendationOptions {
  shortNovels: NovelWithDetails[];
  regularNovels: NovelWithDetails[];
  userLikedIds: Set<string>;
  userPhraseLikes: PhraseLike[];
}

export function useNovelRecommendation({
  shortNovels,
  regularNovels,
  userLikedIds,
  userPhraseLikes,
}: UseNovelRecommendationOptions) {
  // Exploreタブ用ソート
  const [exploreSort, setExploreSort] = useState<'recommended' | 'likes' | 'newest'>('recommended');

  // ユーザーのいいね傾向分析（作品いいね＋フレーズいいねに基づくカテゴリ好感度スコア）
  const userCategoryStats: UserCategoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const allNovels = [...shortNovels, ...regularNovels];

    // 1. 作品いいねからカテゴリ集計（1いいね＝3pt）
    userLikedIds.forEach((id) => {
      const novel = allNovels.find((n) => n.id === id);
      if (novel?.category) {
        counts[novel.category] = (counts[novel.category] || 0) + 3;
      }
    });

    // 2. フレーズいいねからカテゴリ集計（1フレーズいいね＝1pt）
    userPhraseLikes.forEach((item) => {
      if (item.novelCategory) {
        counts[item.novelCategory] = (counts[item.novelCategory] || 0) + 1;
      }
    });

    // スコア降順のカテゴリ配列
    const sortedCategories = Object.entries(counts)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, score]) => ({ category: cat, score }));

    return {
      scores: counts,
      sortedCategories,
      topCategories: sortedCategories.map((c) => c.category),
      totalScore: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  }, [shortNovels, regularNovels, userLikedIds, userPhraseLikes]);

  // Exploreタブ用の動的推薦作品リスト（ユーザーのいいねカテゴリ傾向に基づくリアルタイム推薦順序決定）
  const recommendedNovels: RecommendedNovelItem[] = useMemo(() => {
    const allNovels = [...shortNovels, ...regularNovels];
    const { scores, topCategories, totalScore } = userCategoryStats;

    return allNovels
      .map((novel) => {
        const cat = novel.category || '';
        const catScore = scores[cat] || 0;
        const isLiked = userLikedIds.has(novel.id);
        const baseLikes = novel.likesCount || 0;
        const commentsCount = novel.commentsCount || 0;

        let recommendationScore = 0;
        let recommendationTag = '';
        let isTopMatch = false;

        if (totalScore > 0 && catScore > 0) {
          // ユーザー好みのカテゴリに一致：カテゴリ得点に応じた強力な重み付け
          const rank = topCategories.indexOf(cat);
          recommendationScore += (catScore * 40) + (rank === 0 ? 80 : rank === 1 ? 40 : 20);
          recommendationScore += baseLikes * 2 + commentsCount;

          if (rank === 0) {
            recommendationTag = `🎯 「${cat}」好きのあなたへ`;
            isTopMatch = true;
          } else {
            recommendationTag = `✨ 好みに近い「${cat}」`;
          }
        } else if (totalScore === 0) {
          // コールドスタート（まだいいねが無い場合）：人気度・話題性重視
          recommendationScore = baseLikes * 10 + commentsCount * 5;
          if (baseLikes >= 3) {
            recommendationTag = '🔥 読者に大人気の話題作';
          } else {
            recommendationTag = '🌟 編集部おすすめの注目作';
          }
        } else {
          // ユーザーの好みカテゴリ外：新しいジャンルの発見枠
          recommendationScore = baseLikes * 2 + commentsCount;
          recommendationTag = `🧭 未開拓ジャンル「${cat}」`;
        }

        // 未読・未いいねの作品を少しブーストして新規作品との出会いを後押し
        if (!isLiked && catScore > 0) {
          recommendationScore += 15;
        }

        return {
          novel,
          recommendationScore,
          recommendationTag,
          isTopMatch,
          categoryAffinity: catScore,
          isLiked,
        };
      })
      .sort((a, b) => {
        if (exploreSort === 'likes') {
          return (b.novel.likesCount || 0) - (a.novel.likesCount || 0);
        }
        if (exploreSort === 'newest') {
          return new Date(b.novel.created_at).getTime() - new Date(a.novel.created_at).getTime();
        }
        // デフォルト: 'recommended'（推薦スコア降順）
        return b.recommendationScore - a.recommendationScore;
      });
  }, [
    shortNovels,
    regularNovels,
    userCategoryStats,
    userLikedIds,
    exploreSort,
  ]);

  return {
    exploreSort,
    setExploreSort,
    userCategoryStats,
    recommendedNovels,
  };
}
