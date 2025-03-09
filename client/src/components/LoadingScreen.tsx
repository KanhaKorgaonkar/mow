import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  const loadingQuotes = [
    "The grass is always greener where you mow it.",
    "A well-kept lawn is a joy forever.",
    "Life is better when you're mowing.",
    "Cut grass, not corners.",
    "Keep calm and mow on."
  ];

  const randomQuote = () => {
    const index = Math.floor(Math.random() * loadingQuotes.length);
    return loadingQuotes[index];
  };

  // Determine loading stage message based on progress
  const loadingMessage = () => {
    if (progress < 30) return "Loading terrain...";
    if (progress < 60) return "Growing grass...";
    if (progress < 80) return "Preparing scenery...";
    return "Starting engine...";
  };

  return (
    <div id="loading-screen" className="absolute inset-0 z-60 flex flex-col items-center justify-center bg-black">
      <div className="max-w-md w-full px-4">
        <h2 className="text-2xl text-white font-bold mb-6 text-center">Loading Your Lawn...</h2>
        
        <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
          <Progress value={progress} className="h-4" />
        </div>
        
        <div className="flex justify-between text-sm text-gray-400">
          <span>{loadingMessage()}</span>
          <span>{progress}%</span>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm italic">
          "{randomQuote()}"
        </div>
      </div>
    </div>
  );
}
