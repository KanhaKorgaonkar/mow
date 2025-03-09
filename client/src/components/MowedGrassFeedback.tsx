import { useEffect, useState } from "react";

export default function MowedGrassFeedback() {
  const [visible, setVisible] = useState(true);
  const [amount, setAmount] = useState(10);
  
  useEffect(() => {
    // Random amount between 5 and 15
    setAmount(Math.floor(Math.random() * 11) + 5);
    
    // Hide the feedback after 2 seconds
    const timeout = setTimeout(() => {
      setVisible(false);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div id="mowing-feedback" className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
      <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg px-4 py-2 text-center text-white text-sm">
        <span>+{amount} Square Feet Mowed!</span>
      </div>
    </div>
  );
}
