import React from 'react';

interface WelcomeScreenProps {
  onSelectExisting: () => void;
  onSelectCreate: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectExisting,
  onSelectCreate,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden font-['Nunito']">
      {/* Background with fondo.png */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <img
          src="/fondo.png"
          alt="Fondo"
          className="w-full h-full object-cover brightness-[0.97]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/60 via-white/40 to-amber-100/70 backdrop-blur-[2px]" />
      </div>

      {/* Top spacing */}
      <div className="w-full flex justify-center pt-2">
        <span className="text-xs font-bold text-amber-900/60 tracking-wider">
          🐾 VIRTUAL PET IA COMPANION
        </span>
      </div>

      {/* Main Center Card with Official Logo */}
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-amber-300 text-center animate-scale-up my-auto">
        {/* Official Mascoticas IA Logo */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-3">
          <img
            src="/logo.png"
            alt="Mascoticas IA Logo"
            className="w-full h-full object-contain drop-shadow-xl animate-pet-breathe"
            onError={(e) => {
              // Fallback
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Title */}
        <h1 className="font-['Fredoka'] font-bold text-3xl sm:text-4xl text-amber-950 tracking-tight mb-1">
          MASCOTICAS IA
        </h1>

        <p className="font-['Nunito'] font-bold text-base text-amber-800/80 mb-6">
          ¿Qué quieres hacer?
        </p>

        {/* Big Action Buttons */}
        <div className="flex flex-col gap-3.5">
          <button
            type="button"
            onClick={onSelectExisting}
            className="w-full py-3.5 px-5 rounded-2xl font-['Fredoka'] font-bold text-base sm:text-lg text-amber-900 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 shadow-md shadow-amber-100/50 transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="text-2xl">🏠</span>
            <span>TENGO MASCOTAS</span>
          </button>

          <button
            type="button"
            onClick={onSelectCreate}
            className="w-full py-3.5 px-5 rounded-2xl font-['Fredoka'] font-bold text-base sm:text-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-300/60 transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span className="text-2xl">🐣</span>
            <span>CREAR MASCOTA</span>
          </button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pb-2 text-center">
        <p className="font-['Nunito'] text-[11px] font-bold text-amber-900/70">
          Tu compañero virtual infantil con inteligencia artificial ✨
        </p>
      </div>
    </div>
  );
};
