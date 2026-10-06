import React, { useState } from 'react';
import { PetSpeciesKey, PlayerModel, PetModel } from '../types/pet';
import { INITIAL_AVAILABLE_SPECIES, PET_CATALOG, getPetSpecies } from '../pets/petConfig';
import { getPersonality } from '../pets/personalities';
import { createPet } from '../services/storage';
import { SpriteSheetRenderer } from '../components/SpriteSheetRenderer';
import { PetBackground } from '../components/PetBackground';

interface PetSelectionScreenProps {
  player: PlayerModel;
  onPetCreated: (pet: PetModel) => void;
  onCancel?: () => void;
}

export const PetSelectionScreen: React.FC<PetSelectionScreenProps> = ({
  player,
  onPetCreated,
  onCancel,
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<PetSpeciesKey>('fox');
  const currentSpeciesDef = getPetSpecies(selectedSpecies);
  const [customName, setCustomName] = useState(currentSpeciesDef.defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPersonality = getPersonality(currentSpeciesDef.personality);

  const handleSelectSpecies = (speciesKey: PetSpeciesKey) => {
    setSelectedSpecies(speciesKey);
    const def = getPetSpecies(speciesKey);
    setCustomName(def.defaultName);
  };

  const handleAdopt = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customName.trim();
    if (!finalName) {
      setError('Por favor ponle un nombre a tu mascotica');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await createPet(
        player.id,
        selectedSpecies,
        finalName,
        currentSpeciesDef.personality
      );

      setLoading(false);
      if (res.success && res.pet) {
        onPetCreated(res.pet);
      } else {
        setError(res.error || 'No se pudo crear la mascota');
      }
    } catch {
      setLoading(false);
      setError('Ocurrió un error al adoptar la mascota');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3 select-none overflow-hidden font-['Nunito']">
      {/* Real Background Wallpaper with no white overlay */}
      <PetBackground />

      <div className="w-full max-w-xs bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border border-amber-900/10 shadow-sm z-10 my-auto flex flex-col justify-between max-h-[95%] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-amber-900/10 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100/70 p-0.5 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-sm sm:text-base text-amber-950 leading-tight">
                Elige tu mascotica
              </h2>
              <p className="text-[10px] text-slate-500 font-medium leading-none">
                Hola {player.nickname}
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[11px] font-['Fredoka'] font-medium text-slate-500 bg-white/80 hover:bg-white px-2 py-0.5 rounded-lg border border-amber-900/10 cursor-pointer"
            >
              Volver
            </button>
          )}
        </div>

        {error && (
          <div className="mb-2 p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 text-center">
            {error}
          </div>
        )}

        {/* Species Grid */}
        <div className="mb-2.5 shrink-0">
          <p className="text-[10px] font-['Fredoka'] font-medium text-slate-600 mb-1">
            1. Selecciona especie:
          </p>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-amber-50/50 border border-amber-900/10">
            {INITIAL_AVAILABLE_SPECIES.map((speciesKey) => {
              const def = PET_CATALOG[speciesKey];
              const isSelected = selectedSpecies === speciesKey;
              return (
                <button
                  key={speciesKey}
                  type="button"
                  onClick={() => handleSelectSpecies(speciesKey)}
                  className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-amber-950 shadow-2xs font-bold'
                      : 'bg-white/80 hover:bg-white text-slate-700'
                  }`}
                >
                  <SpriteSheetRenderer speciesKey={speciesKey} emotion="feliz" size="xs" />
                  <span className="font-['Fredoka'] text-[10px] leading-tight mt-0.5">
                    {def.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pet Highlight Preview */}
        <div className="mb-2.5 p-2 rounded-xl bg-amber-50/60 border border-amber-900/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-16 h-16 rounded-xl bg-white/80 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden border border-white/80">
              <SpriteSheetRenderer speciesKey={selectedSpecies} emotion="feliz" size="sm" isAnimating />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-['Fredoka'] font-bold text-sm text-slate-800">
                {currentSpeciesDef.displayName}
              </h3>
              <p className="text-[10px] text-slate-600 font-medium line-clamp-2 leading-tight">
                {currentSpeciesDef.description}
              </p>
            </div>
          </div>
        </div>

        {/* Custom Pet Name Input */}
        <form onSubmit={handleAdopt} className="flex flex-col gap-2 shrink-0">
          <div>
            <label className="block text-[10px] font-['Fredoka'] font-medium text-slate-600 mb-0.5">
              2. Nombre para tu mascota:
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`Ej: ${currentSpeciesDef.defaultName}`}
              maxLength={20}
              required
              className="w-full px-2.5 py-1.5 rounded-xl border border-amber-900/15 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 bg-white/80"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm text-white bg-amber-500 hover:bg-amber-600 shadow-2xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer text-center"
          >
            {loading ? 'Adoptando...' : `Adoptar a ${customName}`}
          </button>
        </form>
      </div>
    </div>
  );
};

