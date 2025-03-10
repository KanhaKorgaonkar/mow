import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  const loadingQuotes = [
    "The grass is always greener where you mow it.", "A well-kept lawn is a joy forever.", "Life is better when you're mowing.", "Cut grass, not corners.", "Keep calm and mow on.", "Mow money, mow problems.", "Grass: the gift that keeps on growing.", "Lawn care: where the turf meets the surf.", "Mowing is my therapy; the lawn is my counselor.", "Don't let your lawn be a blade runner—keep it trimmed!", "Mow it, and they will come.", "The best lawns are grown, not thrown.", "Grass doesn’t grow on a busy mower.", "Mow today, glow tomorrow.", "Lawn maintenance: it’s a cut above the rest.", "Trim the grass, ease the stress.", "A mowed lawn is a happy lawn.", "Mow the lawn, seize the dawn.", "Life’s too short for tall grass.", "Mowing: the ultimate blade of glory.", "Green grass, good vibes.", "Keep your lawn in line, one cut at a time.", "Mow it low, watch it grow.", "A lawn is only as good as its last trim.", "Grass is greener with a little shear effort.", "Mowing: where every blade counts.", "Don’t let grass grow under your feet—mow it!", "A neat lawn is a sweet lawn.", "Mowing is the key to lawngevity.","A good mow makes the neighborhood glow.", "Lawn life: trim it and win it.", "Mow your way to a better day.", "The lawn is my canvas, the mower my brush.", "Shear brilliance starts with a mowed lawn.", "Mowing: because grass shouldn’t have the last word.", "A trimmed lawn is a timeless charm.",
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
        
        <div className="mt-4 text-center text-amber-500 text-xs">
          For the best experience, play some relaxing music in the background as you mow.
        </div>
      </div>
    </div>
  );
}
