import React from 'react';

interface AppIconProps {
  className?: string;
  size?: number;
  roundedClassName?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  className = 'w-9 h-9',
  roundedClassName = 'rounded-xl',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-emerald-950/60 border border-emerald-500/30 ${roundedClassName} ${className}`}
      style={{
        background: 'linear-gradient(145deg, #1b6348 0%, #104e37 40%, #083324 85%, #052117 100%)',
      }}
    >
      {/* 表面トップのソフトハイライト */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 35% 15%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.03) 60%, transparent 100%)',
        }}
      />
      {/* 内側の極細ベベル線 */}
      <div className={`absolute inset-0 pointer-events-none border border-white/20 ${roundedClassName}`} />

      {/* 開いた本のベクターマーク（ユーザー提供アイコンを精密再現） */}
      <svg
        viewBox="0 0 100 100"
        className="w-[66%] h-[66%] text-white drop-shadow-[0_2px_4px_rgba(2,20,13,0.8)] relative z-10"
        fill="currentColor"
      >
        {/* 下層ページ（紙の厚み・立体的な重なり） */}
        <path
          d="M 18 33 C 18 33 16 66 20 70 C 25 74 36 76 48 77 L 48 74 C 36 73 26 71 23 68 C 21 66 21 33 21 33 Z"
          fill="#c0ccc6"
        />
        <path
          d="M 82 33 C 82 33 84 66 80 70 C 75 74 64 76 52 77 L 52 74 C 64 73 74 71 77 68 C 79 66 79 33 79 33 Z"
          fill="#c0ccc6"
        />

        {/* メインの左ページ（純白） */}
        <path
          d="M 21 28 C 31 30 42 33 49 36 L 49 71 C 42 67 31 64 21 62 Z"
          fill="#ffffff"
        />
        {/* メインの右ページ（純白） */}
        <path
          d="M 79 28 C 69 30 58 33 51 36 L 51 71 C 58 67 69 64 79 62 Z"
          fill="#ffffff"
        />

        {/* 見開き中央の溝（ソフトな影） */}
        <path
          d="M 49 36 L 51 36 L 51 71 L 49 71 Z"
          fill="#134734"
          opacity="0.25"
        />

        {/* 左ページのテキストライン（深緑のライン） */}
        <g fill="#0e4b36">
          <rect x="26" y="36" width="16" height="2" rx="1" />
          <rect x="26" y="41.5" width="16" height="2" rx="1" />
          <rect x="26" y="47" width="16" height="2" rx="1" />
          <rect x="26" y="52.5" width="16" height="2" rx="1" />
          <rect x="26" y="58" width="16" height="2" rx="1" />
        </g>

        {/* 右ページのテキストライン（深緑のライン） */}
        <g fill="#0e4b36">
          <rect x="58" y="36" width="16" height="2" rx="1" />
          <rect x="58" y="41.5" width="16" height="2" rx="1" />
          <rect x="58" y="47" width="16" height="2" rx="1" />
          <rect x="58" y="52.5" width="16" height="2" rx="1" />
          <rect x="58" y="58" width="16" height="2" rx="1" />
        </g>
      </svg>
    </div>
  );
};
