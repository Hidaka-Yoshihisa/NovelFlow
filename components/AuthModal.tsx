// components/AuthModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, Lock, Sparkles, Check, ArrowRight, UserPlus, LogIn, Users } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'register' | 'login';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'register' }: AuthModalProps) {
  const { register, login, getAllAccounts, switchAccount, currentUser } = useAuth();
  const [mode, setMode] = useState<'register' | 'login' | 'switch'>(defaultMode);

  // フォームステート
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [loginQuery, setLoginQuery] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await register(username, email, bio);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('アカウントを作成しました！');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } else {
      setErrorMessage(res.error || '作成に失敗しました');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await login(loginQuery);
    setLoading(false);

    if (res.success) {
      setSuccessMessage('ログインしました！');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } else {
      setErrorMessage(res.error || 'ログインに失敗しました');
    }
  };

  const allAccounts = getAllAccounts();

  return (
    <AnimatePresence>
      <div
        id="auth-modal-backdrop"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0b1611] border border-[#1b3a2a] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-white"
        >
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ヘッダー */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-[#041a12] shadow-lg shadow-emerald-950/40 font-bold">
              {mode === 'register' ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {mode === 'register' ? 'アカウント新規作成' : mode === 'login' ? 'ログイン' : 'アカウント切り替え'}
              </h2>
              <p className="text-xs text-emerald-400/90 font-medium">
                {mode === 'register'
                  ? 'NovelFlowで読書・投稿・しおり保存を始めよう'
                  : '登録済みのユーザー名またはメールで入室'}
              </p>
            </div>
          </div>

          {/* タブ切り替え */}
          <div className="flex bg-[#08120d] border border-[#14291e] rounded-2xl p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>新規作成</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ログイン</span>
            </button>
            {allAccounts.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setMode('switch');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'switch'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-[#041a12] font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>切替 ({allAccounts.length})</span>
              </button>
            )}
          </div>

          {/* エラー / 成功バナー */}
          {errorMessage && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. 新規アカウント作成フォーム */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  ユーザー名（表示名） <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="例: 文学ねこ, 星空の語り部"
                    className="w-full bg-[#08120d] border border-[#183628] focus:border-emerald-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  メールアドレス <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@novelflow.jp"
                    className="w-full bg-[#08120d] border border-[#183628] focus:border-emerald-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  自己紹介（任意）
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="好きなジャンルや一言..."
                  className="w-full bg-[#08120d] border border-[#183628] focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all resize-none"
                />
              </div>

              <p className="text-[11px] text-neutral-400">
                アカウントを作成すると、読んだ作品のしおりやお気に入り、投稿した作品がマイページで管理できるようになります。
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#041a12] text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>アカウントを作成してログイン</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 2. ログインフォーム */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  ユーザー名 または メールアドレス <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={loginQuery}
                    onChange={(e) => setLoginQuery(e.target.value)}
                    placeholder="登録時のユーザー名またはメール"
                    className="w-full bg-[#08120d] border border-[#183628] focus:border-emerald-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#08120d] border border-[#14291e] rounded-xl text-[11px] text-neutral-400">
                <p className="font-semibold text-neutral-300 mb-1">クイックログイン可能アカウント：</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setLoginQuery(acc.username)}
                      className="px-2 py-0.5 rounded-lg bg-[#0e2118] text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-[10px]"
                    >
                      {acc.username}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-[#041a12] text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>ログインする</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* 3. アカウント切り替え一覧 */}
          {mode === 'switch' && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 mb-2">保存されているアカウント一覧：</p>
              {allAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => {
                    switchAccount(acc.id);
                    setSuccessMessage(`${acc.username} に切り替えました`);
                    setTimeout(() => {
                      setSuccessMessage(null);
                      onClose();
                    }, 800);
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    currentUser?.id === acc.id
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                      : 'bg-[#08120d] border-[#163123] text-neutral-300 hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={acc.username}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{acc.username}</span>
                        {currentUser?.id === acc.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400 text-[#041a12] font-semibold">
                            現在選択中
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400">{acc.email}</div>
                    </div>
                  </div>
                  <button className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
                    選択
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
