import { useEffect, useState } from "react";

interface WeatherTransitionProps {
  weather: string;
}

export default function WeatherTransition({ weather }: WeatherTransitionProps) {
  const [visible, setVisible] = useState(false);
  const [lightning, setLightning] = useState(false);
  
  useEffect(() => {
    // Show weather transition effect when weather changes
    setVisible(true);
    
    // Schedule lightning effects if weather is stormy
    let lightningInterval: NodeJS.Timeout;
    if (weather.toLowerCase() === 'stormy') {
      lightningInterval = setInterval(() => {
        setLightning(true);
        setTimeout(() => setLightning(false), 200);
      }, Math.random() * 5000 + 3000); // Random interval between 3-8 seconds
    }
    
    // Hide the transition effect after 1 second
    const timeout = setTimeout(() => {
      setVisible(false);
    }, 1000);
    
    return () => {
      clearTimeout(timeout);
      if (lightningInterval) clearInterval(lightningInterval);
    };
  }, [weather]);
  
  // Set overlay class based on weather
  const getWeatherOverlayClass = () => {
    switch(weather.toLowerCase()) {
      case 'rainy': return 'bg-blue-900/20';
      case 'stormy': return 'bg-blue-900/30';
      case 'foggy': return 'bg-gray-400/30';
      case 'cloudy': return 'bg-gray-400/10';
      default: return 'bg-transparent';
    }
  };
  
  return (
    <div 
      id="weather-transition" 
      className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Weather overlay */}
      <div className={`absolute inset-0 ${getWeatherOverlayClass()}`}></div>
      
      {/* Lightning flash */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-100 ${lightning ? 'opacity-40' : 'opacity-0'}`}></div>
    </div>
  );
}
