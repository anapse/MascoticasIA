import React from 'react';
import { PetModel } from '../types/pet';
import { SpriteSheetRenderer } from './SpriteSheetRenderer';

interface AdoptModalProps {
  pet: PetModel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (petId: string) => void;
}

export const AdoptModal: React.FC<AdoptModalProps> = ({
  pet,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !pet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xs bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/70 text-center animate-scale-up">
        {/* Real Sprite Preview */}
        <div className="w-16 h-16 mx-auto mb-2 bg-white/70 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xs border border-white/80">
          <SpriteSheetRenderer pet={pet} emotion="curioso" size="sm" />
        </div>

        {/* Modal Title */}
        <h3 className="font-['Fredoka'] font-bold text-base text-slate-800 mb-1">
          ¿Dar a {pet.name} en adopción?
        </h3>

        {/* Modal Description */}
        <p className="font-['Nunito'] text-xs text-slate-600 mb-4 leading-snug">
          {pet.name} dejará de estar contigo y podrás adoptar otra mascota.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-1.5 px-3 rounded-xl font-['Fredoka'] font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pet.petId)}
            className="flex-1 py-1.5 px-3 rounded-xl font-['Fredoka'] font-semibold text-xs text-white bg-rose-500 hover:bg-rose-600 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            Dar en adopción
          </button>
        </div>
      </div>
    </div>
  );
};
