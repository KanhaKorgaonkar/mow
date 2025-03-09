import { useState, useEffect } from 'react';

interface GameHUDProps {
  onPause: () => void;
  weather: string;
  timeOfDay: string;
  mowedArea: number;
  mowerRunning: boolean;
}

// Add a component for fallback controls message
export function FallbackControlsInfo() {
  const [showMessage, setShowMessage] = useState(false);
  
  useEffect(() => {
    // Check if pointer lock fails after a short delay
    const timer = setTimeout(() => {
      if (!document.pointerLockElement) {
        setShowMessage(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!showMessage) return null;
  
  return (
    <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-md max-w-xs text-sm">
      <p className="font-bold mb-1">Simple Controls:</p>
      <ul className="list-disc pl-4 space-y-1">
        <li><span className="font-bold">W</span> - Drive forward</li>
        <li><span className="font-bold">A</span> - Turn left</li>
        <li><span className="font-bold">D</span> - Turn right</li>
        <li><span className="font-bold">Space</span> - Toggle mower on/off</li>
      </ul>
      <p className="mt-2 text-xs italic">Mower moves faster when turned off!</p>
      <button 
        onClick={() => setShowMessage(false)}
        className="text-xs text-gray-400 mt-2 hover:text-white"
      >
        Dismiss
      </button>
    </div>
  );
}

export default function GameHUD({ onPause, weather, timeOfDay, mowedArea, mowerRunning }: GameHUDProps) {
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showControlsHelp, setShowControlsHelp] = useState(false);

  // Detect touch devices for mobile controls
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowMobileControls(isTouchDevice);
  }, []);

  // Format time for display
  const formattedTime = () => {
    const hours = parseInt(timeOfDay.split(':')[0]);
    const minutes = timeOfDay.split(':')[1];
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
  };

  // Get weather icon
  const weatherIcon = () => {
    switch (weather.toLowerCase()) {
      case 'sunny': return 'fas fa-sun text-yellow-400';
      case 'cloudy': return 'fas fa-cloud text-gray-300';
      case 'rainy': return 'fas fa-cloud-rain text-blue-300';
      case 'stormy': return 'fas fa-bolt text-yellow-300';
      default: return 'fas fa-sun text-yellow-400';
    }
  };

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none">
      {/* Top HUD elements */}
      <div className="absolute top-4 right-4 flex flex-col items-end">
        {/* Weather & Time indicator */}
        <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-2 mb-2 flex items-center space-x-3">
          <div className="flex items-center">
            <i className={`${weatherIcon()} mr-1`}></i>
            <span className="text-white text-sm">{weather}</span>
          </div>
          <div className="h-4 border-r border-white/30"></div>
          <div className="flex items-center">
            <i className="fas fa-clock text-white mr-1"></i>
            <span className="text-white text-sm">{formattedTime()}</span>
          </div>
        </div>
        
        {/* Mowing Stats */}
        <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-2">
          <div className="flex items-center space-x-2">
            <i className="fas fa-cut text-white"></i>
            <div className="text-white">
              <div className="text-xs">Mowed Area</div>
              <div className="font-roboto-condensed font-bold">{mowedArea} sq ft</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom HUD elements */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {/* Mower status */}
        <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-full px-4 py-2 mb-2">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${mowerRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white text-sm">{mowerRunning ? 'Mower Running' : 'Mower Off'}</span>
          </div>
        </div>
        
        {/* Mobile controls (visible only on touch devices) */}
        {showMobileControls && (
          <div id="mobile-controls" className="grid grid-cols-3 gap-2 mt-4 pointer-events-auto">
            <div></div>
            <button className="bg-black bg-opacity-50 rounded-full h-14 w-14 flex items-center justify-center shadow-lg" data-control="forward">
              <i className="fas fa-arrow-up text-white text-lg"></i>
            </button>
            <div></div>
            
            <button className="bg-black bg-opacity-50 rounded-full h-14 w-14 flex items-center justify-center shadow-lg" data-control="left">
              <i className="fas fa-arrow-left text-white text-lg"></i>
            </button>
            <button 
              className="bg-green-800 bg-opacity-60 rounded-full h-12 w-12 flex items-center justify-center shadow-lg"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}
            >
              <i className="fas fa-cut text-white"></i>
            </button>
            <button className="bg-black bg-opacity-50 rounded-full h-14 w-14 flex items-center justify-center shadow-lg" data-control="right">
              <i className="fas fa-arrow-right text-white text-lg"></i>
            </button>
          </div>
        )}
      </div>
      
      {/* Control buttons - pause and help */}
      <div className="absolute top-4 left-4 flex space-x-2">
        <button 
          className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-2 pointer-events-auto"
          onClick={onPause}
        >
          <i className="fas fa-pause text-white"></i>
        </button>
        <button 
          className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg p-2 pointer-events-auto"
          onClick={() => setShowControlsHelp(!showControlsHelp)}
        >
          <i className="fas fa-question text-white"></i>
        </button>
      </div>
      
      {/* Controls help dialog */}
      {showControlsHelp && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white p-4 rounded-md max-w-sm pointer-events-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg">Simple Controls</h3>
            <button 
              onClick={() => setShowControlsHelp(false)}
              className="text-white/80 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-2">
            <div className="font-bold text-green-400">Drive Forward:</div>
            <div>W or Up Arrow</div>
            
            <div className="font-bold text-green-400">Turn Left:</div>
            <div>A or Left Arrow</div>
            
            <div className="font-bold text-green-400">Turn Right:</div>
            <div>D or Right Arrow</div>
            
            <div className="font-bold text-green-400">Toggle Mower:</div>
            <div>Space Bar</div>
            
            <div className="font-bold text-green-400">Camera Control:</div>
            <div>Mouse movement</div>
          </div>
          <div className="mt-4 text-sm bg-gray-800/60 p-3 rounded border border-green-800/50">
            <p className="font-bold text-green-400 mb-1">Tips:</p>
            <ul className="list-disc pl-4 space-y-1 text-gray-300">
              <li>Mower moves faster when turned off</li>
              <li>Mower only cuts grass when running</li>
              <li>Turns are sharper when stationary</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
