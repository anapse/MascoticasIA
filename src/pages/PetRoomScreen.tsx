import React, { useState, useEffect, useRef } from 'react';
import { EmotionType, PetModel, PlayerModel, ChatMessage } from '../types/pet';
import { getPetSpecies } from '../pets/petConfig';
import { getPersonality } from '../pets/personalities';
import { SpriteSheetRenderer } from '../components/SpriteSheetRenderer';
import { QuickActions, QuickActionKey } from '../components/QuickActions';
import { PetSelector } from '../components/PetSelector';
import { AdoptModal } from '../components/AdoptModal';
import { PetBackground } from '../components/PetBackground';
import { processPetInteraction } from '../services/aiService';
import { adoptPet, updatePet } from '../services/storage';

interface PetRoomScreenProps {
  player: PlayerModel;
  pets: PetModel[];
  activePet: PetModel;
  onSelectPet: (petId: string) => void;
  onAddNewPet: () => void;
  onLogout: () => void;
  onRefreshPets: () => void;
}

export const PetRoomScreen: React.FC<PetRoomScreenProps> = ({
  player,
  pets,
  activePet,
  onSelectPet,
  onAddNewPet,
  onLogout,
  onRefreshPets,
}) => {
  const species = getPetSpecies(activePet.type);
  const personality = getPersonality(activePet.personality);

  // Current Pet Emotion & Animation
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('feliz');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Real in-session chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');

  // Modal for adoption confirmation
  const [petToAdoptOut, setPetToAdoptOut] = useState<PetModel | null>(null);

  // References
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Initial greeting message when switching/loading pet
  useEffect(() => {
    const greetingTemplate = personality.sampleResponses.greeting;
    const greetingText = greetingTemplate.includes(player.nickname)
      ? greetingTemplate
      : `¡Hola, ${player.nickname}! 🐾 ${greetingTemplate}`;

    setCurrentEmotion('saluda');
    setIsAnimating(true);

    const initialMsg: ChatMessage = {
      id: `init_${Date.now()}`,
      role: 'pet',
      text: greetingText,
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

  // Handle Quick Action Buttons
  const handleQuickAction = async (actionKey: QuickActionKey) => {
    // 1. Preguntar -> Focus input field directly
    if (actionKey === 'ask') {
      inputRef.current?.focus();
      return;
    }

    // 2. Dar comida -> Local action only
    if (actionKey === 'feed') {
      setCurrentEmotion('comiendo');
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentEmotion('feliz');
        setIsAnimating(false);

        const newMsg: ChatMessage = {
          id: `feed_${Date.now()}`,
          role: 'pet',
          text: '¡Qué rico! ❤️ Ahora me siento mucho mejor.',
          emotion: 'feliz',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, newMsg]);

        // Update pet local status
        updatePet({
          ...activePet,
          hunger: Math.min(100, (activePet.hunger || 70) + 25),
          happiness: Math.min(100, (activePet.happiness || 80) + 15),
          lastFed: new Date().toISOString(),
        });
      }, 1500);

      return;
    }

    // 3. Dormir -> Local action only
    if (actionKey === 'sleep') {
      setCurrentEmotion('durmiendo');
      setIsAnimating(true);

      setTimeout(() => {
        setIsAnimating(false);

        const newMsg: ChatMessage = {
          id: `sleep_${Date.now()}`,
          role: 'pet',
          text: 'Zzz... 😴 Necesito descansar.',
          emotion: 'durmiendo',
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, newMsg]);

        updatePet({
          ...activePet,
          energy: Math.min(100, (activePet.energy || 70) + 30),
          lastSlept: new Date().toISOString(),
        });
      }, 1500);

      return;
    }

    // 4. Automated Actions: Chiste, Curiosidad, Aprende, Jugar
    let promptText = '';
    let actionType: 'joke' | 'fact' | 'learn' | 'game' = 'joke';

    if (actionKey === 'joke') {
      promptText = 'Cuéntame un chiste corto y divertido.';
      actionType = 'joke';
    } else if (actionKey === 'fact') {
      promptText = 'Cuéntame una curiosidad corta e interesante.';
      actionType = 'fact';
    } else if (actionKey === 'learn') {
      promptText = 'Enséñame algo corto y fácil de aprender hoy.';
      actionType = 'learn';
    } else if (actionKey === 'game') {
      promptText = 'Propónme un juego corto que podamos hacer juntos.';
      actionType = 'game';
    }

    // Add user prompt to chat
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setCurrentEmotion('pensando');

    try {
      const response = await processPetInteraction(activePet, player, promptText, actionType);

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
      }, 2000);
    } catch {
      setIsThinking(false);
      setCurrentEmotion('curioso');
    }
  };

  // Handle Free User Input Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isThinking) return;

    setInputText('');

    // Add user message to conversation
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
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
      }, 2000);
    } catch {
      setIsThinking(false);
      setCurrentEmotion('curioso');
      const fallbackMsg: ChatMessage = {
        id: `pet_fallback_${Date.now()}`,
        role: 'pet',
        text: 'Mmm... no estoy seguro de eso 😅',
        emotion: 'curioso',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // Confirm Adoption Out
  const handleConfirmAdoptOut = async (petId: string) => {
    await adoptPet(petId);
    setPetToAdoptOut(null);
    onRefreshPets();
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between select-none overflow-hidden font-['Nunito']">
      {/* Clean Background Image */}
      <PetBackground />

      {/* Top Header */}
      <header className="w-full bg-white/85 backdrop-blur-md px-3.5 py-2 shadow-sm border-b border-amber-200/70 z-30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 p-0.5 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-['Fredoka'] font-bold text-sm sm:text-base text-amber-950 leading-none">
              MASCOTICAS IA
            </h1>
            <span className="text-[10px] font-bold text-slate-500">
              Amiguito: <strong className="text-amber-800">{player.nickname}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-['Fredoka'] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            <span>🚪 Salir</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col px-3 pt-1.5 pb-2 justify-between overflow-hidden gap-1.5">
        {/* Multi-Pet Selector */}
        <section className="w-full shrink-0">
          <PetSelector
            pets={pets}
            activePetId={activePet.petId}
            onSelectPet={onSelectPet}
            onAddNewPet={onAddNewPet}
            onAdoptOutPet={(pet) => setPetToAdoptOut(pet)}
          />
        </section>

        {/* Pet Name & Species Header */}
        <div className="w-full text-center shrink-0">
          <h2 className="font-['Fredoka'] font-bold text-lg sm:text-xl text-amber-950 leading-tight">
            {activePet.name}
          </h2>
          <span className="text-[11px] font-bold text-amber-800/80">
            {species.displayName} • {personality.title}
          </span>
        </div>

        {/* Central Pet Area */}
        <section className="w-full shrink-0 flex flex-col items-center justify-center my-0">
          <SpriteSheetRenderer
            pet={activePet}
            emotion={currentEmotion}
            isAnimating={isAnimating}
            size="md"
            onClick={() => {
              setCurrentEmotion('feliz');
              setIsAnimating(true);
              setTimeout(() => setIsAnimating(false), 1500);
            }}
            className="hover:scale-105 active:scale-95 transition-transform"
          />
          <div className="w-28 h-3 bg-amber-950/15 rounded-full blur-xs -mt-1 -z-10" />
        </section>

        {/* Real In-Session Conversation Stream */}
        <section className="w-full flex-1 min-h-[120px] bg-white/90 backdrop-blur-md rounded-2xl p-2.5 shadow-md border border-amber-200/80 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 no-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-bold text-slate-500 mb-0.5 px-1">
                  {msg.role === 'user' ? 'Tú' : activePet.name}
                </span>
                <div
                  className={`px-3 py-1.5 rounded-2xl max-w-[85%] text-xs sm:text-sm font-semibold break-words leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-white rounded-tr-xs'
                      : 'bg-amber-100 text-amber-950 rounded-tl-xs border border-amber-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-slate-500 mb-0.5 px-1">
                  {activePet.name}
                </span>
                <div className="px-3 py-1.5 rounded-2xl bg-amber-50 text-slate-500 rounded-tl-xs border border-amber-200 text-xs italic flex items-center gap-1.5">
                  <span>Pensando...</span>
                  <span className="inline-flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        </section>

        {/* Quick Action Buttons */}
        <section className="w-full shrink-0">
          <QuickActions onAction={handleQuickAction} disabled={isThinking} />
        </section>

        {/* Input Field & Send Button */}
        <section className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-md border-2 border-amber-200 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Escribe un mensaje a ${activePet.name}...`}
              maxLength={150}
              className="flex-1 px-3 py-2 rounded-xl bg-amber-50/60 text-slate-800 font-semibold text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 border border-amber-200/60"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold flex items-center justify-center shadow-md shadow-orange-300 transition-all active:scale-95 disabled:opacity-40 cursor-pointer text-sm"
            >
              ➤
            </button>
          </form>
        </section>
      </main>

      {/* Adoption Confirmation Modal */}
      <AdoptModal
        pet={petToAdoptOut}
        isOpen={Boolean(petToAdoptOut)}
        onClose={() => setPetToAdoptOut(null)}
        onConfirm={handleConfirmAdoptOut}
      />
    </div>
  );
};
