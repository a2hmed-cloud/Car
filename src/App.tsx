/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { HUD, HUDStats } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal, GameOverModal } from './components/Modals';
import { CAR_CONFIGS } from './game/carBuilder';
import { TRACK_CONFIGS } from './game/trackBuilder';
import { soundManager } from './game/audio';
import { ControlInputs } from './game/physics';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [selectedCarId, setSelectedCarId] = useState<string>(CAR_CONFIGS[0].id);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACK_CONFIGS[0].id);
  const [gameMode, setGameMode] = useState<'free' | 'target' | 'time'>('free');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // HUD Realtime Stats (updated at 10Hz by GameCanvas)
  const [stats, setStats] = useState<HUDStats>({
    speed: 0,
    rpmRatio: 0,
    gear: 1,
    nitro: 100,
    driftAngle: 0,
    isDrifting: false,
    score: 0,
    combo: 1,
    timeRemaining: 90,
  });

  // End of run results
  const [runResults, setRunResults] = useState<{
    score: number;
    maxCombo: number;
    topSpeed: number;
    longestDrift: number;
    isVictory: boolean;
  }>({
    score: 0,
    maxCombo: 1,
    topSpeed: 0,
    longestDrift: 0,
    isVictory: false,
  });

  // Mobile touch controls state
  const [mobileInputs, setMobileInputs] = useState<ControlInputs>({
    forward: false,
    backward: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
    boost: false,
  });

  // Sync state to body dataset for testing & ultra-mode verification
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Sync language attribute to html/body
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Check ?autostart=1 parameter for instant start
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      soundManager.resume();
      setGameState('playing');
    }
  }, []);

  const startGame = useCallback(() => {
    soundManager.resume();
    // Blur any active DOM elements so keyboard input flows directly to canvas
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameState('playing');
  }, []);

  const pauseGame = useCallback(() => {
    setGameState((prev) => (prev === 'playing' ? 'paused' : prev));
  }, []);

  const resumeGame = useCallback(() => {
    soundManager.resume();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameState('playing');
  }, []);

  const restartGame = useCallback(() => {
    soundManager.resume();
    setStats({
      speed: 0,
      rpmRatio: 0,
      gear: 1,
      nitro: 100,
      driftAngle: 0,
      isDrifting: false,
      score: 0,
      combo: 1,
      timeRemaining: 90,
    });
    setGameState('playing');
  }, []);

  const returnToGarage = useCallback(() => {
    soundManager.stopAll();
    setGameState('title');
  }, []);

  const toggleMute = useCallback(() => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  // Global keyboard listeners for Game Shell navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' || gameState === 'gameover') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startGame();
        }
      } else if (gameState === 'playing') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          pauseGame();
        }
      } else if (gameState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          resumeGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame, pauseGame, resumeGame]);

  const handleGameOver = useCallback(
    (results: {
      score: number;
      maxCombo: number;
      topSpeed: number;
      longestDrift: number;
      isVictory: boolean;
    }) => {
      setRunResults(results);
      setGameState('gameover');
    },
    []
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-['Cairo',sans-serif]">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas
        gameState={gameState}
        selectedCarId={selectedCarId}
        selectedTrackId={selectedTrackId}
        gameMode={gameMode}
        isMuted={isMuted}
        mobileInputs={mobileInputs}
        onStatsUpdate={setStats}
        onGameOver={handleGameOver}
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          lang={lang}
          selectedCarId={selectedCarId}
          selectedTrackId={selectedTrackId}
          gameMode={gameMode}
          onSelectCar={setSelectedCarId}
          onSelectTrack={setSelectedTrackId}
          onSelectMode={setGameMode}
          onStart={startGame}
        />
      )}

      {/* In-Game HUD (Visible during 'playing' and 'paused') */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <HUD
          stats={stats}
          isMuted={isMuted}
          lang={lang}
          gameMode={gameMode}
          onToggleMute={toggleMute}
          onPause={pauseGame}
          onReset={restartGame}
          onToggleLang={toggleLang}
          onMobileInputChange={setMobileInputs}
          mobileInputs={mobileInputs}
        />
      )}

      {/* Paused Modal */}
      {gameState === 'paused' && (
        <PauseModal
          lang={lang}
          onResume={resumeGame}
          onRestart={restartGame}
          onGarage={returnToGarage}
        />
      )}

      {/* Game Over / Results Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          lang={lang}
          score={runResults.score}
          maxCombo={runResults.maxCombo}
          topSpeed={runResults.topSpeed}
          longestDrift={runResults.longestDrift}
          isVictory={runResults.isVictory}
          onPlayAgain={startGame}
          onGarage={returnToGarage}
        />
      )}
    </div>
  );
}
