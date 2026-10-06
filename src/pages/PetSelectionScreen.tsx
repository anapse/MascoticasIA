import React, { useState } from 'react';
import { PetSpeciesKey, PlayerModel, PetModel } from '../types/pet';
import { INITIAL_AVAILABLE_SPECIES, PET_CATALOG, getPetSpecies } from '../pets/petConfig';
import { getPersonality } from '../pets/personalities';
import { createPet } from '../services/storage';
import { SpriteSheetRenderer } from '../components/SpriteSheetRenderer';

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
      setError('Por favor ponle un lindo nombre a tu mascotica');
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
    <div className="relative w-full h-full flex flex-col items-center justify-between p-3.5 sm:p-5 overflow-hidden font-['Nunito']">
      {/* Background with fondo.png */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <img
          src="/fondo.png"
          alt="Fondo"
          className="w-full h-full object-cover brightness-[0.96]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/70 via-white/50 to-amber-100/75 backdrop-blur-[2px]" />
      </div>

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-2xl border-4 border-amber-300 animate-scale-up my-auto flex flex-col justify-between max-h-[95%] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 p-1 flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-['Fredoka'] font-bold text-lg text-amber-950 leading-tight">
                ELIGE TU MASCOTICA
              </h2>
              <p className="text-[10px] text-slate-500 font-semibold">
                ¡Hola <strong className="text-amber-800">{player.nickname}</strong>! Elige tu amiguito
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[11px] font-['Fredoka'] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              Volver
            </button>
          )}
        </div>

        {error && (
          <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-center">
            {error}
          </div>
        )}

        {/* Species Carousel / Grid */}
        <div className="mb-3 shrink-0">
          <p className="text-[11px] font-['Fredoka'] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            1. Selecciona tu especie favorita:
          </p>
          <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 no-scrollbar border rounded-2xl border-amber-100 bg-amber-50/30">
            {INITIAL_AVAILABLE_SPECIES.map((speciesKey) => {
              const def = PET_CATALOG[speciesKey];
              const isSelected = selectedSpecies === speciesKey;
              return (
                <button
                  key={speciesKey}
                  type="button"
                  onClick={() => handleSelectSpecies(speciesKey)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300 shadow transform scale-105'
                      : 'bg-white/80 hover:bg-amber-100/60 text-slate-700 border border-amber-200/50'
                  }`}
                >
                  <SpriteSheetRenderer speciesKey={speciesKey} emotion="feliz" size="xs" />
                  <span className="font-['Fredoka'] font-bold text-[10px] leading-tight mt-1">
                    {def.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pet Highlight Preview */}
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/70 border-2 border-amber-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/80 flex items-center justify-center shadow-inner shrink-0 overflow-hidden">
              <SpriteSheetRenderer speciesKey={selectedSpecies} emotion="feliz" size="sm" isAnimating />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="font-['Fredoka'] font-bold text-base text-slate-800">
                  {currentSpeciesDef.displayName}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {currentPersonality.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-['Nunito'] line-clamp-2 leading-tight">
                {currentSpeciesDef.description}
              </p>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-amber-200/60 flex items-start gap-1.5 text-[11px] font-semibold text-amber-900/90 italic leading-snug">
            <span>💬</span>
            <span>"{currentPersonality.sampleResponses.greeting}"</span>
          </div>
        </div>

        {/* Custom Pet Name Input */}
        <form onSubmit={handleAdopt} className="flex flex-col gap-2.5 shrink-0">
          <div>
            <label className="block text-[11px] font-['Fredoka'] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              2. Nombre para tu {currentSpeciesDef.displayName}:
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={`Ej: ${currentSpeciesDef.defaultName}, Luna, Toby...`}
              maxLength={20}
              required
              className="w-full px-3 py-2 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm font-['Nunito'] font-bold text-slate-800 placeholder-slate-400 bg-amber-50/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl font-['Fredoka'] font-bold text-base text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-300/60 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Adoptando...' : `¡ADOPTAR A ${customName.toUpperCase()}! 🎉`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
