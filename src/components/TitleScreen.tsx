import React from 'react';
import { CAR_CONFIGS, CarConfig } from '../game/carBuilder';
import { TRACK_CONFIGS, TrackConfig } from '../game/trackBuilder';
import { Play, Flame, Gauge, Zap, ChevronLeft, ChevronRight, Trophy, Clock, Compass } from 'lucide-react';

export interface TitleScreenProps {
  lang: 'ar' | 'en';
  selectedCarId: string;
  selectedTrackId: string;
  gameMode: 'free' | 'target' | 'time';
  onSelectCar: (carId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onSelectMode: (mode: 'free' | 'target' | 'time') => void;
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  lang,
  selectedCarId,
  selectedTrackId,
  gameMode,
  onSelectCar,
  onSelectTrack,
  onSelectMode,
  onStart,
}) => {
  const isAr = lang === 'ar';

  const currentCar = CAR_CONFIGS.find((c) => c.id === selectedCarId) || CAR_CONFIGS[0];
  const currentTrack = TRACK_CONFIGS.find((t) => t.id === selectedTrackId) || TRACK_CONFIGS[0];

  const currentCarIdx = CAR_CONFIGS.findIndex((c) => c.id === selectedCarId);
  const nextCar = () => {
    const nextIdx = (currentCarIdx + 1) % CAR_CONFIGS.length;
    onSelectCar(CAR_CONFIGS[nextIdx].id);
  };
  const prevCar = () => {
    const prevIdx = (currentCarIdx - 1 + CAR_CONFIGS.length) % CAR_CONFIGS.length;
    onSelectCar(CAR_CONFIGS[prevIdx].id);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 pointer-events-auto select-none bg-gradient-to-t from-neutral-950/90 via-transparent to-neutral-950/80">
      {/* --- Top Lockup & Inline SVG Emblem --- */}
      <div className="flex flex-col items-center pt-2">
        {/* Custom Inline SVG Title Lockup */}
        <div className="flex flex-col items-center drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
          <svg
            viewBox="0 0 520 110"
            className="w-[280px] sm:w-[460px] h-auto overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* Background dynamic slant banner */}
            <polygon points="35,15 500,10 480,95 15,100" fill="#09090b" fillOpacity="0.88" stroke="#374151" strokeWidth="2" />
            <polygon points="45,22 490,18 472,42 28,45" fill="url(#goldGrad)" fillOpacity="0.15" />

            {/* Checkered Racing Accent Decal */}
            <g opacity="0.6">
              <rect x="35" y="78" width="12" height="12" fill="#f8fafc" />
              <rect x="47" y="78" width="12" height="12" fill="#0f172a" />
              <rect x="59" y="78" width="12" height="12" fill="#f8fafc" />
              <rect x="71" y="78" width="12" height="12" fill="#0f172a" />
              <rect x="35" y="90" width="12" height="12" fill="#0f172a" />
              <rect x="47" y="90" width="12" height="12" fill="#f8fafc" />
              <rect x="59" y="90" width="12" height="12" fill="#0f172a" />
              <rect x="71" y="90" width="12" height="12" fill="#f8fafc" />
            </g>

            {/* Title Typography */}
            <text
              x="260"
              y="58"
              textAnchor="middle"
              className="font-black font-['Rajdhani',sans-serif]"
              fontSize="44"
              fontWeight="900"
              letterSpacing="6"
              fill="url(#goldGrad)"
              stroke="#000"
              strokeWidth="3"
              style={{ paintOrder: 'stroke fill' }}
            >
              DRIFT KING 3D
            </text>

            {/* Arabic Subtitle Banner */}
            <text
              x="260"
              y="88"
              textAnchor="middle"
              className="font-black font-['Cairo',sans-serif]"
              fontSize="20"
              fontWeight="900"
              letterSpacing="2"
              fill="#f8fafc"
              stroke="#000"
              strokeWidth="2"
              style={{ paintOrder: 'stroke fill' }}
            >
              ملك الدريفت والتفحيط
            </text>
          </svg>
        </div>

        {/* Mode Selector Pills */}
        <div className="flex items-center gap-2 mt-4 bg-neutral-900/90 border border-neutral-700/80 p-1.5 rounded-xl shadow-xl">
          <button
            onClick={() => onSelectMode('free')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gameMode === 'free'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isAr ? 'استعراض حر' : 'Free Drift'}</span>
          </button>

          <button
            onClick={() => onSelectMode('target')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gameMode === 'target'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحدي 50K' : '50K Target'}</span>
          </button>

          <button
            onClick={() => onSelectMode('time')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gameMode === 'time'
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحدي الوقت (90ث)' : 'Time Attack'}</span>
          </button>
        </div>
      </div>

      {/* --- Center: 30-40% Negative Space for Hero 3D Car Viewport --- */}
      <div className="flex-1 min-h-[80px]" />

      {/* --- Bottom Controls & Car / Track Selection Dock --- */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
        {/* Car & Track Switcher Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Car Card */}
          <div className="bg-neutral-900/90 border border-neutral-700/80 p-3 sm:p-4 rounded-xl shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {isAr ? 'المركبة الحالية' : 'CURRENT CAR'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevCar}
                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-neutral-400 px-1">
                  {currentCarIdx + 1}/{CAR_CONFIGS.length}
                </span>
                <button
                  onClick={nextCar}
                  className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-2">
              <h3 className="text-lg font-black text-white">
                {isAr ? currentCar.nameAr : currentCar.nameEn}
              </h3>
              <p className="text-xs text-neutral-400">
                {isAr ? currentCar.taglineAr : currentCar.taglineEn}
              </p>
            </div>

            {/* Car Stat Gauges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800">
              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold mb-1">
                  <span>{isAr ? 'السرعة' : 'SPEED'}</span>
                  <span className="text-white font-mono">{currentCar.maxSpeed}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${(currentCar.maxSpeed / 250) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold mb-1">
                  <span>{isAr ? 'التسارع' : 'ACCEL'}</span>
                  <span className="text-white font-mono">{currentCar.acceleration}</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${(currentCar.acceleration / 35) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold mb-1">
                  <span>{isAr ? 'الانزلاق' : 'DRIFT'}</span>
                  <span className="text-white font-mono">{currentCar.driftSlip}x</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${(currentCar.driftSlip / 1.5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Track Card */}
          <div className="bg-neutral-900/90 border border-neutral-700/80 p-3 sm:p-4 rounded-xl shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" />
                {isAr ? 'الحلبة والمسار' : 'TRACK SELECTION'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold">
                {currentTrack.difficulty}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 my-2">
              {TRACK_CONFIGS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTrack(t.id)}
                  className={`px-2 py-2 rounded-lg text-xs font-bold text-center border transition-all cursor-pointer ${
                    t.id === selectedTrackId
                      ? 'bg-neutral-800 text-amber-400 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {isAr ? t.nameAr : t.nameEn}
                </button>
              ))}
            </div>

            <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
              {isAr ? currentTrack.descAr : currentTrack.descEn}
            </p>
          </div>
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          data-start="true"
          className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xl rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:shadow-[0_0_40px_rgba(245,158,11,0.8)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-3"
        >
          <Play className="w-6 h-6 fill-neutral-950" />
          <span>{isAr ? 'ابدأ الدريفت الآن [ENTER]' : 'START DRIFTING [ENTER]'}</span>
        </button>

        {/* Flat borderless control hint line */}
        <div className="text-xs text-neutral-400 font-medium tracking-wide text-center">
          {isAr
            ? 'WASD / الأسهم للقيادة · المسافة للهاند بريك · SHIFT للنيترو · ESC للإيقاف'
            : 'WASD Move · Space Handbrake · Shift Nitro · Esc Pause'}
        </div>
      </div>
    </div>
  );
};
