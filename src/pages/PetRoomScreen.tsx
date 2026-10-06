import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { EmotionType, PetModel, PlayerModel } from '../types/pet';
import { getPetSpecies } from '../pets/petConfig';
import { getPersonality } from '../pets/personalities';
import { SpriteSheetRenderer } from '../components/SpriteSheetRenderer';
import { SpeechBubble } from '../components/SpeechBubble';
import { PetStatsBar } from '../components/PetStatsBar';
import { QuickActions } from '../components/QuickActions';
import { PetSelector } from '../components/PetSelector';
import { AdoptModal } from '../components/AdoptModal';
import { SpriteManagerModal } from '../components/SpriteManagerModal';
import { PetBackground } from '../components/PetBackground';
import { processPetInteraction } from '../services/aiService';
import {
  adoptPet,
  DAILY_AI_MESSAGE_LIMIT,
  getDailyAiMessageCount,
  updatePet,
} from '../services/storage';

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

  // States
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('saluda');
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [isEating, setIsEating] = useState<boolean>(false);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  // Modals
  const [petToAdoptOut, setPetToAdoptOut] = useState<PetModel | null>(null);
  const [showSpriteModal, setShowSpriteModal] = useState<boolean>(false);
  const [showQuestionsMenu, setShowQuestionsMenu] = useState<boolean>(false);

  // AI Message Count
  const [aiCount, setAiCount] = useState<number>(getDailyAiMessageCount(player.id));

  // Chat Input Ref
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial Daily Greeting
  useEffect(() => {
    const greetingTemplate = personality.sampleResponses.greeting;
    const personalizedGreeting = greetingTemplate.includes(player.nickname)
      ? greetingTemplate
      : `¡Hola, ${player.nickname}! 🐾 ${greetingTemplate}`;

    setCurrentMessage(personalizedGreeting);
    setCurrentEmotion('saluda');
    setIsTalking(true);

    const timer = setTimeout(() => {
      setIsTalking(false);
      setCurrentEmotion('feliz');
    }, 4000);

    return () => clearTimeout(timer);
  }, [activePet.petId]);

  // Handle Quick Action with Automatic Questions
  const handleQuickAction = async (
    actionKey: 'joke' | 'fact' | 'ask_menu' | 'learn' | 'game' | 'care_feed' | 'care_sleep'
  ) => {
    // 1. Ask Action: Focus input and open prompt helper
    if (actionKey === 'ask_menu') {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      setShowQuestionsMenu(true);
      return;
    }

    // 2. Feeding Action (Local, NO Gemini call)
    if (actionKey === 'care_feed') {
      setIsEating(true);
      setCurrentEmotion('comiendo');
      setIsThinking(true);

      const updated = {
        ...activePet,
        hunger: Math.min(100, activePet.hunger + 30),
        happiness: Math.min(100, activePet.happiness + 15),
        experience: activePet.experience + 10,
        level: activePet.experience + 10 >= activePet.level * 50 ? activePet.level + 1 : activePet.level,
        lastFed: new Date().toISOString(),
      };
      await updatePet(updated);
      onRefreshPets();

      const response = await processPetInteraction(activePet, player, '', 'care_feed');
      setIsThinking(false);
      setCurrentMessage(response.message);

      setTimeout(() => {
        setIsEating(false);
        setCurrentEmotion('feliz');
      }, 3500);
      return;
    }

    // 3. Sleep Action (Local, NO Gemini call)
    if (actionKey === 'care_sleep') {
      setIsSleeping(true);
      setCurrentEmotion('durmiendo');
      setIsThinking(true);

      const updated = {
        ...activePet,
        energy: Math.min(100, activePet.energy + 40),
        happiness: Math.min(100, activePet.happiness + 10),
        lastSlept: new Date().toISOString(),
      };
      await updatePet(updated);
      onRefreshPets();

      const response = await processPetInteraction(activePet, player, '', 'care_sleep');
      setIsThinking(false);
      setCurrentMessage(response.message);

      setTimeout(() => {
        setIsSleeping(false);
        setCurrentEmotion('feliz');
      }, 4000);
      return;
    }

    // 4. Automatic Prompts: Joke, Fact, Learn, Game
    setIsThinking(true);
    setCurrentEmotion('pensando');

    let promptAction: 'joke' | 'fact' | 'game' | 'learn' = 'joke';
    if (actionKey === 'joke') promptAction = 'joke';
    else if (actionKey === 'fact') promptAction = 'fact';
    else if (actionKey === 'game') promptAction = 'game';
    else if (actionKey === 'learn') promptAction = 'learn';

    const response = await processPetInteraction(activePet, player, '', promptAction);
    setIsThinking(false);
    setCurrentMessage(response.message);
    setCurrentEmotion(response.emotion);
    setIsTalking(true);
    setAiCount(getDailyAiMessageCount(player.id));

    if (response.emotion === 'risa' || response.emotion === 'sorpresa') {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
      });
    }

    setTimeout(() => {
      setIsTalking(false);
    }, 4500);
  };

  // Handle User Written Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isThinking) return;

    setInputText('');
    setIsThinking(true);
    setCurrentEmotion('pensando');

    const updated = {
      ...activePet,
      energy: Math.max(5, activePet.energy - 3),
      hunger: Math.max(5, activePet.hunger - 2),
      happiness: Math.min(100, activePet.happiness + 4),
      experience: activePet.experience + 5,
      level: activePet.experience + 5 >= activePet.level * 50 ? activePet.level + 1 : activePet.level,
    };
    await updatePet(updated);
    onRefreshPets();

    try {
      const response = await processPetInteraction(activePet, player, text);
      setIsThinking(false);
      setCurrentMessage(response.message);
      setCurrentEmotion(response.emotion);
      setIsTalking(true);
      setAiCount(getDailyAiMessageCount(player.id));

      if (response.emotion === 'risa' || response.emotion === 'sorpresa') {
        confetti({
          particleCount: 20,
          spread: 40,
          origin: { y: 0.7 },
        });
      }

      setTimeout(() => {
        setIsTalking(false);
      }, 4000);
    } catch {
      setIsThinking(false);
      setCurrentMessage(personality.sampleResponses.unknown);
      setCurrentEmotion('curioso');
    }
  };

  // Interactive Petting on Pet Tap
  const handlePetAffection = async () => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.5 },
    });

    const updated = {
      ...activePet,
      happiness: Math.min(100, activePet.happiness + 8),
      experience: activePet.experience + 3,
    };
    await updatePet(updated);
    onRefreshPets();

    setCurrentEmotion('feliz');
    setIsTalking(true);
    const petQuotes = [
      `¡Ronroneo de felicidad! ❤️ ¡Gracias por el cariño, ${player.nickname}!`,
      `¡Me encantan tus caricias! ✨`,
      `¡Qué cosquillitas tan ricas! 😂`,
    ];
    setCurrentMessage(petQuotes[Math.floor(Math.random() * petQuotes.length)]);

    setTimeout(() => {
      setIsTalking(false);
    }, 3000);
  };

  // Confirm Adoption Out
  const handleConfirmAdoptOut = async (petId: string) => {
    await adoptPet(petId);
    setPetToAdoptOut(null);
    onRefreshPets();
  };

  // Save Custom Sprite URL
  const handleSaveSprite = async (url: string) => {
    const updated = { ...activePet, customSpriteUrl: url };
    await updatePet(updated);
    onRefreshPets();
  };

  return (
    <div className="w-full h-full relative flex flex-col justify-between select-none overflow-hidden font-['Nunito']">
      {/* Rich Habitat Background for this Pet with fondo.png */}
      <PetBackground speciesKey={activePet.type} />

      {/* Top Navigation Bar with Official Logo */}
      <header className="w-full bg-white/85 backdrop-blur-md px-3.5 py-1.5 shadow-sm border-b border-amber-200/70 z-30 flex items-center justify-between shrink-0">
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
          {/* Sprite Sheet Manager button */}
          <button
            type="button"
            onClick={() => setShowSpriteModal(true)}
            title="Ajustar Sprite Sheet 3x3"
            className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-['Fredoka'] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            <span>🎨</span>
            <span className="text-[11px]">Sprites</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-['Fredoka'] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            <span>🚪</span>
          </button>
        </div>
      </header>

      {/* Main Sanctuary Area */}
      <main className="w-full flex-1 flex flex-col px-3 pt-2 pb-1 gap-2 justify-between overflow-hidden">
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

        {/* Pet Stats Bar */}
        <section className="w-full shrink-0">
          <PetStatsBar pet={activePet} />
        </section>

        {/* Central Mascotica Presentation Area */}
        <section
          className={`relative w-full flex-1 flex flex-col items-center justify-center my-auto transition-all duration-300 ${
            isKeyboardOpen ? 'scale-85 -translate-y-2' : 'scale-100'
          }`}
        >
          {/* Speech Bubble on top of Pet */}
          <div className="w-full mb-2 z-20">
            <SpeechBubble
              petName={activePet.name}
              message={currentMessage}
              emotion={currentEmotion}
              isThinking={isThinking}
            />
          </div>

          {/* Interactive Pet Visual Canvas */}
          <div className="relative flex flex-col items-center">
            <SpriteSheetRenderer
              pet={activePet}
              emotion={currentEmotion}
              isTalking={isTalking}
              isEating={isEating}
              isSleeping={isSleeping}
              size="lg"
              onClick={handlePetAffection}
              className="hover:scale-105 active:scale-95 transition-transform"
            />
            {/* Subtle shadow ground beneath pet */}
            <div className="w-32 h-3.5 bg-amber-950/15 rounded-full blur-sm -mt-2 -z-10" />

            <span className="text-[10px] font-bold text-amber-900/60 mt-1.5">
              (Toca a {activePet.name} para darle cariñito ❤️)
            </span>
          </div>
        </section>

        {/* Quick Action Buttons */}
        <section className="w-full shrink-0">
          <QuickActions onAction={handleQuickAction} disabled={isThinking} />
        </section>

        {/* Text Input Bar */}
        <section className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-lg border-2 border-amber-200 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onFocus={() => setIsKeyboardOpen(true)}
              onBlur={() => setIsKeyboardOpen(false)}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Escribe a ${activePet.name}...`}
              maxLength={200}
              className="flex-1 px-3 py-2 rounded-xl bg-amber-50/60 text-slate-800 font-['Nunito'] font-semibold text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 border border-amber-200/60"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold flex items-center justify-center shadow-md shadow-orange-300 transition-all active:scale-95 disabled:opacity-40 cursor-pointer text-sm"
            >
              ➤
            </button>
          </form>

          {/* Daily AI Message Counter */}
          <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-bold text-slate-500">
            <span>
              💬 Mensajes IA hoy: {DAILY_AI_MESSAGE_LIMIT - aiCount > 0 ? DAILY_AI_MESSAGE_LIMIT - aiCount : 0} / {DAILY_AI_MESSAGE_LIMIT}
            </span>
            <span className="text-amber-700">
              {species.displayName} ({personality.title})
            </span>
          </div>
        </section>
      </main>

      {/* Adoption Confirmation Modal */}
      <AdoptModal
        pet={petToAdoptOut}
        isOpen={Boolean(petToAdoptOut)}
        onClose={() => setPetToAdoptOut(null)}
        onConfirm={handleConfirmAdoptOut}
      />

      {/* Sprite Sheet 3x3 Manager Modal */}
      <SpriteManagerModal
        pet={activePet}
        isOpen={showSpriteModal}
        onClose={() => setShowSpriteModal(false)}
        onSaveSpriteUrl={handleSaveSprite}
      />

      {/* Quick Prompts Modal */}
      {showQuestionsMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-white rounded-3xl p-4 shadow-2xl border-4 border-amber-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
              <h3 className="font-['Fredoka'] font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <span>🧠</span>
                <span>Preguntas para {activePet.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuestionsMenu(false)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {[
                { title: '➕ ¿Cuánto es 5 × 5?', text: '¿Cuánto es 5 x 5?' },
                { title: '🔤 ¿Cómo se dice gracias en francés?', text: '¿Cómo se dice gracias en francés?' },
                { title: '🐾 ¿Por qué duermen tanto los koalas?', text: '¿Por qué duermen tanto los koalas?' },
                { title: '🎮 ¿Cuál es tu videojuego favorito?', text: '¿Cuál es tu videojuego favorito?' },
                { title: '🎌 ¿Conoces a Pikachu y Naruto?', text: '¿Conoces a Pikachu y Naruto?' },
                { title: '🌟 ¿Por qué brillan las estrellas?', text: '¿Por qué brillan las estrellas en la noche?' },
                { title: '🦖 ¿Existieron los dinosaurios voladores?', text: '¿Existieron los dinosaurios voladores?' },
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setShowQuestionsMenu(false);
                    setInputText(q.text);
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  className="w-full p-2 text-left rounded-xl bg-amber-50/70 hover:bg-amber-100 font-['Nunito'] font-bold text-xs text-amber-950 border border-amber-200/80 transition-all cursor-pointer"
                >
                  {q.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
