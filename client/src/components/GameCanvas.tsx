import { useRef, useEffect } from 'react';
import { useGame } from '@/hooks/useGame';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { gameState, initializeGame, updateGame } = useGame();
  
  // Initialize the game when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      initializeGame(canvasRef.current);
    }
    
    // Animation loop
    let animationFrameId: number;
    
    const animate = () => {
      updateGame();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation loop when game is playing
    if (gameState === 'playing') {
      animate();
    }
    
    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameState, initializeGame, updateGame]);

  return (
    <div 
      id="game-canvas" 
      ref={canvasRef}
      className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-300"
    />
  );
}
