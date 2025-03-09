import { Button } from "@/components/ui/button";

interface PauseMenuProps {
  onResume: () => void;
  onExit: () => void;
}

export default function PauseMenu({ onResume, onExit }: PauseMenuProps) {
  return (
    <div id="pause-menu" className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gradient-to-b from-gray-900 to-black p-8 rounded-lg max-w-md mx-auto">
        <h2 className="text-3xl text-white font-bold mb-4 text-center">Paused</h2>
        
        <div className="space-y-4">
          <Button 
            id="resume-game" 
            onClick={onResume}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Resume Mowing
          </Button>
          
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="secondary"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              Settings
            </Button>
            <Button 
              variant="secondary"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              How to Play
            </Button>
          </div>
          
          <Button 
            id="exit-game" 
            onClick={onExit}
            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Exit to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
