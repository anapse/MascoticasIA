import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EmotionType, PetModel, PlayerModel, ChatMessage } from '../types/pet';
import { getPetSpecies } from '../pets/petConfig';
import { SpriteSheetRenderer, PetAnimationType } from '../components/SpriteSheetRenderer';
import { QuickActions, QuickActionKey } from '../components/QuickActions';
import { PetBackground } from '../components/PetBackground';
import { processPetInteraction } from '../services/aiService';
import { updatePet } from '../services/storage';
import { soundService } from '../services/soundService';
import { RenameModal } from '../components/RenameModal';
import {
  SPONTANEOUS_PHRASES,
  HUNGER_REQUESTS,
  LOW_ENERGY_PHRASES,
  BOREDOM_REQUESTS,
  IGNORED_PHRASES,
} from '../data/localKnowledge';

interface PetRoomScreenProps {
  player: PlayerModel;
  pets: PetModel[];
  activePet: PetModel;
  onSelectPet: (petId: string) => void;
  onAddNewPet: () => void;
  onLogout: () => void;
  onRefreshPets: () => void;
  onGoToMyPets: () => void;
  onRenamePet?: (petId: string, newName: string) => void;
}

export const PetRoomScreen: React.FC<PetRoomScreenProps> = ({
  player,
  activePet,
  onLogout,
  onGoToMyPets,
  onRenamePet,
}) => {
  const species = getPetSpecies(activePet.type);

  // Modal
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Pet Emotion & Animation
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('feliz');
  const [animationType, setAnimationType] = useState<PetAnimationType>('breathe');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Pet Bars: Energy (0-100) and Boredom (0-100)
  const [energy, setEnergy] = useState<number>(activePet.energy ?? 80);
  const [boredom, setBoredom] = useState<number>(activePet.boredom ?? 20);

  // In-session messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');

  // References
  const inputRef = useRef<HTMLInputElement>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ignoredStepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const waitingForUserResponseRef = useRef<boolean>(false);

  // Helper to clear pending animation resets
  const clearActionTimeout = () => {
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  };

  const clearIgnoredTimer = () => {
    if (ignoredStepTimerRef.current) {
      clearTimeout(ignoredStepTimerRef.current);
      ignoredStepTimerRef.current = null;
    }
    waitingForUserResponseRef.current = false;
  };

  const registerUserActivity = useCallback(() => {
    lastInteractionTimeRef.current = Date.now();
    clearIgnoredTimer();
  }, []);

  // Save pet stats changes to persistent storage
  const syncPetStats = (newEnergy: number, newBoredom: number) => {
    updatePet({
      ...activePet,
      energy: newEnergy,
      boredom: newBoredom,
      lastPlayed: new Date().toISOString(),
    });
  };

  // 1. Enter Room: Welcome Chime and initial greeting
  useEffect(() => {
    soundService.unlockAudio();
    soundService.playEnter();

    setCurrentEmotion('saluda');
    setAnimationType('jump');

    const initialMsg: ChatMessage = {
      id: `init_${Date.now()}`,
      role: 'pet',
      text: `¡Hola, ${player.nickname}! ¡Qué alegría verte por aquí!`,
      emotion: 'saluda',
      timestamp: Date.now(),
    };
    setMessages([initialMsg]);

    const timer = setTimeout(() => {
      setAnimationType('breathe');
      setCurrentEmotion('feliz');
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearActionTimeout();
      clearIgnoredTimer();
      soundService.stopThinking();
    };
  }, [activePet.petId]);

  // 2. Slow decay of energy & slow rise of boredom over time
  useEffect(() => {
    const statsInterval = setInterval(() => {
      if (isThinking) return;

      setEnergy((prevEnergy) => {
        const next = Math.max(5, prevEnergy - 1);
        return next;
      });

      setBoredom((prevBoredom) => {
        const next = Math.min(100, prevBoredom + 1);
        return next;
      });
    }, 20000); // Every 20 seconds, subtle 1 point change

    return () => clearInterval(statsInterval);
  }, [isThinking]);

  // 3. Periodic check every 2 minutes for attention/hunger request
  useEffect(() => {
    const attentionInterval = setInterval(() => {
      if (isThinking || waitingForUserResponseRef.current) return;

      // 40% probability to trigger request
      if (Math.random() > 0.4) return;

      if (energy < 40) {
        const list = HUNGER_REQUESTS;
        const phrase = list[Math.floor(Math.random() * list.length)];
        setCurrentEmotion('comiendo');
        setAnimationType('eat');

        setMessages((prev) => [
          ...prev,
          {
            id: `hunger_${Date.now()}`,
            role: 'pet',
            text: phrase,
            emotion: 'comiendo',
            timestamp: Date.now(),
          },
        ]);

        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => {
          setCurrentEmotion('feliz');
          setAnimationType('breathe');
        }, 3500);
      } else if (boredom > 60) {
        const list = BOREDOM_REQUESTS;
        const phrase = list[Math.floor(Math.random() * list.length)];
        setCurrentEmotion('curioso');
        setAnimationType('curious');

        setMessages((prev) => [
          ...prev,
          {
            id: `bored_${Date.now()}`,
            role: 'pet',
            text: phrase,
            emotion: 'curioso',
            timestamp: Date.now(),
          },
        ]);

        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => {
          setCurrentEmotion('feliz');
          setAnimationType('breathe');
        }, 3000);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(attentionInterval);
  }, [energy, boredom, isThinking]);

  // 4. Spontaneous idle phrases (every 45s, low probability)
  useEffect(() => {
    const spontaneousInterval = setInterval(() => {
      if (isThinking || waitingForUserResponseRef.current) return;

      const idleDuration = Date.now() - lastInteractionTimeRef.current;
      // Only trigger if user has been inactive for at least 30s
      if (idleDuration < 30000) return;

      // 30% chance
      if (Math.random() > 0.3) return;

      const personalityList = SPONTANEOUS_PHRASES[activePet.personality] || SPONTANEOUS_PHRASES.default;
      const phrase = personalityList[Math.floor(Math.random() * personalityList.length)];

      setCurrentEmotion('feliz');
      setAnimationType('breathe');

      setMessages((prev) => [
        ...prev,
        {
          id: `spont_${Date.now()}`,
          role: 'pet',
          text: phrase,
          emotion: 'feliz',
          timestamp: Date.now(),
        },
      ]);

      waitingForUserResponseRef.current = true;

      // If user ignores for 25 seconds: Step 1: Curioso ("¿Hola...? ¿Sigues ahí?")
      ignoredStepTimerRef.current = setTimeout(() => {
        if (!waitingForUserResponseRef.current) return;

        setCurrentEmotion('curioso');
        setAnimationType('curious');
        setMessages((prev) => [
          ...prev,
          {
            id: `ign1_${Date.now()}`,
            role: 'pet',
            text: IGNORED_PHRASES.first,
            emotion: 'curioso',
            timestamp: Date.now(),
          },
        ]);

        // If user continues ignoring for another 25 seconds: Step 2: Molesto or Sleepy
        ignoredStepTimerRef.current = setTimeout(() => {
          if (!waitingForUserResponseRef.current) return;

          const isSleepy = activePet.personality === 'dormilon' || energy < 40;
          const nextEmotion = isSleepy ? 'durmiendo' : 'molesto';
          const nextText = isSleepy ? IGNORED_PHRASES.sleepy : IGNORED_PHRASES.molesto;

          setCurrentEmotion(nextEmotion);
          setAnimationType(isSleepy ? 'sleep' : 'breathe');

          setMessages((prev) => [
            ...prev,
            {
              id: `ign2_${Date.now()}`,
              role: 'pet',
              text: nextText,
              emotion: nextEmotion,
              timestamp: Date.now(),
            },
          ]);

          waitingForUserResponseRef.current = false;
        }, 25000);
      }, 25000);
    }, 45000);

    return () => clearInterval(spontaneousInterval);
  }, [activePet.personality, energy, isThinking]);

  // Handle Quick Actions
  const handleQuickAction = async (actionKey: QuickActionKey) => {
    registerUserActivity();
    clearActionTimeout();

    // 1. Comer (3.5s duration)
    if (actionKey === 'feed') {
      soundService.playEat();
      setCurrentEmotion('comiendo');
      setAnimationType('eat');

      const nextEnergy = Math.min(100, energy + 30);
      const nextBoredom = Math.max(0, boredom - 25);
      setEnergy(nextEnergy);
      setBoredom(nextBoredom);
      syncPetStats(nextEnergy, nextBoredom);

      actionTimeoutRef.current = setTimeout(() => {
        setCurrentEmotion('feliz');
        setAnimationType('breathe');

        setMessages((prev) => [
          ...prev,
          {
            id: `feed_${Date.now()}`,
            role: 'pet',
            text: '¡Qué rico! Ahora tengo más energía.',
            emotion: 'feliz',
            timestamp: Date.now(),
          },
        ]);
      }, 3500);

      return;
    }

    // 2. Bailar (4.5s duration)
    if (actionKey === 'dance') {
      soundService.playDance();
      setCurrentEmotion('saluda');
      setAnimationType('dance');

      const nextBoredom = Math.max(0, boredom - 35);
      setBoredom(nextBoredom);
      syncPetStats(energy, nextBoredom);

      actionTimeoutRef.current = setTimeout(() => {
        setCurrentEmotion('feliz');
        setAnimationType('breathe');

        setMessages((prev) => [
          ...prev,
          {
            id: `dance_${Date.now()}`,
            role: 'pet',
            text: '¡Mira mis pasos de baile! 🎶 ¿Te gustó?',
            emotion: 'feliz',
            timestamp: Date.now(),
          },
        ]);
      }, 4500);

      return;
    }

    // 3. Dormir (5.5s duration)
    if (actionKey === 'sleep') {
      soundService.playSleep();
      setCurrentEmotion('durmiendo');
      setAnimationType('sleep');

      const nextEnergy = Math.min(100, energy + 35);
      const nextBoredom = Math.max(0, boredom - 10);
      setEnergy(nextEnergy);
      setBoredom(nextBoredom);
      syncPetStats(nextEnergy, nextBoredom);

      actionTimeoutRef.current = setTimeout(() => {
        setCurrentEmotion('feliz');
        setAnimationType('breathe');

        setMessages((prev) => [
          ...prev,
          {
            id: `sleep_${Date.now()}`,
            role: 'pet',
            text: 'Zzz... necesitaba descansar. 😴',
            emotion: 'durmiendo',
            timestamp: Date.now(),
          },
        ]);
      }, 5500);

      return;
    }

    // 4. Chiste (4s duration) o Curiosidad (3s duration)
    let promptText = '';
    let actionType: 'joke' | 'fact' = 'joke';

    if (actionKey === 'joke') {
      promptText = 'Cuéntame un chiste corto y divertido.';
      actionType = 'joke';
      soundService.playLaugh();
      setCurrentEmotion('risa');
      setAnimationType('laugh');
    } else {
      promptText = 'Cuéntame una curiosidad corta e interesante.';
      actionType = 'fact';
      soundService.playButton();
      setCurrentEmotion('curioso');
      setAnimationType('curious');
    }

    const nextBoredom = Math.max(0, boredom - (actionKey === 'joke' ? 25 : 20));
    setBoredom(nextBoredom);
    syncPetStats(energy, nextBoredom);

    try {
      const interactionPet = { ...activePet, energy, boredom };
      const response = await processPetInteraction(interactionPet, player, promptText, actionType);

      setCurrentEmotion(response.emotion);
      if (response.emotion === 'risa') setAnimationType('laugh');
      else if (response.emotion === 'curioso') setAnimationType('curious');
      else setAnimationType('breathe');

      setMessages((prev) => [
        ...prev,
        {
          id: `pet_${Date.now()}`,
          role: 'pet',
          text: response.message,
          emotion: response.emotion,
          timestamp: Date.now(),
        },
      ]);

      const resetTime = actionKey === 'joke' ? 4000 : 3000;
      actionTimeoutRef.current = setTimeout(() => {
        setAnimationType('breathe');
        if (response.emotion !== 'durmiendo') {
          setCurrentEmotion('feliz');
        }
      }, resetTime);
    } catch {
      setCurrentEmotion('curioso');
      setAnimationType('breathe');
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'pet',
          text: 'No me llegó la respuesta. ¿Probamos con un chiste o bailamos?',
          emotion: 'curioso',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // Handle Free Chat Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isThinking) return;

    registerUserActivity();
    clearActionTimeout();

    setInputText('');
    setIsThinking(true);
    setCurrentEmotion('pensando');
    setAnimationType('talk');
    soundService.startThinking();

    const nextBoredom = Math.max(0, boredom - 30);
    setBoredom(nextBoredom);
    syncPetStats(energy, nextBoredom);

    try {
      const interactionPet = { ...activePet, energy, boredom };
      const response = await processPetInteraction(interactionPet, player, text);

      soundService.playSuccess();
      setIsThinking(false);
      setCurrentEmotion(response.emotion);

      if (response.emotion === 'risa') setAnimationType('laugh');
      else if (response.emotion === 'curioso') setAnimationType('curious');
      else if (response.emotion === 'comiendo') setAnimationType('eat');
      else if (response.emotion === 'durmiendo') setAnimationType('sleep');
      else setAnimationType('jump');

      setMessages((prev) => [
        ...prev,
        {
          id: `pet_${Date.now()}`,
          role: 'pet',
          text: response.message,
          emotion: response.emotion,
          timestamp: Date.now(),
        },
      ]);

      actionTimeoutRef.current = setTimeout(() => {
        setAnimationType('breathe');
        if (response.emotion !== 'durmiendo') {
          setCurrentEmotion('feliz');
        }
      }, 3500);
    } catch {
      soundService.stopThinking();
      setIsThinking(false);
      setCurrentEmotion('curioso');
      setAnimationType('breathe');

      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'pet',
          text: 'No pude encontrar una respuesta esta vez... inténtalo más tarde. ¿Quieres un chiste o verme bailar?',
          emotion: 'curioso',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // Get latest pet message to display in speech bubble
  const latestPetMessage =
    [...messages].reverse().find((m) => m.role === 'pet') || messages[messages.length - 1];

  return (
    <div className="w-full h-full relative flex flex-col justify-between p-3 select-none overflow-hidden font-['Nunito']">
      {/* Real Background Wallpaper with no white overlay */}
      <PetBackground />

      {/* Top Floating Controls: [🐾 Mascotas] (left) and [Salir] (right) */}
      <div className="w-full z-20 flex items-center justify-between shrink-0 pt-0.5">
        <button
          type="button"
          onClick={() => {
            soundService.playButton();
            onGoToMyPets();
          }}
          title="Ver mis mascotas"
          className="px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white text-slate-800 text-xs font-['Fredoka'] font-medium shadow-2xs transition-all cursor-pointer flex items-center gap-1 border border-amber-900/10"
        >
          <span>🐾</span>
          <span>Mascotas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playButton();
            onLogout();
          }}
          title="Cerrar sesión"
          className="px-2.5 py-1 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-['Fredoka'] font-medium shadow-2xs transition-all cursor-pointer border border-amber-900/10"
        >
          Salir
        </button>
      </div>

      {/* Left Vertical Energy Bar (Energía) */}
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none"
        title={`Energía: ${energy}%`}
      >
        <span className="px-1 rounded-full bg-white/90 border border-white text-[11px] font-bold text-amber-600 shadow-md">⚡</span>
        <div className="w-3.5 sm:w-4 h-36 sm:h-44 bg-black/35 backdrop-blur-xs rounded-full p-0.5 flex flex-col justify-end overflow-hidden border-2 border-black/80 shadow-lg ring-1 ring-white/70">
          <div
            className="w-full rounded-full bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 transition-all duration-700"
            style={{ height: `${energy}%` }}
          />
        </div>
      </div>

      {/* Right Vertical Boredom Bar (Aburrimiento) */}
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none"
        title={`Aburrimiento: ${boredom}%`}
      >
        <span className="px-1 rounded-full bg-white/90 border border-white text-[11px] font-bold text-indigo-600 shadow-md">🫧</span>
        <div className="w-3.5 sm:w-4 h-36 sm:h-44 bg-black/35 backdrop-blur-xs rounded-full p-0.5 flex flex-col justify-end overflow-hidden border-2 border-black/80 shadow-lg ring-1 ring-white/70">
          <div
            className={`w-full rounded-full transition-all duration-700 ${
              boredom >= 60
                ? 'bg-gradient-to-t from-rose-500 via-rose-400 to-amber-400'
                : 'bg-gradient-to-t from-indigo-500 via-indigo-400 to-violet-300'
            }`}
            style={{ height: `${Math.max(boredom, 7)}%` }}
          />
        </div>
      </div>

      {/* Main Pet Sanctuary Area: Priority element occupying most of the room */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto z-10 min-h-0">
        {/* Pet Name & Discreet Rename */}
        <div className="text-center mb-1 shrink-0">
          <div className="flex justify-center mb-0.5">
            <img
              src={import.meta.env.BASE_URL + 'sprites/logo.png'}
              alt="Mascoticas IA"
              className="h-7 sm:h-8 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div className="flex items-center justify-center gap-1">
            <h2 className="font-['Fredoka'] font-bold text-xl sm:text-2xl text-slate-900 drop-shadow-xs tracking-wide uppercase">
              {activePet.name}
            </h2>
            {onRenamePet && (
              <button
                type="button"
                onClick={() => {
                  soundService.playButton();
                  setShowRenameModal(true);
                }}
                title="Cambiar nombre"
                className="p-1 rounded-lg text-slate-400 hover:text-amber-800 hover:bg-white/60 transition-colors cursor-pointer text-[11px]"
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
            animationType={animationType}
            size="hero"
            onClick={() => {
              registerUserActivity();
              soundService.playButton();
              setCurrentEmotion('feliz');
              setAnimationType('jump');
              clearActionTimeout();
              actionTimeoutRef.current = setTimeout(() => {
                setAnimationType('breathe');
              }, 1200);
            }}
            className="transition-transform active:scale-95"
          />

          {/* Discreet, subtle ground shadow */}
          <div className="w-24 h-2 bg-black/15 rounded-full blur-[2px] -mt-1 pointer-events-none" />
        </div>
      </div>

      {/* Lower Secondary Area: Message + Compact Actions + Input */}
      <div className="w-full flex flex-col gap-1.5 z-20 shrink-0 pb-1">
        {/* Compact Pet Speech Bubble */}
        <div className="w-full max-w-xs mx-auto min-h-[36px] flex items-center justify-center px-2">
          {isThinking ? (
            <div className="px-3 py-1 rounded-xl bg-white/90 border border-amber-900/10 text-xs font-medium text-slate-600 shadow-2xs flex items-center gap-1.5 animate-pulse">
              <span>Pensando...</span>
            </div>
          ) : latestPetMessage ? (
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/90 text-slate-800 text-xs sm:text-sm font-medium text-center shadow-2xs border border-amber-900/10 leading-snug">
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
            onChange={(e) => {
              setInputText(e.target.value);
              registerUserActivity();
            }}
            placeholder={`Habla con ${activePet.name}...`}
            maxLength={150}
            className="flex-1 px-3 py-1.5 rounded-xl bg-white/85 hover:bg-white focus:bg-white text-slate-800 font-medium text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-amber-900/15 shadow-2xs transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            onClick={() => soundService.playButton()}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            ➤
          </button>
        </form>
      </div>

      {/* Discreet Rename Modal */}
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
