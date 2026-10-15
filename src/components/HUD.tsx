import React from 'react';
import { Volume2, VolumeX, Pause, RotateCcw, Video, Globe, Flame, Zap } from 'lucide-react';
import { ControlInputs } from '../game/physics';

export interface HUDStats {
  speed: number;
  rpmRatio: number;
  gear: number;
  nitro: number;
  driftAngle: number;
  isDrifting: boolean;
  score: number;
  combo: number;
  timeRemaining: number;
}

export interface HUDProps {
  stats: HUDStats;
  isMuted: boolean;
  lang: 'ar' | 'en';
  gameMode: 'free' | 'target' | 'time';
  onToggleMute: () => void;
  onPause: () => void;
  onReset: () => void;
  onToggleLang: () => void;
  onMobileInputChange: (inputs: ControlInputs) => void;
  mobileInputs: ControlInputs;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  isMuted,
  lang,
  gameMode,
  onToggleMute,
  onPause,
  onReset,
  onToggleLang,
  onMobileInputChange,
  mobileInputs,
}) => {
  const isAr = lang === 'ar';

  const setInput = (key: keyof ControlInputs, value: boolean) => {
    onMobileInputChange({
      ...mobileInputs,
      [key]: value,
    });
  };

  // Tachometer angle for radial needle or progress (0 to 180 degrees)
  const rpmPercent = Math.min(100, Math.round(stats.rpmRatio * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between p-3 sm:p-5">
      {/* --- Top Perimeter Bar --- */}
      <div className="w-full flex items-start justify-between">
        {/* Top Left: Mode / Time or Target Objective */}
        <div className="flex flex-col gap-1 items-start">
          <div className="bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              {gameMode === 'time'
                ? isAr
                  ? `الوقت: ${stats.timeRemaining} ث`
                  : `TIME: ${stats.timeRemaining}s`
                : gameMode === 'target'
                ? isAr
                  ? 'الهدف: 50,000 نقطة'
                  : 'TARGET: 50,000 PTS'
                : isAr
                ? 'استعراض حر'
                : 'FREESTYLE DRIFT'}
            </span>
          </div>
        </div>

        {/* Top Center: Drift Score & Combo Multiplier */}
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-5xl font-black font-['Rajdhani',sans-serif] tabular-nums tracking-tight text-white drop-shadow-[0_2px_12px_rgba(245,158,11,0.6)]">
              {stats.score.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-widest">
              {isAr ? 'نقطة' : 'PTS'}
            </span>
          </div>

          {/* Active Drift Callout & Combo */}
          {stats.isDrifting && (
            <div className="flex items-center gap-2 mt-1 animate-bounce">
              <span className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/60 text-amber-300 px-3 py-0.5 rounded-full text-xs font-black tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {isAr ? 'دريفت رائع!' : 'DRIFTING!'} {stats.driftAngle}°
              </span>

              {stats.combo > 1 && (
                <span className="bg-red-600 border border-red-400 text-white font-black px-2.5 py-0.5 rounded-md text-sm font-['Rajdhani',sans-serif] shadow-[0_0_12px_rgba(239,68,68,0.8)]">
                  x{stats.combo}
                </span>
              )}
            </div>
          )}

          {/* Drift Angle Sweet Spot Meter */}
          <div className="w-48 sm:w-64 h-1.5 bg-neutral-800/90 rounded-full mt-2 overflow-hidden border border-neutral-700/60 relative">
            {/* Sweet spot indicator (25 to 65 degrees) */}
            <div className="absolute left-[25%] right-[35%] h-full bg-emerald-500/40" />
            <div
              className={`h-full transition-all duration-75 ${
                stats.driftAngle >= 25 && stats.driftAngle <= 65
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (stats.driftAngle / 85) * 100)}%` }}
            />
          </div>
        </div>

        {/* Top Right: Utility Controls (Pointer events enabled) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            onClick={onToggleLang}
            tabIndex={-1}
            title={isAr ? 'تغيير اللغة' : 'Switch Language'}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white rounded-lg border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <Globe className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            tabIndex={-1}
            title={isMuted ? (isAr ? 'تشغيل الصوت [M]' : 'Unmute [M]') : isAr ? 'كتم الصوت [M]' : 'Mute [M]'}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white rounded-lg border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-neutral-200" />}
          </button>

          <button
            onClick={onReset}
            tabIndex={-1}
            title={isAr ? 'إعادة السيارة للمسار [R]' : 'Reset Car [R]'}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white rounded-lg border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onPause}
            tabIndex={-1}
            title={isAr ? 'إيقاف مؤقت [ESC]' : 'Pause [ESC]'}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-neutral-900/90 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-white rounded-lg border border-neutral-700/80 flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- Center: Subtle Speed Lines on Boost --- */}
      {mobileInputs.boost && (
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,182,212,0.15)_100%)]" />
      )}

      {/* --- Bottom Perimeter Bar: Speedometer & Nitro Gauges & Touch Controls --- */}
      <div className="w-full flex flex-col gap-2">
        {/* On-Screen Mobile Touch Controls (Always available on touch or small screens, pointer-events: auto) */}
        <div className="w-full flex justify-between items-end pb-1 pointer-events-auto sm:hidden">
          {/* Left steering buttons */}
          <div className="flex gap-2">
            <button
              onTouchStart={() => setInput('steerLeft', true)}
              onTouchEnd={() => setInput('steerLeft', false)}
              onMouseDown={() => setInput('steerLeft', true)}
              onMouseUp={() => setInput('steerLeft', false)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border transition-all active:scale-90 ${
                mobileInputs.steerLeft
                  ? 'bg-amber-500 text-neutral-950 border-amber-300'
                  : 'bg-neutral-900/90 text-white border-neutral-700/80'
              }`}
            >
              ◀
            </button>
            <button
              onTouchStart={() => setInput('steerRight', true)}
              onTouchEnd={() => setInput('steerRight', false)}
              onMouseDown={() => setInput('steerRight', true)}
              onMouseUp={() => setInput('steerRight', false)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black border transition-all active:scale-90 ${
                mobileInputs.steerRight
                  ? 'bg-amber-500 text-neutral-950 border-amber-300'
                  : 'bg-neutral-900/90 text-white border-neutral-700/80'
              }`}
            >
              ▶
            </button>
          </div>

          {/* Right action buttons: Gas, Brake, Handbrake, Nitro */}
          <div className="flex items-center gap-2">
            <button
              onTouchStart={() => setInput('handbrake', true)}
              onTouchEnd={() => setInput('handbrake', false)}
              onMouseDown={() => setInput('handbrake', true)}
              onMouseUp={() => setInput('handbrake', false)}
              className={`w-13 h-13 rounded-2xl text-xs font-black border transition-all flex flex-col items-center justify-center active:scale-90 ${
                mobileInputs.handbrake
                  ? 'bg-rose-600 text-white border-rose-300'
                  : 'bg-neutral-900/90 text-rose-400 border-neutral-700/80'
              }`}
            >
              <Flame className="w-4 h-4 mb-0.5" />
              <span>{isAr ? 'هاند' : 'DRIFT'}</span>
            </button>

            <button
              onTouchStart={() => setInput('boost', true)}
              onTouchEnd={() => setInput('boost', false)}
              onMouseDown={() => setInput('boost', true)}
              onMouseUp={() => setInput('boost', false)}
              className={`w-13 h-13 rounded-2xl text-xs font-black border transition-all flex flex-col items-center justify-center active:scale-90 ${
                mobileInputs.boost
                  ? 'bg-cyan-500 text-neutral-950 border-cyan-200'
                  : 'bg-neutral-900/90 text-cyan-400 border-neutral-700/80'
              }`}
            >
              <Zap className="w-4 h-4 mb-0.5" />
              <span>NOS</span>
            </button>

            <button
              onTouchStart={() => setInput('backward', true)}
              onTouchEnd={() => setInput('backward', false)}
              onMouseDown={() => setInput('backward', true)}
              onMouseUp={() => setInput('backward', false)}
              className={`w-13 h-13 rounded-2xl text-xs font-black border transition-all flex items-center justify-center active:scale-90 ${
                mobileInputs.backward
                  ? 'bg-red-600 text-white border-red-300'
                  : 'bg-neutral-900/90 text-neutral-300 border-neutral-700/80'
              }`}
            >
              {isAr ? 'فرامل' : 'BRAKE'}
            </button>

            <button
              onTouchStart={() => setInput('forward', true)}
              onTouchEnd={() => setInput('forward', false)}
              onMouseDown={() => setInput('forward', true)}
              onMouseUp={() => setInput('forward', false)}
              className={`w-15 h-15 rounded-2xl text-sm font-black border transition-all flex items-center justify-center active:scale-90 ${
                mobileInputs.forward
                  ? 'bg-emerald-500 text-neutral-950 border-emerald-300'
                  : 'bg-neutral-900/90 text-emerald-400 border-neutral-700/80'
              }`}
            >
              {isAr ? 'دواسة' : 'GAS'}
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Bottom Cluster: Speedometer + Tachometer + Nitro */}
        <div className="w-full flex items-end justify-between">
          {/* Bottom Left: Speedometer & Gear */}
          <div className="bg-neutral-950/85 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-4">
            {/* Gear indicator */}
            <div className="flex flex-col items-center justify-center bg-neutral-900/90 px-3 py-1 rounded-lg border border-neutral-700">
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                {isAr ? 'الجير' : 'GEAR'}
              </span>
              <span className="text-xl font-black font-['Rajdhani',sans-serif] text-amber-400">
                {stats.speed === 0 ? 'N' : stats.gear}
              </span>
            </div>

            {/* Digital Speed (KM/H) */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-black font-['Rajdhani',sans-serif] tabular-nums tracking-tight text-white">
                  {stats.speed}
                </span>
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                  {isAr ? 'كم/س' : 'KM/H'}
                </span>
              </div>

              {/* RPM Bar */}
              <div className="w-32 sm:w-44 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1 flex">
                <div
                  className={`h-full transition-all duration-75 ${
                    rpmPercent > 85 ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-amber-400'
                  }`}
                  style={{ width: `${rpmPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Center Desktop Control Hints (Clean flat inline line) */}
          <div className="hidden sm:flex items-center gap-3 bg-neutral-950/70 border border-neutral-800/80 px-4 py-1.5 rounded-full text-xs font-semibold text-neutral-400">
            <span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded border border-neutral-700 text-[11px]">WASD</kbd> {isAr ? 'قيادة' : 'Drive'}
            </span>
            <span>·</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded border border-neutral-700 text-[11px]">SPACE</kbd> {isAr ? 'هاند بريك' : 'Handbrake'}
            </span>
            <span>·</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded border border-neutral-700 text-[11px]">SHIFT</kbd> {isAr ? 'نيترو' : 'Nitro'}
            </span>
            <span>·</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-200 rounded border border-neutral-700 text-[11px]">C</kbd> {isAr ? 'كاميرا' : 'Cam'}
            </span>
          </div>

          {/* Bottom Right: Nitro (NOS) Gauge */}
          <div className="bg-neutral-950/85 border border-neutral-800 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                  {isAr ? 'نيترو' : 'NITRO'}
                </span>
                <span className="text-sm font-black font-['Rajdhani',sans-serif] tabular-nums text-white">
                  {stats.nitro}%
                </span>
              </div>

              {/* Nitro bar */}
              <div className="w-28 sm:w-36 h-2 bg-neutral-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_#06b6d4] transition-all duration-100"
                  style={{ width: `${stats.nitro}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
