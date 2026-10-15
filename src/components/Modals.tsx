import React from 'react';
import { Play, RotateCcw, Home, Trophy, Star, Zap, Gauge, Flame } from 'lucide-react';

export interface PauseModalProps {
  lang: 'ar' | 'en';
  onResume: () => void;
  onRestart: () => void;
  onGarage: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  lang,
  onResume,
  onRestart,
  onGarage,
}) => {
  const isAr = lang === 'ar';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-neutral-950/80 pointer-events-auto">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        <h2 className="text-2xl sm:text-3xl font-black font-['Rajdhani',sans-serif] tracking-wider text-amber-400 mb-6 uppercase flex items-center gap-2">
          <Flame className="w-6 h-6" />
          {isAr ? 'اللعبة متوقفة مؤقتاً' : 'GAME PAUSED'}
        </h2>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            <span>{isAr ? 'استئناف اللعب' : 'Resume'}</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-neutral-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isAr ? 'إعادة الجولة' : 'Restart Round'}</span>
          </button>

          <button
            onClick={onGarage}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-neutral-700"
          >
            <Home className="w-4 h-4" />
            <span>{isAr ? 'العودة للكراج' : 'Garage & Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export interface GameOverModalProps {
  lang: 'ar' | 'en';
  score: number;
  maxCombo: number;
  topSpeed: number;
  longestDrift: number;
  isVictory: boolean;
  onPlayAgain: () => void;
  onGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  lang,
  score,
  maxCombo,
  topSpeed,
  longestDrift,
  isVictory,
  onPlayAgain,
  onGarage,
}) => {
  const isAr = lang === 'ar';

  // Calculate star rating (1 to 3 stars based on score)
  let stars = 1;
  if (score >= 40000) stars = 3;
  else if (score >= 20000) stars = 2;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-neutral-950/85 pointer-events-auto">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Title & Badge */}
        <div className="flex items-center gap-1.5 mb-2">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`w-7 h-7 sm:w-8 sm:h-8 ${
                s <= stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                  : 'text-neutral-700'
              }`}
            />
          ))}
        </div>

        <h2 className="text-3xl sm:text-4xl font-black font-['Rajdhani',sans-serif] tracking-wider text-white uppercase mb-1">
          {isVictory
            ? isAr
              ? 'أداء أسطوري!'
              : 'LEGENDARY DRIFT!'
            : isAr
            ? 'انتهت الجولة'
            : 'ROUND COMPLETE'}
        </h2>

        <p className="text-xs sm:text-sm text-neutral-400 mb-6 text-center">
          {isAr
            ? 'تفاصيل الدريفت والانزلاق المحقق خلال الجولة'
            : 'Run telemetry & drift performance metrics'}
        </p>

        {/* Big Score Callout */}
        <div className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex flex-col items-center mb-6">
          <span className="text-xs uppercase font-bold text-neutral-400 tracking-widest">
            {isAr ? 'إجمالي نقاط الدريفت' : 'TOTAL DRIFT SCORE'}
          </span>
          <span className="text-4xl sm:text-5xl font-black font-['Rajdhani',sans-serif] tabular-nums text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
            {score.toLocaleString()}
          </span>
        </div>

        {/* 3 Metric Tiles (tabular-nums) */}
        <div className="w-full grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <div className="bg-neutral-950/60 border border-neutral-800 p-3 rounded-xl flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
              {isAr ? 'أعلى كومبو' : 'MAX COMBO'}
            </span>
            <span className="text-xl sm:text-2xl font-black font-['Rajdhani',sans-serif] tabular-nums text-red-500">
              x{maxCombo}
            </span>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800 p-3 rounded-xl flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
              {isAr ? 'أطول دريفت' : 'LONGEST DRIFT'}
            </span>
            <span className="text-xl sm:text-2xl font-black font-['Rajdhani',sans-serif] tabular-nums text-cyan-400">
              {longestDrift}s
            </span>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800 p-3 rounded-xl flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
              {isAr ? 'أعلى سرعة' : 'TOP SPEED'}
            </span>
            <span className="text-xl sm:text-2xl font-black font-['Rajdhani',sans-serif] tabular-nums text-emerald-400">
              {topSpeed}
            </span>
          </div>
        </div>

        {/* CTAs */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          <button
            onClick={onPlayAgain}
            data-start="true"
            className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black rounded-xl text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            <span>{isAr ? 'العب مجدداً [ENTER]' : 'PLAY AGAIN [ENTER]'}</span>
          </button>

          <button
            onClick={onGarage}
            className="sm:w-36 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 border border-neutral-700"
          >
            <Home className="w-4 h-4" />
            <span>{isAr ? 'الكراج' : 'Garage'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
