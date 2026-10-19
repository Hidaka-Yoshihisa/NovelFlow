// src/features/guide/FeatureGuideModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Flame,
  Quote,
  Compass,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Heart,
  Smartphone,
  PenTool,
  Coins,
  Sparkles,
} from 'lucide-react';
import { AppIcon } from '@/components/AppIcon';

export const GUIDE_STORAGE_KEY = 'novelflow_guide_dismissed';

interface FeatureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart?: () => void;
  onOpenShorts?: () => void;
}

export default function FeatureGuideModal({
  isOpen,
  onClose,
  onStart,
  onOpenShorts,
}: FeatureGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  // 視覚的に直感理解できるミニマル・グラフィック設計（冗長なテキストエリアを全撤去）
  const steps = [
    {
      id: 'shorts',
      title: '縦スワイプで次々読める',
      icon: Flame,
      iconColor: 'text-amber-400',
      illustration: (
        <div className="relative w-full max-w-lg mx-auto rounded-2xl bg-[#0c1f16] border border-emerald-500/25 p-5 sm:p-6 flex flex-col items-center justify-center overflow-hidden shadow-xl min-h-[260px] sm:min-h-[280px]">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

          {/* 3つの直感ジェスチャーアイコン */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
            <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#07150f] border border-emerald-500/20 text-center shadow-md">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center text-xl sm:text-2xl font-black mb-2 animate-bounce">
                ↑
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">縦スワイプ</span>
              <span className="text-[11px] text-amber-300/90 font-medium mt-0.5">次の作品へ</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#07150f] border border-emerald-500/20 text-center shadow-md">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-teal-500/15 text-teal-300 flex items-center justify-center text-xl sm:text-2xl font-black mb-2">
                ⇄
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">左右タップ</span>
              <span className="text-[11px] text-teal-300/90 font-medium mt-0.5">ページめくり</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#07150f] border border-emerald-500/20 text-center shadow-md">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2">
                <Heart className="w-7 h-7 fill-rose-500 animate-pulse" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">ダブルタップ</span>
              <span className="text-[11px] text-rose-300/90 font-medium mt-0.5">いいね！</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>スマホ・PCどちらでも快適操作</span>
          </div>
        </div>
      ),
    },
    {
      id: 'phrases',
      title: '心に刺さった一行に「いいね」',
      icon: Quote,
      iconColor: 'text-rose-400',
      illustration: (
        <div className="relative w-full max-w-lg mx-auto rounded-2xl bg-[#0c1f16] border border-emerald-500/25 p-5 sm:p-6 flex flex-col items-center justify-center overflow-hidden shadow-xl min-h-[260px] sm:min-h-[280px]">
          <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full bg-rose-500/15 blur-2xl pointer-events-none" />

          {/* 羊皮紙カードのハイライトビジュアル */}
          <div className="w-full parchment-card p-4 sm:p-5 rounded-2xl border border-[#d5c2a5] relative shadow-lg my-auto">
            <p className="text-xs sm:text-sm text-neutral-800 font-serif leading-relaxed text-center">
              夜の帳が静かに下りるとき、
              <span className="bg-amber-200/95 text-amber-950 px-1.5 py-0.5 rounded font-bold border-b-2 border-amber-500/80 shadow-sm mx-1 inline-block">
                見上げた星の光だけが本当の言葉を知っていた。
              </span>
            </p>

            {/* フローティング「フレーズいいね」ポップアップ */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#091710] text-rose-300 border border-rose-500/60 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl animate-pulse">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              <span>フレーズいいね！</span>
            </div>
          </div>

          {/* 2つのグラフィカルバッジ */}
          <div className="flex items-center gap-3 mt-4 pt-1">
            <span className="px-3 py-1 rounded-full bg-[#07150f] border border-emerald-500/20 text-xs text-neutral-300 flex items-center gap-1.5">
              <span className="text-amber-400">✨</span> なぞって選択
            </span>
            <span className="px-3 py-1 rounded-full bg-[#07150f] border border-emerald-500/20 text-xs text-neutral-300 flex items-center gap-1.5">
              <span className="text-rose-400">💛</span> マイページに保存
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'recommendation',
      title: '好みを自動分析「おすすめ」',
      icon: Compass,
      iconColor: 'text-teal-400',
      illustration: (
        <div className="relative w-full max-w-lg mx-auto rounded-2xl bg-[#0c1f16] border border-emerald-500/25 p-5 sm:p-6 flex flex-col items-center justify-center overflow-hidden shadow-xl min-h-[260px] sm:min-h-[280px]">
          <div className="absolute right-0 bottom-0 w-40 h-40 rounded-full bg-teal-500/15 blur-2xl pointer-events-none" />

          {/* 親和性スコアビジュアル */}
          <div className="w-full space-y-3 my-auto max-w-sm">
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <span className="text-amber-400">👑</span> ファンタジー
                </span>
                <span className="text-teal-300 font-mono">94%</span>
              </div>
              <div className="w-full bg-[#05110a] h-2.5 rounded-full overflow-hidden border border-emerald-500/30">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[94%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-neutral-200 flex items-center gap-1.5">
                  <span className="text-teal-400">★</span> 恋愛・青春
                </span>
                <span className="text-teal-300 font-mono font-bold">82%</span>
              </div>
              <div className="w-full bg-[#05110a] h-2.5 rounded-full overflow-hidden border border-emerald-500/30">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full w-[82%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-neutral-300 flex items-center gap-1.5">
                  <span className="text-neutral-400">•</span> SF・ミステリー
                </span>
                <span className="text-teal-400 font-mono font-bold">68%</span>
              </div>
              <div className="w-full bg-[#05110a] h-2.5 rounded-full overflow-hidden border border-emerald-500/30">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full w-[68%]" />
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-teal-300/90 font-medium flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span>「おすすめ」タブであなたに合う作品をお届け</span>
          </div>
        </div>
      ),
    },
    {
      id: 'creation',
      title: '「長編読書」と「作品投稿」',
      icon: BookOpen,
      iconColor: 'text-emerald-400',
      illustration: (
        <div className="relative w-full max-w-lg mx-auto rounded-2xl bg-[#0c1f16] border border-emerald-500/25 p-5 sm:p-6 flex flex-col items-center justify-center overflow-hidden shadow-xl min-h-[260px] sm:min-h-[280px]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* 2つの機能カード */}
          <div className="grid grid-cols-2 gap-3 w-full my-auto">
            <div className="p-3.5 rounded-2xl bg-[#07160f] border border-emerald-500/25 text-center flex flex-col items-center justify-center shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">長編小説</span>
              <span className="text-[10px] sm:text-xs text-neutral-300 mt-1">
                目次 & 文字サイズ調整
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#07160f] border border-emerald-500/25 text-center flex flex-col items-center justify-center shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2">
                <PenTool className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">作品投稿</span>
              <span className="text-[10px] sm:text-xs text-neutral-300 mt-1">
                誰でも公開 & チップ応援
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>読者も作家も楽しめるプラットフォーム</span>
          </div>
        </div>
      ),
    },
  ];

  // キーボードナビゲーション
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  // モーダルを閉じる処理
  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
      } catch (err) {
        console.warn('localStorage error:', err);
      }
    } else {
      try {
        localStorage.removeItem(GUIDE_STORAGE_KEY);
      } catch (err) {
        console.warn('localStorage error:', err);
      }
    }
    onClose();
  };

  // 「今後表示しない」で一発で閉じる
  const handleNeverShowAgain = () => {
    try {
      localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
    } catch (err) {
      console.warn('localStorage error:', err);
    }
    onClose();
  };

  // 「始める」ボタン押下時: ガイドを終了しホーム画面へ遷移
  const handleStartExperience = () => {
    handleDismiss();
    if (onStart) {
      onStart();
    } else if (onOpenShorts) {
      onOpenShorts();
    }
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl bg-gradient-to-b from-[#0e2017] via-[#091610] to-[#060e0a] border border-emerald-500/30 rounded-3xl shadow-2xl shadow-emerald-950/90 overflow-hidden flex flex-col my-auto"
        >
          {/* 天面アクセントライン */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

          {/* ヘッダーエリア（冗長な説明文を省きスッキリ整理） */}
          <div className="px-5 py-4 border-b border-emerald-500/15 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <AppIcon className="w-8 h-8 shadow-md" roundedClassName="rounded-xl" />
              <h2 className="text-base font-bold text-white tracking-wide font-serif">
                NovelFlow の使い方
              </h2>
            </div>

            {/* 閉じるボタン */}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ステップ進捗インジケーター */}
          <div className="px-5 sm:px-6 pt-3 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentStep
                      ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-300'
                      : idx < currentStep
                      ? 'w-3 bg-emerald-700/60'
                      : 'w-3 bg-neutral-800'
                  }`}
                  aria-label={`ステップ ${idx + 1}`}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              <strong className="text-emerald-400">{currentStep + 1}</strong> / {steps.length}
            </span>
          </div>

          {/* コンテンツスライド */}
          <div className="p-5 sm:p-6 pt-2 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepData.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {/* 視覚的タイトル */}
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <StepIcon className={`w-5 h-5 ${currentStepData.iconColor} shrink-0`} />
                  <span>{currentStepData.title}</span>
                </h3>

                {/* 視覚的グラフィック */}
                {currentStepData.illustration}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* フッター操作バー */}
          <div className="p-4 sm:p-5 bg-[#050c08] border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* チェックボックス: 今後表示しない */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <label className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                />
                <span>次回以降は表示しない</span>
              </label>

              <button
                type="button"
                onClick={handleNeverShowAgain}
                className="text-[11px] text-neutral-400 hover:text-neutral-300 underline underline-offset-2 sm:hidden cursor-pointer"
              >
                今後表示しない
              </button>
            </div>

            {/* ナビゲーションボタン群 */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> 前へ
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    スキップ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-950/50 hover:brightness-110 transition-all cursor-pointer"
                  >
                    次へ <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleStartExperience}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-[#041a12] text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-950/70 hover:brightness-110 transition-all cursor-pointer group"
                >
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  始める
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
