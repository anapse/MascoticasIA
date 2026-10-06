import React from 'react';
import { PetModel } from '../types/pet';
import { getPersonality } from '../pets/personalities';

interface PetStatsBarProps {
  pet: PetModel;
}

export const PetStatsBar: React.FC<PetStatsBarProps> = ({ pet }) => {
  const personality = getPersonality(pet.personality);

  return (
    <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-amber-200/60 shadow-sm">
      {/* Top Row: Name, Personality & Level badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-['Fredoka'] font-bold text-lg text-slate-800 tracking-wide">
            {pet.name}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-900">
            {personality.badge}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
          <span>⭐ Nivel {pet.level}</span>
        </div>
      </div>

      {/* Care Progress Bars (Energy, Hunger, Happiness) */}
      <div className="grid grid-cols-3 gap-2">
        {/* Energy Bar */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>⚡ Energía</span>
            <span>{pet.energy}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, pet.energy))}%` }}
            />
          </div>
        </div>

        {/* Hunger Bar (Pancita llena) */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>🍖 Pancita</span>
            <span>{pet.hunger}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, pet.hunger))}%` }}
            />
          </div>
        </div>

        {/* Happiness Bar */}
        <div className="flex flex-col gap-0.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>❤️ Cariño</span>
            <span>{pet.happiness}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, pet.happiness))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
