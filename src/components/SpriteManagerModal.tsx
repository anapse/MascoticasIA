import React, { useState } from 'react';
import { PetModel } from '../types/pet';
import { ALLOWED_EMOTIONS, EMOTIONS_MAP } from '../pets/emotions';
import { getPetSpecies } from '../pets/petConfig';

interface SpriteManagerModalProps {
  pet: PetModel;
  isOpen: boolean;
  onClose: () => void;
  onSaveSpriteUrl: (spriteUrl: string) => void;
}

export const SpriteManagerModal: React.FC<SpriteManagerModalProps> = ({
  pet,
  isOpen,
  onClose,
  onSaveSpriteUrl,
}) => {
  const [urlInput, setUrlInput] = useState(pet.customSpriteUrl || '');
  const [selectedPreviewEmotion, setSelectedPreviewEmotion] = useState(ALLOWED_EMOTIONS[0]);
  const species = getPetSpecies(pet.type);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setUrlInput(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveSpriteUrl(urlInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{species.speciesEmoji}</span>
            <h3 className="font-['Fredoka'] font-bold text-lg text-slate-800">
              Sprite Sheet 3×3 de {pet.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 3x3 Grid Specification Guide */}
        <div className="mb-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
          <p className="font-bold mb-1">📐 Formato 3 Columnas × 3 Filas (PNG):</p>
          <div className="grid grid-cols-3 gap-1 text-[11px] text-center font-semibold mt-2">
            <div className="bg-white p-1 rounded border border-amber-200">1. FELIZ 😊</div>
            <div className="bg-white p-1 rounded border border-amber-200">2. MOLESTO 😒</div>
            <div className="bg-white p-1 rounded border border-amber-200">3. RISA 😆</div>
            <div className="bg-white p-1 rounded border border-amber-200">4. CURIOSO 🤔</div>
            <div className="bg-white p-1 rounded border border-amber-200">5. SORPRESA 😮</div>
            <div className="bg-white p-1 rounded border border-amber-200">6. DORMIR 😴</div>
            <div className="bg-white p-1 rounded border border-amber-200">7. COMER 😋</div>
            <div className="bg-white p-1 rounded border border-amber-200">8. SALUDA 👋</div>
            <div className="bg-white p-1 rounded border border-amber-200">9. PENSAR 💭</div>
          </div>
        </div>

        {/* Upload or URL input */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Cargar archivo de imagen Sprite Sheet (PNG):
          </label>
          <input
            type="file"
            accept="image/png, image/webp"
            onChange={handleFileUpload}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-['Fredoka'] file:font-bold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            O ingresar URL de Sprite Sheet:
          </label>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="/sprites/fox.png o https://..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Live 3x3 Matrix Preview */}
        {urlInput && (
          <div className="mb-5">
            <p className="text-xs font-bold text-slate-700 mb-2">Vista previa de emoción:</p>
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {ALLOWED_EMOTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setSelectedPreviewEmotion(em)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-['Fredoka'] font-semibold cursor-pointer ${
                    selectedPreviewEmotion === em ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {EMOTIONS_MAP[em].emoji} {EMOTIONS_MAP[em].label}
                </button>
              ))}
            </div>
            <div className="w-32 h-32 mx-auto rounded-2xl border-2 border-amber-300 bg-amber-50/50 flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full bg-no-repeat"
                style={{
                  backgroundImage: `url(${urlInput})`,
                  backgroundSize: '300% 300%',
                  backgroundPosition: `${EMOTIONS_MAP[selectedPreviewEmotion].col * 50}% ${EMOTIONS_MAP[selectedPreviewEmotion].row * 50}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-['Fredoka'] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 rounded-xl font-['Fredoka'] font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-200 cursor-pointer"
          >
            Guardar Sprite
          </button>
        </div>
      </div>
    </div>
  );
};
