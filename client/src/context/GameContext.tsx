import React, { createContext, useState, useCallback, useRef } from "react";
import { GameManager } from "@/lib/game/GameManager";

type GameState = 'start' | 'loading' | 'playing' | 'paused';

interface GameContextType {
  gameState: GameState;
  loadingProgress: number;
  mowedArea: number;
  mowerRunning: boolean;
  timeOfDay: string;
  weather: string;
  showMowedFeedback: boolean;
  discoveredScenery: string | null;
  initializeGame: (container: HTMLElement) => void;
  updateGame: () => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  exitGame: () => void;
  toggleMower: () => void;
}

export const GameContext = createContext<GameContextType>({
  gameState: 'start',
  loadingProgress: 0,
  mowedArea: 0,
  mowerRunning: false,
  timeOfDay: '10:30',
  weather: 'Sunny',
  showMowedFeedback: false,
  discoveredScenery: null,
  initializeGame: () => {},
  updateGame: () => {},
  startGame: () => {},
  pauseGame: () => {},
  resumeGame: () => {},
  exitGame: () => {},
  toggleMower: () => {},
});

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [mowedArea, setMowedArea] = useState(0);
  const [mowerRunning, setMowerRunning] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('10:30');
  const [weather, setWeather] = useState('Sunny');
  const [showMowedFeedback, setShowMowedFeedback] = useState(false);
  const [discoveredScenery, setDiscoveredScenery] = useState<string | null>(null);
  
  // Reference to the game manager
  const gameManagerRef = useRef<GameManager | null>(null);
  
  // Initialize the game
  const initializeGame = useCallback((container: HTMLElement) => {
    if (!gameManagerRef.current) {
      gameManagerRef.current = new GameManager({
        container,
        onProgress: (progress: number) => {
          setLoadingProgress(Math.floor(progress * 100));
        },
        onMowed: (total: number) => {
          setMowedArea(total);
          setShowMowedFeedback(true);
          setTimeout(() => setShowMowedFeedback(false), 2000);
        },
        onWeatherChange: (newWeather: string) => {
          setWeather(newWeather);
        },
        onTimeChange: (newTime: string) => {
          setTimeOfDay(newTime);
        },
        onSceneryDiscovered: (scenery: string) => {
          setDiscoveredScenery(scenery);
          setTimeout(() => setDiscoveredScenery(null), 3000);
        }
      });
    }
  }, []);
  
  // Update the game state (called in animation loop)
  const updateGame = useCallback(() => {
    if (gameManagerRef.current && gameState === 'playing') {
      gameManagerRef.current.update();
    }
  }, [gameState]);
  
  // Game flow control functions
  const startGame = useCallback(() => {
    setGameState('loading');
    
    // Simulate loading time
    let progress = 0;
    const loadingInterval = setInterval(() => {
      progress += 1;
      setLoadingProgress(progress);
      
      if (progress >= 100) {
        clearInterval(loadingInterval);
        setGameState('playing');
        setMowerRunning(true);
        
        // Initialize game if needed
        if (gameManagerRef.current) {
          gameManagerRef.current.startGame();
        }
      }
    }, 50);
  }, []);
  
  const pauseGame = useCallback(() => {
    setGameState('paused');
    if (gameManagerRef.current) {
      gameManagerRef.current.pauseGame();
    }
  }, []);
  
  const resumeGame = useCallback(() => {
    setGameState('playing');
    if (gameManagerRef.current) {
      gameManagerRef.current.resumeGame();
    }
  }, []);
  
  const exitGame = useCallback(() => {
    setGameState('start');
    setMowedArea(0);
    setMowerRunning(false);
    setTimeOfDay('10:30');
    setWeather('Sunny');
    if (gameManagerRef.current) {
      gameManagerRef.current.resetGame();
    }
  }, []);
  
  const toggleMower = useCallback(() => {
    setMowerRunning(prev => !prev);
    if (gameManagerRef.current) {
      gameManagerRef.current.toggleMower();
    }
  }, []);
  
  return (
    <GameContext.Provider
      value={{
        gameState,
        loadingProgress,
        mowedArea,
        mowerRunning,
        timeOfDay,
        weather,
        showMowedFeedback,
        discoveredScenery,
        initializeGame,
        updateGame,
        startGame,
        pauseGame,
        resumeGame,
        exitGame,
        toggleMower,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
