import React from 'react';
import { PetBackground } from '../components/PetBackground';

interface WelcomeScreenProps {
  onSelectExisting: () => void;
  onSelectCreate: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectExisting,
  onSelectCreate,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-4 sm:p-6 select-none overflow-hidden font-['Nunito']">
      {/* Real Background Wallpaper */}
      <PetBackground />

      {/* Large Featured Logo utilizing the upper space */}
      <div className="w-full flex-1 flex flex-col items-center justify-center z-10 min-h-0 pt-4 sm:pt-6">
        <div className="w-full max-w-[270px] sm:max-w-[310px] aspect-[3/2] flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Mascoticas IA"
            className="w-full h-full object-contain drop-shadow-xl animate-pet-breathe"
          />
        </div>
      </div>

      {/* Clean, compact action buttons at the bottom */}
      <div className="w-full max-w-[260px] mx-auto z-10 flex flex-col gap-2.5 pb-6 sm:pb-8 shrink-0">
        <button
          type="button"
          onClick={onSelectExisting}
          className="w-full py-2.5 px-4 rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm text-slate-800 bg-white/90 hover:bg-white border border-amber-900/15 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
        >
          Tengo mascotas
        </button>

        <button
          type="button"
          onClick={onSelectCreate}
          className="w-full py-2.5 px-4 rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm text-white bg-amber-500 hover:bg-amber-600 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
        >
          Crear mascota
        </button>
      </div>
    </div>
  );
};
