// src/features/home/components/ExploreTabView.tsx
import React from 'react';
import { Compass, ArrowUpDown, Heart } from 'lucide-react';
import type { RecommendedNovelItem } from '@/src/hooks/useNovelRecommendation';

interface ExploreTabViewProps {
  recommendedNovels: RecommendedNovelItem[];
  exploreSort: 'recommended' | 'likes' | 'newest';
  setExploreSort: (sort: 'recommended' | 'likes' | 'newest') => void;
  userLikedIds: Set<string>;
  onToggleLike: (novelId: string) => void;
  onOpenMyPage: () => void;
  onSelectShortById: (novelId: string) => void;
  onSelectRegularById: (novelId: string) => void;
}

export function ExploreTabView({
  recommendedNovels,
  exploreSort,
  setExploreSort,
  userLikedIds,
  onToggleLike,
  onOpenMyPage,
  onSelectShortById,
  onSelectRegularById,
}: ExploreTabViewProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ヘッダーエリア */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#142a1e]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[#041a12] shadow-md shadow-emerald-950/50 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-tight">
                おすすめ作品
              </h2>
              <span className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                パーソナライズ推薦
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              いいねした作品・フレーズのカテゴリ傾向から、あなただけの推薦順序をリアルタイム分析
              <button
                onClick={onOpenMyPage}
                className="ml-2 text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
              >
                （マイページで傾向を確認 →）
              </button>
            </p>
          </div>
        </div>

        {/* ソートセレクター */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>並び順:</span>
          </span>
          <div className="flex items-center bg-[#0d1a13] border border-[#163123] rounded-xl p-1 text-xs">
            <button
              onClick={() => setExploreSort('recommended')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                exploreSort === 'recommended'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              おすすめ順
            </button>
            <button
              onClick={() => setExploreSort('likes')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                exploreSort === 'likes'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              いいね人気順
            </button>
            <button
              onClick={() => setExploreSort('newest')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                exploreSort === 'newest'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              新着順
            </button>
          </div>
        </div>
      </div>

      {/* 推薦作品グリッド */}
      {recommendedNovels.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0d1c15] border border-[#183628] text-neutral-400">
          該当する推薦作品はありません
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5">
          {recommendedNovels.map((item) => {
            const isShort = item.novel.type === 'short';
            return (
              <div
                key={`rec-${item.novel.id}`}
                onClick={() => {
                  if (isShort) {
                    onSelectShortById(item.novel.id);
                  } else {
                    onSelectRegularById(item.novel.id);
                  }
                }}
                className="p-5 sm:p-6 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* 推薦バッジ ＆ 作品形式バッジ */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-sans font-bold flex items-center gap-1 ${
                        item.isTopMatch
                          ? 'bg-emerald-700/20 text-emerald-800 border border-emerald-600/40'
                          : 'bg-[#e5d6be] text-[#5e4732] border border-[#cfbdab]'
                      }`}
                    >
                      <span>{item.recommendationTag}</span>
                    </span>

                    <span className="text-[9px] font-sans px-2 py-0.5 rounded bg-[#f0e6d6] text-[#785f47] border border-[#d6c4ad]">
                      {isShort ? 'ショート' : `全${item.novel.pages.length}話`}
                    </span>
                  </div>

                  {/* タイトル */}
                  <h3 className="text-base sm:text-lg font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                    {item.novel.title}
                  </h3>

                  {/* カテゴリ */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2 py-0.5 rounded border border-[#d6c1a5] tracking-wider font-sans">
                      {item.novel.category || 'その他'}
                    </span>
                  </div>

                  {/* あらすじ */}
                  <p className="text-xs sm:text-[13px] text-[#5c4936] mt-2.5 line-clamp-3 leading-relaxed font-serif">
                    {item.novel.synopsis}
                  </p>
                </div>

                {/* フッター（作者情報・いいねボタン・読むボタン） */}
                <div className="pt-3.5 mt-5 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                  <div className="flex items-center gap-2 truncate max-w-[120px]">
                    <img
                      src={item.novel.author?.avatar_url || ''}
                      alt={item.novel.author?.username}
                      className="w-5 h-5 rounded-full object-cover border border-[#c4a984]"
                    />
                    <span className="truncate text-[#3b2d21] text-[11px] font-medium">
                      {item.novel.author?.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* いいねボタン */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(item.novel.id);
                      }}
                      className={`flex items-center gap-1 font-semibold px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        userLikedIds.has(item.novel.id)
                          ? 'text-rose-700 font-bold bg-rose-500/20'
                          : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                      }`}
                      title={userLikedIds.has(item.novel.id) ? 'いいね解除' : 'いいね！'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          userLikedIds.has(item.novel.id)
                            ? 'fill-rose-600 text-rose-600'
                            : 'text-stone-500'
                        }`}
                      />
                      <span>{item.novel.likesCount || 0}</span>
                    </button>

                    <span className="px-2 py-1 rounded bg-[#3b2d21] text-[#f7f3e8] text-[10px] font-bold group-hover:bg-[#5a4431] transition-colors">
                      {isShort ? 'スワイプ' : '読む'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
