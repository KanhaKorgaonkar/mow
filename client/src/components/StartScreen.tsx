import { Button } from "@/components/ui/button";

interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50 transition-opacity duration-500">
      <div className="bg-gradient-to-b from-black/70 to-black/90 p-8 rounded-lg max-w-xl w-full mx-4 backdrop-blur-sm">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-6">kanhakorgaonkar/mow</h1>
        <div className="space-y-6">
          <p className="text-lg text-gray-200 text-center mb-6">
            Experience the zen of endless lawn mowing in a hyperrealistic environment.
          </p>
          
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={onStart} 
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-xl"
            >
              Start Mowing
            </Button>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="text-white text-lg font-bold mb-2">Controls:</h3>
              <ul className="text-gray-200 space-y-1 text-sm md:text-base">
                <li className="flex items-center"><span className="w-24">Movement:</span> <span>WASD or Arrow Keys</span></li>
                <li className="flex items-center"><span className="w-24">Look Around:</span> <span>Mouse</span></li>
                <li className="flex items-center"><span className="w-24">Toggle Mower:</span> <span>Space Bar</span></li>
                <li className="flex items-center"><span className="w-24">Pause:</span> <span>Escape</span></li>
              </ul>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-6">
            <p>For best experience, use a desktop browser with hardware acceleration enabled.</p>
            <p className="mt-1">&copy; 2025 @korgaonkarkanha</p>
          </div>
        </div>
      </div>
    </div>
  );
}
