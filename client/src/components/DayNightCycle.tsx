import { useEffect, useState } from "react";

interface DayNightCycleProps {
  timeOfDay: string;
}

export default function DayNightCycle({ timeOfDay }: DayNightCycleProps) {
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayColor, setOverlayColor] = useState('bg-blue-900');
  
  useEffect(() => {
    // Parse time string (format: "HH:MM")
    const hourMinute = timeOfDay.split(':');
    const hour = parseInt(hourMinute[0]);
    
    // Determine overlay opacity and color based on time of day
    if (hour >= 20 || hour < 5) {
      // Night (8 PM - 5 AM)
      setOverlayOpacity(0.7);
      setOverlayColor('bg-blue-900');
    } else if (hour >= 18) {
      // Evening (6 PM - 8 PM)
      setOverlayOpacity(0.4);
      setOverlayColor('bg-indigo-900');
    } else if (hour >= 17) {
      // Sunset (5 PM - 6 PM)
      setOverlayOpacity(0.2);
      setOverlayColor('bg-orange-900');
    } else if (hour >= 6 && hour < 7) {
      // Sunrise (6 AM - 7 AM)
      setOverlayOpacity(0.2);
      setOverlayColor('bg-orange-900');
    } else if (hour >= 5 && hour < 6) {
      // Dawn (5 AM - 6 AM)
      setOverlayOpacity(0.4);
      setOverlayColor('bg-indigo-900');
    } else {
      // Day (7 AM - 5 PM)
      setOverlayOpacity(0);
    }
  }, [timeOfDay]);
  
  const opacityStyle = { opacity: overlayOpacity };
  
  return (
    <div 
      id="day-night-overlay" 
      className={`absolute inset-0 pointer-events-none transition-colors duration-5000 ${overlayColor}`}
      style={opacityStyle}
    />
  );
}
