import React, { useState, useEffect } from 'react';
import { PetModel } from '../types/pet';
import { SpriteSheetRenderer } from './SpriteSheetRenderer';

interface RenameModalProps {
  pet: PetModel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (petId: string, newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  pet,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (pet) {
      setName(pet.name);
      setError('');
    }
  }, [pet, isOpen]);

  if (!isOpen || !pet) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError('Escribe un nombre para tu mascotica');
      return;
    }
    if (clean.length > 20) {
      setError('El nombre no puede tener más de 20 caracteres');
      return;
    }
    onConfirm(pet.petId, clean);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xs bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/70 text-center animate-scale-up">
        {/* Real Sprite Preview */}
        <div className="w-16 h-16 mx-auto mb-2 bg-white/70 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xs border border-white/80">
          <SpriteSheetRenderer pet={pet} emotion="feliz" size="sm" />
        </div>

        {/* Modal Title */}
        <h3 className="font-['Fredoka'] font-bold text-base text-slate-800 mb-1">
          Cambiar nombre
        </h3>
        <p className="font-['Nunito'] text-xs text-slate-600 mb-3 leading-snug">
          ¿Cómo quieres llamar a tu mascotica?
        </p>

        {error && (
          <div className="mb-2 p-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="Nombre de la mascota"
            maxLength={20}
            autoFocus
            className="w-full px-3 py-2 rounded-xl border border-amber-900/15 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 bg-white/90 text-center font-['Fredoka'] font-semibold"
          />

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-1.5 px-3 rounded-xl font-['Fredoka'] font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-1.5 px-3 rounded-xl font-['Fredoka'] font-semibold text-xs text-white bg-amber-500 hover:bg-amber-600 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
