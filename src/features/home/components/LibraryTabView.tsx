// src/features/home/components/LibraryTabView.tsx
import React from 'react';
import { BookOpen, Search, X, Layers, Heart } from 'lucide-react';
import type { NovelWithDetails } from '@/types/database';

interface LibraryTabViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredRegularNovels: NovelWithDetails[];
  userLikedIds: Set<string>;
  onToggleLike: (novelId: string) => void;
  onSelectRegular: (novel: NovelWithDetails) => void;
}

export function LibraryTabView({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  filteredRegularNovels,
  userLikedIds,
  onToggleLike,
  onSelectRegular,
}: LibraryTabViewProps) {
  const categoryChips = [
    { id: 'all', label: 'すべて' },
    { id: 'ハイファンタジー', label: 'ファンタジー' },
    { id: 'SF・サイバーパンク', label: 'SF' },
    { id: 'ヒューマンドラマ', label: 'ドラマ' },
    { id: '和風歴史・伝奇', label: '伝奇・和風' },
    { id: 'お仕事・コメディ', label: 'お仕事' },
  ];

  return (
    <div className="w-full">
      <section className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-teal-300" />
              <span>通常小説・連載作品一覧</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              章仕立ての本格小説。目次・しおり・投げ銭対応
            </p>
          </div>

          {/* 検索バー */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 text-emerald-500/70 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="作品名・作者で検索..."
                className="bg-[#0a1510] border border-[#183628] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400 w-full sm:w-72 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 rounded text-neutral-400 hover:text-white"
                  title="クリア"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* カテゴリフィルタ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 text-xs sm:text-sm font-medium scrollbar-none">
          {categoryChips.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                  : 'bg-[#0d1a13] text-neutral-400 border border-[#163123] hover:text-white hover:bg-[#12241b]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 通常小説カード一覧 */}
        {filteredRegularNovels.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0d1c15] border border-[#183628] text-neutral-400">
            該当する通常小説は見つかりませんでした
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRegularNovels.map((novel) => (
              <div
                key={novel.id}
                onClick={() => onSelectRegular(novel)}
                className="p-5 sm:p-6 rounded-2xl parchment-card cursor-pointer transition-all duration-200 hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#201812] font-serif group-hover:text-[#8b6f4e] transition-colors leading-snug">
                      {novel.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-medium text-[#7a5e3f] bg-[#eedec9] px-2.5 py-0.5 rounded border border-[#d6c1a5] tracking-wider font-sans">
                      {novel.category || '通常小説'}
                    </span>
                    <span className="text-xs text-[#73604e] flex items-center gap-1.5 font-sans">
                      <Layers className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      全 {novel.pages.length} 話
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] text-[#5c4936] mt-2.5 line-clamp-4 leading-relaxed font-serif">
                    {novel.synopsis}
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-[#d8c7ad] flex items-center justify-between text-xs text-[#6e5a48] font-sans">
                  <div className="flex items-center gap-2">
                    <img
                      src={novel.author?.avatar_url || ''}
                      alt={novel.author?.username}
                      className="w-6 h-6 rounded-full object-cover border border-[#c4a984]"
                    />
                    <span className="text-[#3b2d21] text-xs font-medium">
                      {novel.author?.username}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(novel.id);
                      }}
                      className={`flex items-center gap-1 font-semibold px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        userLikedIds.has(novel.id)
                          ? 'text-rose-700 font-bold bg-rose-500/20'
                          : 'text-stone-700 hover:text-rose-700 bg-stone-500/10 hover:bg-rose-500/10'
                      }`}
                      title={userLikedIds.has(novel.id) ? 'いいね解除' : 'いいね！'}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-colors ${
                          userLikedIds.has(novel.id)
                            ? 'fill-rose-600 text-rose-600'
                            : 'text-stone-500'
                        }`}
                      />
                      <span>{novel.likesCount || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
