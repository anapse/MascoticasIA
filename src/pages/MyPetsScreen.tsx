import React, { useState } from 'react';
import { PetModel, PlayerModel } from '../types/pet';
import { PetBackground } from '../components/PetBackground';
import { SpriteSheetRenderer } from '../components/SpriteSheetRenderer';
import { AdoptModal } from '../components/AdoptModal';
import { RenameModal } from '../components/RenameModal';
import { getPetSpecies } from '../pets/petConfig';
import { MAX_PETS_PER_PLAYER } from '../services/storage';

interface MyPetsScreenProps {
  player: PlayerModel;
  pets: PetModel[];
  onSelectPet: (petId: string) => void;
  onAddNewPet: () => void;
  onLogout: () => void;
  onAdoptPet: (petId: string) => void;
  onRenamePet: (petId: string, newName: string) => void;
}

export const MyPetsScreen: React.FC<MyPetsScreenProps> = ({
  player,
  pets,
  onSelectPet,
  onAddNewPet,
  onLogout,
  onAdoptPet,
  onRenamePet,
}) => {
  const [petToAdopt, setPetToAdopt] = useState<PetModel | null>(null);
  const [petToRename, setPetToRename] = useState<PetModel | null>(null);

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center p-3 sm:p-4 select-none overflow-hidden font-['Nunito']">
      {/* Real Background Wallpaper */}
      <PetBackground />

      {/* Top Floating Header */}
      <div className="w-full z-20 flex items-center justify-between shrink-0 pt-1">
        <span className="text-xs font-['Fredoka'] font-bold text-amber-950/80">
          ¡Hola, {player.nickname}!
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="px-2.5 py-1 rounded-xl bg-white/70 hover:bg-white text-slate-700 text-xs font-['Fredoka'] font-medium shadow-2xs transition-all cursor-pointer"
        >
          Salir
        </button>
      </div>

      {/* Main Soft Gradient Semi-Transparent Panel */}
      <div className="w-full max-w-xs mx-auto z-10 flex-1 flex flex-col justify-between my-auto py-1 min-h-0">
        <div className="text-center mb-1.5 shrink-0">
          <h2 className="font-['Fredoka'] font-bold text-xl text-amber-950 drop-shadow-xs">
            Tus Mascoticas
          </h2>
          <p className="text-[11px] text-slate-600 font-medium">
            Elige con quién quieres interactuar
          </p>
        </div>

        {/* Pets Cards Carousel / List */}
        <div className="w-full flex-1 overflow-y-auto no-scrollbar space-y-2 pr-0.5 min-h-0">
          {pets.map((pet) => {
            const species = getPetSpecies(pet.type);
            return (
              <div
                key={pet.petId}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-b from-white/80 to-white/50 backdrop-blur-md border border-white/70 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-2.5"
              >
                {/* Pet Sprite Preview */}
                <div
                  onClick={() => onSelectPet(pet.petId)}
                  title="Jugar con mascota"
                  className="w-16 h-16 rounded-xl bg-white/70 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs cursor-pointer border border-white/80 hover:scale-105 transition-transform"
                >
                  <SpriteSheetRenderer pet={pet} emotion="feliz" size="sm" isAnimating />
                </div>

                {/* Pet Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-['Fredoka'] font-bold text-base text-slate-900 leading-tight truncate">
                      {pet.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPetToRename(pet)}
                      title="Cambiar nombre"
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-100/60 transition-colors cursor-pointer text-xs"
                    >
                      ✏️
                    </button>
                  </div>
                  <p className="text-xs text-amber-900/70 font-semibold mb-1.5">
                    {species.displayName}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectPet(pet.petId)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-['Fredoka'] text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      Jugar ›
                    </button>
                    <button
                      type="button"
                      onClick={() => setPetToAdopt(pet)}
                      className="px-2 py-1 rounded-lg bg-white/75 hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200/80 font-['Fredoka'] text-[10px] font-medium transition-all active:scale-95 cursor-pointer"
                    >
                      Dar en adopción
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Pet Button */}
        {pets.length < MAX_PETS_PER_PLAYER && (
          <div className="pt-2 shrink-0">
            <button
              type="button"
              onClick={onAddNewPet}
              className="w-full py-2 px-3 rounded-xl font-['Fredoka'] font-semibold text-xs text-amber-950 bg-white/80 hover:bg-white border border-dashed border-amber-500/60 shadow-2xs transition-all active:scale-95 cursor-pointer text-center"
            >
              + Adoptar otra mascota
            </button>
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-1 shrink-0" />

      {/* Modals */}
      <AdoptModal
        pet={petToAdopt}
        isOpen={!!petToAdopt}
        onClose={() => setPetToAdopt(null)}
        onConfirm={(petId) => {
          onAdoptPet(petId);
          setPetToAdopt(null);
        }}
      />

      <RenameModal
        pet={petToRename}
        isOpen={!!petToRename}
        onClose={() => setPetToRename(null)}
        onConfirm={(petId, newName) => {
          onRenamePet(petId, newName);
          setPetToRename(null);
        }}
      />
    </div>
  );
};
