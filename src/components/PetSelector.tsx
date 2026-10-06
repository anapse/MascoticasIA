import React from 'react';
import { PetModel } from '../types/pet';
import { MAX_PETS_PER_PLAYER } from '../services/storage';
import { SpriteSheetRenderer } from './SpriteSheetRenderer';

interface PetSelectorProps {
  pets: PetModel[];
  activePetId: string;
  onSelectPet: (petId: string) => void;
  onAddNewPet: () => void;
  onAdoptOutPet: (pet: PetModel) => void;
}

export const PetSelector: React.FC<PetSelectorProps> = ({
  pets,
  activePetId,
  onSelectPet,
  onAddNewPet,
  onAdoptOutPet,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2">
        {pets.map((pet) => {
          const isActive = pet.petId === activePetId;
          return (
            <div key={pet.petId} className="relative group">
              <button
                type="button"
                onClick={() => onSelectPet(pet.petId)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-2xl font-['Fredoka'] font-bold text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-200 ring-2 ring-amber-300 ring-offset-1'
                    : 'bg-white/85 text-slate-700 hover:bg-amber-100/60 border border-amber-200/60'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
                  <SpriteSheetRenderer pet={pet} emotion="feliz" size="xs" />
                </div>
                <span>{pet.name}</span>
              </button>

              {/* Quick Adopt Out Button when active */}
              {isActive && (
                <button
                  type="button"
                  title="Dar en adopción"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdoptOutPet(pet);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow cursor-pointer"
                >
                  🤝
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Pet Button (if fewer than MAX_PETS_PER_PLAYER) */}
        {pets.length < MAX_PETS_PER_PLAYER && (
          <button
            type="button"
            onClick={onAddNewPet}
            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl font-['Fredoka'] font-bold text-xs bg-amber-100/80 text-amber-900 hover:bg-amber-200 border border-dashed border-amber-400 transition-all cursor-pointer"
          >
            <span>🐣</span>
            <span>Nueva Mascota</span>
          </button>
        )}
      </div>

      {/* Counter indicator */}
      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
        {pets.length}/{MAX_PETS_PER_PLAYER} Mascoticas
      </span>
    </div>
  );
};
