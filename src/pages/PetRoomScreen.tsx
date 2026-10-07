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
  EXTRA_SPONTANEOUS_PHRASES,
  HUNGER_REQUESTS,
  LOW_ENERGY_PHRASES,
  BOREDOM_REQUESTS,
  IGNORED_PHRASES,
  PET_ACTION_REQUESTS,
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
  const [emotionNotice, setEmotionNotice] = useState<string | null>(null);
  const [emotionNoticeVisible, setEmotionNoticeVisible] = useState(false);
  const [ignoredShake, setIgnoredShake] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const emotionNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showEmotionNotice = useCallback((text: string, shake = false, duration = 5000) => {
    if (emotionNoticeTimerRef.current) clearTimeout(emotionNoticeTimerRef.current);
    setEmotionNotice(text);
    setIgnoredShake(shake);
    setEmotionNoticeVisible(true);
    emotionNoticeTimerRef.current = setTimeout(() => {
      setEmotionNoticeVisible(false);
      setIgnoredShake(false);
    }, duration);
  }, []);

  const clearEmotionNotice = useCallback(() => {
    if (emotionNoticeTimerRef.current) clearTimeout(emotionNoticeTimerRef.current);
    emotionNoticeTimerRef.current = null;
    setEmotionNoticeVisible(false);
    setIgnoredShake(false);
  }, []);

  const registerUserActivity = useCallback(() => {
    lastInteractionTimeRef.current = Date.now();
    clearIgnoredTimer();
    clearEmotionNotice();
  }, [clearEmotionNotice]);

  const buildContext = useCallback((source: ChatMessage[]) =>
    source.slice(-6).map((m) => ({
      role: m.role === 'pet' ? 'model' as const : 'user' as const,
      content: m.text,
    })), []);

  const clearChat = useCallback(() => {
    clearEmotionNotice();
    setMessages([]);
    setInputText('');
    setIsThinking(false);
    setCurrentEmotion('feliz');
    setAnimationType('breathe');
  }, [clearEmotionNotice]);

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
      soundService.stopDanceMusic();
      clearActionTimeout();
      clearIgnoredTimer();
      soundService.stopThinking();
      if (emotionNoticeTimerRef.current) clearTimeout(emotionNoticeTimerRef.current);
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

  // 3. Contextual needs: the pet asks for the exact action indicated by its bars.
  // Checks often enough to feel alive, but never floods the conversation.
  useEffect(() => {
    const attentionInterval = setInterval(() => {
      if (isThinking || waitingForUserResponseRef.current) return;
      if (Math.random() > 0.65) return;

      let category: keyof typeof PET_ACTION_REQUESTS | null = null;
      let emotion: EmotionType = 'curioso';
      let animation: PetAnimationType = 'breathe';

      // Energy has priority: when low, the pet asks for food; when very low, sleep.
      if (energy <= 25) {
        category = 'sleepy';
        emotion = 'durmiendo';
        animation = 'sleep';
      } else if (energy <= 45) {
        category = 'hungry';
        emotion = 'comiendo';
        animation = 'eat';
      } else if (boredom >= 65) {
        category = 'bored';
        emotion = 'curioso';
        animation = 'curious';
      } else {
        category = Math.random() < 0.5 ? 'joke' : 'fact';
        emotion = category === 'joke' ? 'risa' : 'curioso';
        animation = category === 'joke' ? 'laugh' : 'curious';
      }

      const list = PET_ACTION_REQUESTS[category];
      const phrase = list[Math.floor(Math.random() * list.length)];

      setCurrentEmotion(emotion);
      setAnimationType(animation);
      showEmotionNotice(phrase, false, 6500);
      waitingForUserResponseRef.current = true;

      // The pet gets sad/annoyed if the requested action is ignored.
      const waitMs = 30000 + Math.floor(Math.random() * 60001);
      ignoredStepTimerRef.current = setTimeout(() => {
        if (!waitingForUserResponseRef.current) return;

        const isSleepy = energy <= 25 || activePet.personality === 'dormilon';
        const nextEmotion: EmotionType = isSleepy ? 'durmiendo' : 'molesto';
        const nextText = isSleepy
          ? 'Zzz... necesitaba dormir. 😴 ¿Me ayudas con el botón Dormir?'
          : '🥺 Te lo pedí porque de verdad lo necesitaba... ¿me haces caso?';

        setCurrentEmotion(nextEmotion);
        setAnimationType(isSleepy ? 'sleep' : 'breathe');
        showEmotionNotice(nextText, true, 6500);
        waitingForUserResponseRef.current = false;
        ignoredStepTimerRef.current = null;
      }, waitMs);
    }, 30000);

    return () => clearInterval(attentionInterval);
  }, [activePet.personality, energy, boredom, isThinking, showEmotionNotice]);

  // 4. Spontaneous idle conversation. The pet talks by itself when the user leaves it alone.
  // If ignored after a spontaneous comment, it reacts with a random annoyed/sleepy follow-up
  // between 30 and 90 seconds. Any user activity cancels that reaction.
  useEffect(() => {
    const spontaneousInterval = setInterval(() => {
      if (isThinking || waitingForUserResponseRef.current) return;

      const idleDuration = Date.now() - lastInteractionTimeRef.current;
      if (idleDuration < 30000) return;

      // High enough to make the pet feel alive, without flooding the chat.
      if (Math.random() > 0.7) return;

      const baseList = SPONTANEOUS_PHRASES[activePet.personality] || SPONTANEOUS_PHRASES.default;
      const extraList = EXTRA_SPONTANEOUS_PHRASES[activePet.personality] || EXTRA_SPONTANEOUS_PHRASES.default;
      const personalityList = [...baseList, ...extraList];
      const phrase = personalityList[Math.floor(Math.random() * personalityList.length)];

      setCurrentEmotion('feliz');
      setAnimationType('breathe');
      showEmotionNotice(phrase, false, 6500);
      waitingForUserResponseRef.current = true;

      // The pet waits a random 30-90 seconds before reacting to being ignored.
      const waitMs = 30000 + Math.floor(Math.random() * 60001);
      ignoredStepTimerRef.current = setTimeout(() => {
        if (!waitingForUserResponseRef.current) return;

        const isSleepy = activePet.personality === 'dormilon' || energy < 35;
        const nextEmotion = isSleepy ? 'durmiendo' : 'molesto';
        const nextText = isSleepy
          ? IGNORED_PHRASES.sleepy
          : [
              IGNORED_PHRASES.molesto,
              '¡Oye! Te estoy hablando. 😒',
              '¿Hola? Creo que me estás ignorando... 😤',
              'Bueno... me voy a enfadar un poquito. 😒',
              '¿Tan ocupado estás que no puedes contestarme? 😤',
              'Aquí sigo esperando tu respuesta. 🙄',
            ][Math.floor(Math.random() * 6)];

        setCurrentEmotion(nextEmotion);
        setAnimationType(isSleepy ? 'sleep' : 'breathe');
        showEmotionNotice(nextText, true, 6500);
        waitingForUserResponseRef.current = false;
        ignoredStepTimerRef.current = null;
      }, waitMs);
    }, 30000);

    return () => clearInterval(spontaneousInterval);
  }, [activePet.personality, energy, isThinking, showEmotionNotice]);

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

    // 2. Bailar (20s duration)
    if (actionKey === 'dance') {
      soundService.playDance();
      setCurrentEmotion('saluda');
      setAnimationType('dance');
      setMessages((prev) => [
        ...prev,
        {
          id: `dance_start_${Date.now()}`,
          role: 'pet',
          text: '¡Sí! ¡Bailemos! 💃🎶',
          emotion: 'saluda',
          timestamp: Date.now(),
        },
      ]);

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
      }, 20000);

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
      const response = await processPetInteraction(interactionPet, player, promptText, actionType, buildContext(messages));

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
          question: promptText,
          retryable: response.retryable,
          question: text,
          retryable: response.retryable,
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

  const handleRetry = async (messageId: string) => {
    const target = messages.find((message) => message.id === messageId);
    if (!target?.question || isThinking) return;

    registerUserActivity();
    clearActionTimeout();
    setIsThinking(true);
    setCurrentEmotion('pensando');
    setAnimationType('talk');
    soundService.startThinking();

    try {
      const interactionPet = { ...activePet, energy, boredom };
      const context = buildContext(messages.filter((message) => message.id !== messageId));
      const response = await processPetInteraction(interactionPet, player, target.question, 'chat', context);

      soundService.playSuccess();
      setIsThinking(false);
      setCurrentEmotion(response.emotion);
      setAnimationType(response.emotion === 'risa' ? 'laugh' : response.emotion === 'curioso' ? 'curious' : 'breathe');

      setMessages((prev) => [
        ...prev.filter((message) => message.id !== messageId),
        {
          id: `retry_${Date.now()}`,
          role: 'pet',
          text: response.message,
          emotion: response.emotion,
          timestamp: Date.now(),
          question: target.question,
          retryable: response.retryable,
        },
      ]);
    } catch {
      soundService.stopThinking();
      setIsThinking(false);
      setCurrentEmotion('molesto');
      setAnimationType('breathe');
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== messageId),
        {
          ...target,
          text: '⚠️ No pude responder esta vez.',
          emotion: 'molesto',
          timestamp: Date.now(),
          retryable: true,
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

    const contextBefore = buildContext(messages);
    setMessages((prev) => [...prev, { id: `user_${Date.now()}`, role: 'user', text, timestamp: Date.now() }]);
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
      const response = await processPetInteraction(interactionPet, player, text, 'chat', contextBefore);

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
          question: text,
          retryable: response.retryable,
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
          text: '⚠️ No pude responder esta vez.',
          emotion: 'curioso',
          timestamp: Date.now(),
          question: text,
          retryable: true,
        },
      ]);
    }
  };

  const latestPetMessageId = [...messages].reverse().find((message) => message.role === 'pet')?.id;

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const haloColor =
    currentEmotion === 'molesto' ? 'rgba(239,68,68,0.30)' :
    currentEmotion === 'risa' ? 'rgba(56,189,248,0.32)' :
    currentEmotion === 'feliz' ? 'rgba(59,130,246,0.28)' :
    currentEmotion === 'curioso' ? 'rgba(168,85,247,0.25)' :
    currentEmotion === 'sorpresa' ? 'rgba(250,204,21,0.28)' :
    currentEmotion === 'durmiendo' ? 'rgba(99,102,241,0.24)' :
    currentEmotion === 'comiendo' ? 'rgba(249,115,22,0.28)' :
    'rgba(56,189,248,0.24)';

  return (
    <div className="w-full h-full relative flex flex-col p-3 select-text overflow-hidden font-['Nunito']">
      <style>{`
        @keyframes mascotHaloPulse { 0%,100% { transform:scale(.92); opacity:.55 } 50% { transform:scale(1.08); opacity:1 } }
        @keyframes mascotDisco { 0%,100% { background:rgba(59,130,246,.26) } 20% { background:rgba(168,85,247,.28) } 40% { background:rgba(236,72,153,.28) } 60% { background:rgba(34,197,94,.28) } 80% { background:rgba(250,204,21,.30) } }
        @keyframes mascotShake { 0%,100% { transform:translateX(0) } 20% { transform:translateX(-4px) } 40% { transform:translateX(4px) } 60% { transform:translateX(-3px) } 80% { transform:translateX(3px) } }
        .mascot-selectable { user-select:text !important; -webkit-user-select:text !important; -webkit-touch-callout:default; }
      `}</style>

      <PetBackground />

      <div className="w-full z-30 flex items-center justify-between shrink-0 pt-0.5">
        <button type="button" onClick={() => { soundService.playButton(); onGoToMyPets(); }} className="px-2.5 py-1 rounded-xl bg-white/80 text-slate-800 text-xs font-['Fredoka'] font-medium shadow-2xs border border-amber-900/10">
          🐾 Mascotas
        </button>
        <button type="button" onClick={() => { soundService.playButton(); onLogout(); }} className="px-2.5 py-1 rounded-xl bg-white/80 text-slate-700 text-xs font-['Fredoka'] font-medium shadow-2xs border border-amber-900/10">
          Salir
        </button>
      </div>

      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none">
        <span className="px-1 rounded-full bg-white/90 border border-white text-[11px] font-bold text-amber-600 shadow-md">⚡</span>
        <div className="w-3.5 sm:w-4 h-36 sm:h-44 bg-black/35 backdrop-blur-xs rounded-full p-0.5 flex flex-col justify-end overflow-hidden border-2 border-black/80 shadow-lg ring-1 ring-white/70">
          <div className="w-full rounded-full bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 transition-all duration-700" style={{height:`${energy}%`}} />
        </div>
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 pointer-events-none">
        <span className="px-1 rounded-full bg-white/90 border border-white text-[11px] font-bold text-indigo-600 shadow-md">🫧</span>
        <div className="w-3.5 sm:w-4 h-36 sm:h-44 bg-black/35 backdrop-blur-xs rounded-full p-0.5 flex flex-col justify-end overflow-hidden border-2 border-black/80 shadow-lg ring-1 ring-white/70">
          <div className="w-full rounded-full bg-gradient-to-t from-indigo-600 via-indigo-400 to-cyan-300 transition-all duration-700" style={{height:Math.max(100-boredom,5)+'%'}} />
        </div>
      </div>

      <div className="w-full flex flex-col items-center shrink-0 z-10 pt-1">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <h2 className="font-['Fredoka'] font-bold text-xl sm:text-2xl text-slate-900 drop-shadow-xs tracking-wide uppercase">{activePet.name}</h2>
            {onRenamePet && <button type="button" onClick={() => { soundService.playButton(); setShowRenameModal(true); }} className="p-1 rounded-lg text-slate-400 hover:text-amber-800 text-[11px]">✏️</button>}
          </div>
          <p className="text-[11px] text-slate-600 font-semibold -mt-0.5">{species.displayName}</p>
        </div>

        <div className="relative flex items-center justify-center mt-0.5">
          <div
            className={`absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full blur-2xl pointer-events-none ${ignoredShake ? 'mascot-shake' : ''}`}
            style={animationType === 'dance'
              ? { animation: 'mascotDisco 1.8s ease-in-out infinite' }
              : { background: `radial-gradient(circle, ${haloColor} 0%, rgba(255,255,255,0) 72%)`, animation: 'mascotHaloPulse 2.4s ease-in-out 2' }}
          />
          <SpriteSheetRenderer pet={activePet} emotion={currentEmotion} animationType={animationType} size="hero"
            onClick={() => {
              registerUserActivity();
              soundService.playButton();
              setCurrentEmotion('feliz');
              setAnimationType('jump');
              clearActionTimeout();
              actionTimeoutRef.current=setTimeout(()=>setAnimationType('breathe'),1200);
            }}
            className={ignoredShake ? 'mascot-shake transition-transform active:scale-95' : 'transition-transform active:scale-95'} />

          {emotionNoticeVisible && emotionNotice && (
            <div className={`absolute top-[78%] left-1/2 -translate-x-1/2 z-40 max-w-[260px] px-3 py-2 rounded-2xl bg-white/55 backdrop-blur-md border border-white/70 shadow-lg text-slate-800 text-xs sm:text-sm font-medium text-center leading-snug ${ignoredShake ? 'mascot-shake' : ''}`}>
              {emotionNotice}
            </div>
          )}
        </div>
      </div>

      <div ref={chatScrollRef} className="w-full max-w-md mx-auto flex-1 min-h-0 overflow-y-auto overscroll-contain px-1 py-2 space-y-1.5 z-20 scrollbar-thin">
        {messages.map((message) => {
          const isUser=message.role==='user';
          const isLatestRetry=!isUser && message.id===latestPetMessageId;
          return (
            <div key={message.id} className={`flex ${isUser?'justify-end':'justify-start'} items-end gap-1`}>
              {!isUser && <span className="text-xs shrink-0">🐨</span>}
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs sm:text-sm leading-snug shadow-sm border mascot-selectable ${isUser?'bg-green-100/95 border-green-200 text-green-950 rounded-br-md':'bg-sky-100/95 border-sky-200 text-sky-950 rounded-bl-md'}`}>
                {message.text}
              </div>
              {isLatestRetry && <button type="button" onClick={()=>handleRetry(message.id)} disabled={isThinking} title="Reintentar esta pregunta" className="shrink-0 w-7 h-7 rounded-full bg-white/80 border border-sky-200 text-sky-700 shadow-sm text-sm active:scale-90 disabled:opacity-40">↻</button>}
            </div>
          );
        })}
        {isThinking && <div className="flex justify-start items-end gap-1"><span className="text-xs">🐨</span><div className="px-3 py-2 rounded-2xl rounded-bl-md bg-sky-100/90 border border-sky-200 text-sky-700 text-xs shadow-sm animate-pulse">Pensando...</div></div>}
      </div>

      <div className="w-full flex flex-col gap-1.5 z-30 shrink-0 pb-1">
        <div className="flex items-center justify-center gap-1.5">
          <QuickActions onAction={handleQuickAction} disabled={isThinking} />
          <button type="button" disabled={isThinking||messages.length===0} onClick={()=>{soundService.playButton();clearChat();}} title="Borrar conversación de esta sesión" className="px-2.5 py-1.5 rounded-xl bg-white/75 text-slate-600 text-xs border border-amber-900/10 shadow-2xs active:scale-95 disabled:opacity-40">🗑️</button>
        </div>
        <form onSubmit={handleSendMessage} className="w-full flex items-center gap-1.5 pt-0.5">
          <input ref={inputRef} type="text" value={inputText} onChange={(e)=>{setInputText(e.target.value);registerUserActivity();}} placeholder={`Habla con ${activePet.name}...`} maxLength={150} className="flex-1 px-3 py-1.5 rounded-xl bg-white/85 text-slate-800 font-medium text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-amber-900/15 shadow-2xs" />
          <button type="submit" disabled={!inputText.trim()||isThinking} onClick={()=>soundService.playButton()} className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-2xs active:scale-95 disabled:opacity-40">➤</button>
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
