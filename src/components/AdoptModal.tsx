import React from 'react';
import { PetModel } from '../types/pet';
import { getPetSpecies } from '../pets/petConfig';

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
  const species = getPetSpecies(pet.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 text-center animate-scale-up">
        {/* Modal Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center text-3xl shadow-inner">
          {species.speciesEmoji}
        </div>

        {/* Modal Title */}
        <h3 className="font-['Fredoka'] font-bold text-xl text-slate-800 mb-2">
          ¿Quieres dar a {pet.name} en adopción?
        </h3>

        {/* Modal Description */}
        <p className="font-['Nunito'] text-sm text-slate-600 mb-6 leading-relaxed">
          <strong className="text-amber-800">{pet.name}</strong> dejará de estar disponible para ti y podrás crear otra mascota.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl font-['Fredoka'] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pet.petId)}
            className="flex-1 py-3 px-4 rounded-2xl font-['Fredoka'] font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 transition-all active:scale-95 cursor-pointer"
          >
            DAR EN ADOPCIÓN
          </button>
        </div>
      </div>
    </div>
  );
};
