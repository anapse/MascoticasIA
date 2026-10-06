import React from 'react';
import { PetSpeciesKey } from '../types/pet';

interface PetBackgroundProps {
  speciesKey: PetSpeciesKey;
}

export const PetBackground: React.FC<PetBackgroundProps> = ({ speciesKey }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Primary high-res background image */}
      <img
        src="/fondo.png"
        alt="Fondo Mascoticas"
        className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 brightness-[1.02] contrast-[1.02]"
        onError={(e) => {
          // Fallback if image fails
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      {/* Species-specific atmospheric lighting and particle overlays */}
      <SpeciesOverlay speciesKey={speciesKey} />
    </div>
  );
};

interface SpeciesOverlayProps {
  speciesKey: PetSpeciesKey;
}

const SpeciesOverlay: React.FC<SpeciesOverlayProps> = ({ speciesKey }) => {
  switch (speciesKey) {
    case 'fox':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-transparent to-amber-950/20">
          <span className="absolute top-1/4 left-6 text-xl opacity-60 animate-bounce delay-300">🍂</span>
          <span className="absolute top-1/3 right-8 text-lg opacity-55 animate-bounce delay-700">🍁</span>
          <span className="absolute bottom-28 left-8 text-sm opacity-60 animate-pulse">✨</span>
          <span className="absolute bottom-36 right-10 text-sm opacity-60 animate-pulse delay-500">✨</span>
          <span className="absolute bottom-16 left-6 text-xl opacity-70">🍄</span>
          <span className="absolute bottom-18 right-8 text-lg opacity-60">🌰</span>
        </div>
      );

    case 'turtle':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/15 via-transparent to-emerald-950/20">
          <span className="absolute bottom-20 left-8 text-2xl opacity-70">🪷</span>
          <span className="absolute bottom-16 right-10 text-xl opacity-70">🌿</span>
          <span className="absolute top-1/4 right-6 text-xl opacity-50 animate-pulse">🎋</span>
          <span className="absolute top-1/3 left-8 text-sm opacity-60 animate-ping">✨</span>
        </div>
      );

    case 'rabbit':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/15 via-transparent to-pink-950/20">
          <span className="absolute bottom-20 left-8 text-xl opacity-70 animate-bounce">🌸</span>
          <span className="absolute bottom-18 right-12 text-lg opacity-70">🌼</span>
          <span className="absolute bottom-16 left-24 text-base opacity-60">🍀</span>
          <span className="absolute top-1/4 left-10 text-lg opacity-50 animate-pulse">🥕</span>
        </div>
      );

    case 'panda':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 via-transparent to-slate-950/20">
          <span className="absolute top-1/3 right-8 text-2xl opacity-70">🎋</span>
          <span className="absolute bottom-20 left-10 text-lg opacity-70">🍃</span>
          <span className="absolute top-1/4 left-12 text-sm opacity-50 animate-pulse">✨</span>
        </div>
      );

    case 'fish':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/20 via-transparent to-blue-950/25">
          <span className="absolute bottom-20 left-10 text-xl opacity-70 animate-bounce delay-100">🫧</span>
          <span className="absolute bottom-36 right-12 text-lg opacity-60 animate-bounce delay-500">🫧</span>
          <span className="absolute bottom-52 left-1/3 text-sm opacity-50 animate-bounce delay-700">🫧</span>
          <span className="absolute bottom-14 left-6 text-2xl opacity-75">🪸</span>
          <span className="absolute bottom-16 right-8 text-2xl opacity-75">🐚</span>
        </div>
      );

    case 'koala':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-lime-500/15 via-transparent to-green-950/20">
          <span className="absolute top-1/3 left-12 text-xl opacity-70">🌿</span>
          <span className="absolute top-1/4 right-10 text-xl opacity-70">🍃</span>
          <span className="absolute bottom-18 left-8 text-lg opacity-60">🌳</span>
          <span className="absolute bottom-20 right-10 text-sm opacity-50 animate-pulse">✨</span>
        </div>
      );

    case 'dragon':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/15 via-transparent to-amber-950/25">
          <span className="absolute bottom-18 left-8 text-2xl opacity-70">💎</span>
          <span className="absolute bottom-20 right-10 text-xl opacity-70">🔮</span>
          <span className="absolute top-1/3 left-8 text-sm opacity-70 animate-pulse">🔥</span>
          <span className="absolute top-1/4 right-10 text-sm opacity-70 animate-bounce">✨</span>
        </div>
      );

    case 'penguin':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/15 via-transparent to-indigo-950/20">
          <span className="absolute bottom-16 left-10 text-2xl opacity-80">❄️</span>
          <span className="absolute bottom-18 right-12 text-xl opacity-70">🧊</span>
          <span className="absolute top-1/4 left-1/2 text-sm opacity-50 animate-pulse">✨</span>
        </div>
      );

    case 'raccoon':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/15 via-transparent to-slate-950/25">
          <div className="absolute top-4 right-8 text-3xl opacity-70">🌙</div>
          <span className="absolute top-1/4 left-8 text-sm opacity-70 animate-pulse">⭐</span>
          <span className="absolute top-1/3 right-14 text-xs opacity-60 animate-ping">✨</span>
          <span className="absolute bottom-16 left-8 text-xl opacity-70">🔍</span>
          <span className="absolute bottom-18 right-10 text-lg opacity-70">🍎</span>
        </div>
      );

    case 'red_panda':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/15 via-transparent to-orange-950/20">
          <span className="absolute top-1/4 left-8 text-2xl opacity-70 animate-bounce">🌸</span>
          <span className="absolute top-1/3 right-8 text-xl opacity-60 animate-bounce delay-300">🌺</span>
          <span className="absolute bottom-16 left-10 text-xl opacity-70">🍓</span>
          <span className="absolute bottom-18 right-10 text-xl opacity-70">🎋</span>
        </div>
      );

    case 'squirrel':
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/15 via-transparent to-yellow-950/20">
          <span className="absolute top-1/4 left-8 text-xl opacity-70">🍂</span>
          <span className="absolute top-1/3 right-8 text-xl opacity-70">🍁</span>
          <span className="absolute bottom-16 left-10 text-2xl opacity-80">🌰</span>
          <span className="absolute bottom-18 right-10 text-lg opacity-70">🍄</span>
        </div>
      );

    default:
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-amber-950/20">
          <span className="absolute bottom-16 left-8 text-xl opacity-60">🐾</span>
          <span className="absolute bottom-18 right-8 text-sm opacity-60 animate-pulse">✨</span>
        </div>
      );
  }
};
