import React, { useState } from 'react';
import { loginPlayer, findPlayerByName } from '../services/storage';
import { PlayerModel } from '../types/pet';

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
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden font-['Nunito']">
      {/* Background with fondo.png */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <img
          src="/fondo.png"
          alt="Fondo"
          className="w-full h-full object-cover brightness-[0.97]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/60 via-white/50 to-amber-100/70 backdrop-blur-[2px]" />
      </div>

      <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-2xl border-4 border-amber-300 animate-scale-up my-auto">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-['Fredoka'] font-bold text-amber-800 hover:text-amber-900 mb-2 inline-flex items-center gap-1 cursor-pointer"
        >
          ← Volver
        </button>

        {/* Header with Logo */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto mb-1">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow" />
          </div>
          <h2 className="font-['Fredoka'] font-bold text-2xl text-amber-950">
            ENTRAR
          </h2>
          <p className="text-xs text-slate-500 font-['Nunito']">
            Escribe tus datos para ver a tus mascoticas
          </p>
        </div>

        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-xs font-['Fredoka'] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Nombre / apodo
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej: Sofía, Leo, Lucas..."
              autoCapitalize="words"
              required
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm font-['Nunito'] font-bold text-slate-800 placeholder-slate-400 bg-amber-50/40"
            />
          </div>

          <div>
            <label className="block text-xs font-['Fredoka'] font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Palabra secreta
            </label>
            <input
              type="password"
              value={secretWord}
              onChange={(e) => setSecretWord(e.target.value)}
              placeholder="Tu palabra secreta..."
              required
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm font-['Nunito'] font-bold text-slate-800 placeholder-slate-400 bg-amber-50/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-3.5 px-5 rounded-2xl font-['Fredoka'] font-bold text-base text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-300/60 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-t border-amber-100">
          <p className="text-xs text-slate-500 font-medium">¿Aún no tienes una mascota?</p>
          <button
            type="button"
            onClick={onGoToRegister}
            className="mt-0.5 text-xs font-['Fredoka'] font-bold text-orange-600 hover:text-orange-700 cursor-pointer underline underline-offset-2"
          >
            Crear mi primera mascotica 🐣
          </button>
        </div>
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
