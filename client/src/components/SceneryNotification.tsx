import { useEffect, useState } from "react";

interface SceneryNotificationProps {
  scenery: string;
}

export default function SceneryNotification({ scenery }: SceneryNotificationProps) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    // Hide the notification after 3 seconds
    const timeout = setTimeout(() => {
      setVisible(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [scenery]);
  
  if (!visible) return null;
  
  return (
    <div id="scenery-notification" className="absolute top-1/4 left-1/2 transform -translate-x-1/2">
      <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-6 py-3 text-center text-white">
        <span className="text-lg">Discovered: {scenery}</span>
      </div>
    </div>
  );
}
