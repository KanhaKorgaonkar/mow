import { useState, useEffect } from "react";
import StartScreen from "@/components/StartScreen";
import GameCanvas from "@/components/GameCanvas";
import GameHUD from "@/components/GameHUD";
import PauseMenu from "@/components/PauseMenu";
import LoadingScreen from "@/components/LoadingScreen";
import WeatherTransition from "@/components/WeatherTransition";
import DayNightCycle from "@/components/DayNightCycle";
import MowedGrassFeedback from "@/components/MowedGrassFeedback";
import SceneryNotification from "@/components/SceneryNotification";
import { useGame } from "@/hooks/useGame";

export default function Home() {
  const { 
    gameState, 
    startGame, 
    pauseGame, 
    resumeGame, 
    exitGame,
    toggleMower,
    loadingProgress,
    mowedArea,
    mowerRunning,
    timeOfDay,
    weather,
    showMowedFeedback,
    discoveredScenery
  } = useGame();

  // Capture keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (e.key === 'Escape') {
          pauseGame();
        } else if (e.code === 'Space') {
          toggleMower();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, pauseGame, toggleMower]);

  import { FallbackControlsInfo } from '../components/GameHUD';

// Handle pointer lock for first-person control
  useEffect(() => {
    const gameCanvas = document.getElementById('game-canvas');
    
    const handleCanvasClick = () => {
      if (gameState === 'playing' && gameCanvas) {
        gameCanvas.requestPointerLock();
      }
    };

    if (gameCanvas) {
      gameCanvas.addEventListener('click', handleCanvasClick);
    }
    
    return () => {
      if (gameCanvas) {
        gameCanvas.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [gameState]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Game canvas is always present */}
      <GameCanvas />
      
      {/* UI Layers */}
      {gameState === 'start' && <StartScreen onStart={startGame} />}
      {gameState === 'loading' && <LoadingScreen progress={loadingProgress} />}
      {gameState === 'playing' && (
        <>
          <GameHUD 
            onPause={pauseGame} 
            weather={weather}
            timeOfDay={timeOfDay}
            mowedArea={mowedArea}
            mowerRunning={mowerRunning}
          />
          <FallbackControlsInfo />
        </>
      )}
      {gameState === 'paused' && (
        <PauseMenu 
          onResume={resumeGame} 
          onExit={exitGame} 
        />
      )}

      {/* Visual effect components */}
      <WeatherTransition weather={weather} />
      <DayNightCycle timeOfDay={timeOfDay} />
      
      {/* Feedback components */}
      {showMowedFeedback && <MowedGrassFeedback />}
      {discoveredScenery && <SceneryNotification scenery={discoveredScenery} />}
    </main>
  );
}
