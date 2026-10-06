import React, { useState, useEffect, useRef } from 'react';
import { EmotionType, PetModel, PlayerModel, ChatMessage } from '../types/pet';
import { getPetSpecies } from '../pets/petConfig';
import { SpriteSheetRenderer } from '../components/SpriteSheetRenderer';
import { QuickActions, QuickActionKey } from '../components/QuickActions';
import { PetBackground } from '../components/PetBackground';
import { processPetInteraction } from '../services/aiService';
import { updatePet } from '../services/storage';
import { AdoptModal } from '../components/AdoptModal';
import { RenameModal } from '../components/RenameModal';

interface PetRoomScreenProps {
  player: PlayerModel;
  pets: PetModel[];
  activePet: PetModel;
  onSelectPet: (petId: string) => void;
  onAddNewPet: () => void;
  onLogout: () => void;
  onRefreshPets: () => void;
  onGoToMyPets: () => void;
  onAdoptPet?: (petId: string) => void;
  onRenamePet?: (petId: string, newName: string) => void;
}

export const PetRoomScreen: React.FC<PetRoomScreenProps> = ({
  player,
  activePet,
  onLogout,
  onGoToMyPets,
  onAdoptPet,
  onRenamePet,
}) => {
  const species = getPetSpecies(activePet.type);

  // Modals
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Current Pet Emotion & Animation
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('feliz');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // In-session messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');

  // References
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting message when switching/loading pet
  useEffect(() => {
    setCurrentEmotion('saluda');
    setIsAnimating(true);

    const initialMsg: ChatMessage = {
      id: `init_${Date.now()}`,
      role: 'pet',
      text: `¡Hola, ${player.nickname}! ¡Qué alegría verte por aquí!`,
      emotion: 'saluda',
      timestamp: Date.now(),
    };

    setMessages([initialMsg]);

    const timer = setTimeout(() => {
      setIsAnimating(false);
      setCurrentEmotion('feliz');
    }, 2000);

    return () => clearTimeout(timer);
  }, [activePet.petId]);

  // Handle Quick Actions (Chiste, Curiosidad, Comer, Dormir, Bailar)
  const handleQuickAction = async (actionKey: QuickActionKey) => {
    // 1. Dar comida (Aumenta comida y energía)
    if (actionKey === 'feed') {
      setCurrentEmotion('comiendo');
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentEmotion('feliz');
        setIsAnimating(false);

        const newMsg: ChatMessage = {
          id: `feed_${Date.now()}`,
          role: 'pet',
          text: '¡Qué rico! Ahora tengo más energía.',
          emotion: 'feliz',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, newMsg]);

        updatePet({
          ...activePet,
          energy: Math.min(100, (activePet.energy || 70) + 25),
          hunger: Math.min(100, (activePet.hunger || 70) + 30),
          lastFed: new Date().toISOString(),
        });
      }, 1600);

      return;
    }

    // 2. Dormir (Aumenta energía con descanso)
    if (actionKey === 'sleep') {
      setCurrentEmotion('durmiendo');
      setIsAnimating(true);

      setTimeout(() => {
        setIsAnimating(false);

        const newMsg: ChatMessage = {
          id: `sleep_${Date.now()}`,
          role: 'pet',
          text: 'Zzz... Un buen descanso para recuperar toda mi energía.',
          emotion: 'durmiendo',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, newMsg]);

        updatePet({
          ...activePet,
          energy: Math.min(100, (activePet.energy || 70) + 35),
          lastSlept: new Date().toISOString(),
        });
      }, 1800);

      return;
    }

    // 3. Bailar (Animación alegre y aumento de felicidad)
    if (actionKey === 'dance') {
      setCurrentEmotion('saluda');
      setIsAnimating(true);

      setTimeout(() => {
        setIsAnimating(false);
        setCurrentEmotion('feliz');

        const newMsg: ChatMessage = {
          id: `dance_${Date.now()}`,
          role: 'pet',
          text: '¡Mira mis pasos de baile! 🎶 ¡Qué divertido!',
          emotion: 'feliz',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, newMsg]);

        updatePet({
          ...activePet,
          happiness: Math.min(100, (activePet.happiness || 80) + 20),
        });
      }, 2000);

      return;
    }

    // 4. Chiste o Curiosidad
    let promptText = '';
    let actionType: 'joke' | 'fact' = 'joke';

    if (actionKey === 'joke') {
      promptText = 'Cuéntame un chiste corto y divertido.';
      actionType = 'joke';
      setCurrentEmotion('risa');
    } else if (actionKey === 'fact') {
      promptText = 'Cuéntame una curiosidad corta e interesante.';
      actionType = 'fact';
      setCurrentEmotion('curioso');
    }

    setIsAnimating(true);
    setIsThinking(true);

    try {
      const response = await processPetInteraction(activePet, player, promptText, actionType);

      setIsThinking(false);
      setCurrentEmotion(response.emotion);

      const petMsg: ChatMessage = {
        id: `pet_${Date.now()}`,
        role: 'pet',
        text: response.message,
        emotion: response.emotion,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, petMsg]);

      setTimeout(() => {
        setIsAnimating(false);
        if (response.emotion !== 'durmiendo') {
          setCurrentEmotion('feliz');
        }
      }, 3500);
    } catch {
      setIsThinking(false);
      setIsAnimating(false);
      setCurrentEmotion('pensando');
      const fallbackMsg: ChatMessage = {
        id: `busy_${Date.now()}`,
        role: 'pet',
        text: 'En este momento estoy ocupado, por favor inténtalo más tarde.',
        emotion: 'pensando',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // Handle Free Chat Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isThinking) return;

    setInputText('');
    setIsThinking(true);
    setCurrentEmotion('pensando');

    try {
      const response = await processPetInteraction(activePet, player, text);

      setIsThinking(false);
      setCurrentEmotion(response.emotion);
      setIsAnimating(true);

      const petMsg: ChatMessage = {
        id: `pet_${Date.now()}`,
        role: 'pet',
        text: response.message,
        emotion: response.emotion,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, petMsg]);

      setTimeout(() => {
        setIsAnimating(false);
        if (response.emotion !== 'durmiendo') {
          setCurrentEmotion('feliz');
        }
      }, 3500);
    } catch {
      setIsThinking(false);
      setCurrentEmotion('pensando');
      const fallbackMsg: ChatMessage = {
        id: `busy_${Date.now()}`,
        role: 'pet',
        text: 'En este momento estoy ocupado, por favor inténtalo más tarde.',
        emotion: 'pensando',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // Get latest pet message to display in the compact speech area
  const latestPetMessage =
    [...messages].reverse().find((m) => m.role === 'pet') || messages[messages.length - 1];

  return (
    <div className="w-full h-full relative flex flex-col justify-between p-3 select-none overflow-hidden font-['Nunito']">
      {/* Real Background Wallpaper with no white overlay */}
      <PetBackground />

      {/* Discreet Top Floating Controls: Ir a Mis Mascotas, Dar en adopción & Salir */}
      <div className="w-full z-20 flex items-center justify-between shrink-0 pt-0.5">
        <button
          type="button"
          onClick={onGoToMyPets}
          title="Ver mis mascotas"
          className="px-2.5 py-1 rounded-xl bg-white/75 hover:bg-white text-slate-800 text-xs font-['Fredoka'] font-medium shadow-2xs transition-all cursor-pointer flex items-center gap-1"
        >
          <span>🐾</span>
          <span>Mascotas</span>
        </button>

        <div className="flex items-center gap-1.5">
          {onAdoptPet && (
            <button
              type="button"
              onClick={() => setShowAdoptModal(true)}
              title="Dar en adopción"
              className="px-2 py-1 rounded-xl bg-white/75 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-[11px] font-['Fredoka'] font-medium border border-rose-200/60 shadow-2xs transition-all cursor-pointer"
            >
              Dar en adopción
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="px-2.5 py-1 rounded-xl bg-white/75 hover:bg-white text-slate-700 text-xs font-['Fredoka'] font-medium shadow-2xs transition-all cursor-pointer"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Main Pet Sanctuary Area: Priority element occupying most of the room */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto z-10 min-h-0">
        {/* Pet Name & Species */}
        <div className="text-center mb-1 shrink-0">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="font-['Fredoka'] font-bold text-xl sm:text-2xl text-slate-900 drop-shadow-xs tracking-wide uppercase">
              {activePet.name}
            </h2>
            {onRenamePet && (
              <button
                type="button"
                onClick={() => setShowRenameModal(true)}
                title="Cambiar nombre"
                className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-white/60 transition-colors cursor-pointer text-xs"
              >
                ✏️
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-600 font-semibold -mt-0.5">
            {species.displayName}
          </p>
        </div>

        {/* Large Central Pet Sprite */}
        <div className="relative flex flex-col items-center justify-center my-auto">
          <SpriteSheetRenderer
            pet={activePet}
            emotion={currentEmotion}
            isAnimating={isAnimating}
            size="hero"
            onClick={() => {
              setCurrentEmotion('feliz');
              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 1200);
            }}
            className="transition-transform active:scale-95"
          />

          {/* Discreet, subtle ground shadow */}
          <div className="w-24 h-2 bg-black/15 rounded-full blur-[2px] -mt-1 pointer-events-none" />
        </div>
      </div>

      {/* Lower Secondary Area: Message + Compact Actions + Input */}
      <div className="w-full flex flex-col gap-1.5 z-20 shrink-0 pb-1">
        {/* Compact Pet Message Area */}
        <div className="w-full max-w-xs mx-auto min-h-[38px] flex items-center justify-center px-2">
          {isThinking ? (
            <div className="px-3 py-1 rounded-xl bg-white/85 border border-amber-900/10 text-xs font-medium text-slate-600 shadow-2xs flex items-center gap-1.5 animate-pulse">
              <span>Pensando...</span>
            </div>
          ) : latestPetMessage ? (
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/85 text-slate-800 text-xs sm:text-sm font-medium text-center shadow-2xs border border-amber-900/10 leading-snug">
              "{latestPetMessage.text}"
            </div>
          ) : null}
        </div>

        {/* Single-row QuickActions: [ Chiste ] [ Curiosidad ] [ Acciones ▾ ] */}
        <QuickActions onAction={handleQuickAction} disabled={isThinking} />

        {/* Compact Message Input */}
        <form onSubmit={handleSendMessage} className="w-full flex items-center gap-1.5 pt-0.5">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Habla con ${activePet.name}...`}
            maxLength={150}
            className="flex-1 px-3 py-1.5 rounded-xl bg-white/85 hover:bg-white focus:bg-white text-slate-800 font-medium text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-amber-900/15 shadow-2xs transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            ➤
          </button>
        </form>
      </div>

      {/* Modals */}
      <AdoptModal
        pet={activePet}
        isOpen={showAdoptModal}
        onClose={() => setShowAdoptModal(false)}
        onConfirm={(petId) => {
          setShowAdoptModal(false);
          if (onAdoptPet) onAdoptPet(petId);
        }}
      />

      <RenameModal
        pet={activePet}
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onConfirm={(petId, newName) => {
          setShowRenameModal(false);
          if (onRenamePet) onRenamePet(petId, newName);
        }}
      />
    </div>
  );
};
