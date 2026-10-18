// src/features/home/components/HomeTabView.tsx
import React from 'react';
import { Search, Flame, BookOpen, Heart, Layers, X } from 'lucide-react';
import type { NovelWithDetails } from '@/types/database';

interface HomeTabViewProps {
  searchQuery: string;
  onClearSearch: () => void;
  shortNovels: NovelWithDetails[];
  regularNovels: NovelWithDetails[];
  filteredShortNovels: NovelWithDetails[];
  filteredRegularNovels: NovelWithDetails[];
  userLikedIds: Set<string>;
  onToggleLike: (novelId: string) => void;
  onSelectShort: (index: number) => void;
  onSelectRegular: (novel: NovelWithDetails) => void;
}

export function HomeTabView({
  searchQuery,
  onClearSearch,
  shortNovels,
  regularNovels,
  filteredShortNovels,
  filteredRegularNovels,
  userLikedIds,
  onToggleLike,
  onSelectShort,
  onSelectRegular,
}: HomeTabViewProps) {
  const displayShorts = searchQuery.trim() ? filteredShortNovels : shortNovels;
  const displayRegulars = searchQuery.trim() ? filteredRegularNovels : regularNovels;

  return (
    <div className="space-y-8">
      {/* 検索結果ステータスバナー（検索クエリがある場合） */}
      {searchQuery.trim() && (
        <div className="p-4 rounded-2xl bg-[#0d1c15] border border-[#183628] flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-white">
              「<span className="text-emerald-300 font-bold">{searchQuery}</span>」の検索結果:
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
              ショート {filteredShortNovels.length} 件
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-medium">
              通常小説 {filteredRegularNovels.length} 件
            </span>
          </div>
          <button
            onClick={onClearSearch}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#14291e] hover:bg-[#1b3a2a] text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>検索をクリア</span>
          </button>
        </div>
      )}

      {/* 検索結果がどちらも0件の場合 */}
      {searchQuery.trim() && filteredShortNovels.length === 0 && filteredRegularNovels.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0d1c15] border border-[#183628] text-neutral-400 space-y-3">
          <Search className="w-10 h-10 mx-auto text-emerald-700" />
          <h3 className="text-base font-bold text-white">該当する作品が見つかりませんでした</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            「{searchQuery}」に一致するショート小説または通常小説はありません。別のキーワードをお試しいただくか、検索をクリアしてください。
          </p>
          <button
            onClick={onClearSearch}
            className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] text-xs font-bold hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>すべての作品を表示する</span>
          </button>
        </div>
      ) : (
        <>
          {/* ショート小説セクション */}
          {(!searchQuery.trim() || filteredShortNovels.length > 0) && (
            <section>
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#142a1e]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-[#041a12] shadow-sm shrink-0">
                    <Flame className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                      ショート小説
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      1話完結・サクッと読める超短編。カードをタップして全画面リーダーで次々にスワイプ
                    </p>
                  </div>
                </div>
              </div>

              {/* ショート小説グリッド */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {displayShorts.map((novel) => {
                  const originalIdx = shortNovels.findIndex((n) => n.id === novel.id);
                  return (
                    <div
                      key={novel.id}
                      onClick={() => onSelectShort(originalIdx >= 0 ? originalIdx : 0)}
                      className="p-5 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between min-h-[220px] relative overflow-hidden"
                    >
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug line-clamp-2">
                          {novel.title}
                        </h3>

                        <div className="mt-1.5 flex items-center">
                          <span className="text-[9px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2 py-0.5 rounded border border-[#d6c1a5] tracking-wider font-sans">
                            {novel.category || 'ショート'}
                          </span>
                        </div>

                        <p className="text-xs text-[#5c4936] mt-2 line-clamp-3 leading-relaxed font-serif">
                          {novel.synopsis}
                        </p>
                      </div>

                      <div className="pt-3 mt-4 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                        <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8b6f4e]" />
                          <span className="truncate text-[#3b2d21] text-[11px] font-medium">
                            {novel.author?.username}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(novel.id);
                          }}
                          className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                            userLikedIds.has(novel.id)
                              ? 'text-rose-700 font-bold bg-rose-500/20'
                              : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                          }`}
                          title={userLikedIds.has(novel.id) ? 'いいね解除' : 'いいね！'}
                        >
                          <Heart
                            className={`w-3 h-3 transition-colors ${
                              userLikedIds.has(novel.id) ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                            }`}
                          />
                          <span>{novel.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 通常小説（長編・連載）ピックアップ */}
          {(!searchQuery.trim() || filteredRegularNovels.length > 0) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-300" />
                  <div>
                    <h2 className="text-base font-bold text-white font-serif">
                      {searchQuery.trim()
                        ? '関連する通常小説'
                        : '人気・連載中の通常小説'}
                    </h2>
                    <p className="text-[11px] text-neutral-400">
                      章仕立ての重厚なストーリー。目次・しおり・投げ銭に対応
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayRegulars.map((novel) => (
                  <div
                    key={novel.id}
                    onClick={() => onSelectRegular(novel)}
                    className="p-5 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug">
                          {novel.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2 py-0.5 rounded border border-[#d6c1a5] tracking-wider font-sans">
                          {novel.category || '通常小説'}
                        </span>
                        <span className="text-[11px] text-[#73604e] flex items-center gap-1 font-sans">
                          <Layers className="w-3 h-3 text-[#8b6f4e]" />
                          全 {novel.pages.length} 話
                        </span>
                      </div>

                      <p className="text-xs text-[#5c4936] mt-2 line-clamp-3 leading-relaxed font-serif">
                        {novel.synopsis}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                      <div className="flex items-center gap-2">
                        <img
                          src={novel.author?.avatar_url || ''}
                          alt={novel.author?.username}
                          className="w-6 h-6 rounded-full object-cover border border-[#c4a984]"
                        />
                        <span className="text-[#3b2d21] text-[11px] font-medium">
                          {novel.author?.username}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(novel.id);
                          }}
                          className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer ${
                            userLikedIds.has(novel.id)
                              ? 'text-rose-700 font-bold bg-rose-500/20'
                              : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                          }`}
                          title={userLikedIds.has(novel.id) ? 'いいね解除' : 'いいね！'}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-colors ${
                              userLikedIds.has(novel.id) ? 'fill-rose-600 text-rose-600' : 'text-stone-500'
                            }`}
                          />
                          <span>{novel.likesCount || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
