import React, { useState } from 'react';
import { loginPlayer, findPlayerByName } from '../services/storage';
import { PlayerModel } from '../types/pet';
import { PetBackground } from '../components/PetBackground';

interface LoginScreenProps {
  onSuccess: (player: PlayerModel) => void;
  onBack: () => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onBack,
  onGoToRegister,
}) => {
  const [nickname, setNickname] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWrongSecretModal, setShowWrongSecretModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    const cleanSecret = secretWord.trim();

    if (!cleanNick || !cleanSecret) {
      setErrorMessage('Por favor escribe tu apodo y palabra secreta');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Check if user exists
      const existing = await findPlayerByName(cleanNick);
      if (!existing) {
        setLoading(false);
        setShowNotFoundModal(true);
        return;
      }

      const res = await loginPlayer(cleanNick, cleanSecret);
      setLoading(false);

      if (res.success && res.player) {
        onSuccess(res.player);
      } else if (res.error === 'WRONG_SECRET') {
        setShowWrongSecretModal(true);
      } else {
        setShowNotFoundModal(true);
      }
    } catch {
      setLoading(false);
      setErrorMessage('Ocurrió un error al ingresar. Intenta de nuevo.');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3 select-none overflow-hidden font-['Nunito']">
      {/* Real Background Wallpaper with no white overlay */}
      <PetBackground />

      <div className="w-full max-w-xs bg-gradient-to-b from-white/75 to-white/45 backdrop-blur-md rounded-3xl p-5 border border-white/60 shadow-lg z-10 my-auto">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-['Fredoka'] font-medium text-slate-700 hover:text-slate-900 mb-3 inline-flex items-center gap-1 cursor-pointer"
        >
          ← Volver
        </button>

        {/* Top Logo */}
        <div className="text-center mb-4">
          <div className="w-20 h-20 mx-auto">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-sm animate-pet-breathe" />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-3 p-2 rounded-xl bg-rose-50/90 border border-rose-200 text-xs font-semibold text-rose-700 text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-[11px] font-['Fredoka'] font-medium text-slate-700 mb-1">
              Nombre / apodo
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Tu nombre o apodo..."
              autoCapitalize="words"
              required
              className="w-full px-3 py-2 rounded-xl border border-white/70 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 placeholder-slate-400 bg-white/75 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-['Fredoka'] font-medium text-slate-700 mb-1">
              Palabra secreta
            </label>
            <input
              type="password"
              value={secretWord}
              onChange={(e) => setSecretWord(e.target.value)}
              placeholder="Tu palabra secreta..."
              required
              className="w-full px-3 py-2 rounded-xl border border-white/70 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 placeholder-slate-400 bg-white/75 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl font-['Fredoka'] font-semibold text-xs sm:text-sm text-white bg-amber-500 hover:bg-amber-600 shadow-2xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer text-center"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      {/* Modal: Wrong Secret Word for Existing User (Requirement 6) */}
      {showWrongSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border-4 border-amber-300 text-center animate-scale-up">
            <div className="w-12 h-12 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <h3 className="font-['Fredoka'] font-bold text-lg text-amber-900 mb-1.5 uppercase">
              ¿SEGURO QUE ERES {nickname.toUpperCase()}?
            </h3>
            <p className="font-['Nunito'] text-xs text-slate-600 mb-1.5 leading-relaxed">
              Ya existe una cuenta con ese nombre, pero la palabra secreta no coincide.
            </p>
            <p className="font-['Nunito'] text-[11px] text-slate-400 mb-4">
              Prueba nuevamente o utiliza otro apodo.
            </p>
            <button
              type="button"
              onClick={() => setShowWrongSecretModal(false)}
              className="w-full py-2.5 px-4 rounded-2xl font-['Fredoka'] font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-200 transition-all cursor-pointer text-sm"
            >
              PROBAR DE NUEVO
            </button>
          </div>
        </div>
      )}

      {/* Modal: User Not Found */}
      {showNotFoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border-4 border-amber-300 text-center animate-scale-up">
            <div className="w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
              🐾
            </div>
            <h3 className="font-['Fredoka'] font-bold text-lg text-amber-900 mb-1.5">
              NO ENCONTRAMOS A {nickname.toUpperCase()}
            </h3>
            <p className="font-['Nunito'] text-xs text-slate-600 mb-4">
              Parece que todavía no has creado una mascota con este apodo.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onGoToRegister}
                className="w-full py-2.5 px-4 rounded-2xl font-['Fredoka'] font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-200 transition-all cursor-pointer text-sm"
              >
                CREAR MI MASCOTA 🐣
              </button>
              <button
                type="button"
                onClick={() => setShowNotFoundModal(false)}
                className="w-full py-2 px-4 rounded-2xl font-['Fredoka'] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer text-xs"
              >
                Corregir Apodo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
