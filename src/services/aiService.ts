import { AiChatResponse, EmotionType, PetModel, PlayerModel } from '../types/pet';
import { checkChildSafety, evaluateSimpleMath, getQuickTranslation, LOCAL_JOKES, LOCAL_FACTS } from '../data/localKnowledge';
import { getPersonality } from '../pets/personalities';
import { getPetSpecies } from '../pets/petConfig';
import { DAILY_AI_MESSAGE_LIMIT, getDailyAiMessageCount, incrementDailyAiMessageCount } from './storage';

export async function processPetInteraction(
  pet: PetModel,
  player: PlayerModel,
  userInput: string,
  actionType?: 'joke' | 'fact' | 'care_feed' | 'care_sleep' | 'game' | 'learn' | 'chat'
): Promise<AiChatResponse> {
  const species = getPetSpecies(pet.type);
  const personality = getPersonality(pet.personality);

  // 1. Action: Feeding (Local resolution, NO Gemini call)
  if (actionType === 'care_feed') {
    return {
      message: '¡Qué rico! Ahora me siento mucho mejor.',
      emotion: 'comiendo',
      source: 'local_care',
    };
  }

  // 2. Action: Sleeping (Local resolution, NO Gemini call)
  if (actionType === 'care_sleep') {
    return {
      message: 'Zzz... Necesito descansar un ratito.',
      emotion: 'durmiendo',
      source: 'local_care',
    };
  }

  // 3. Action: Joke (Prioritize LOCAL_JOKES for instant, guaranteed personality jokes)
  if (actionType === 'joke') {
    const list = LOCAL_JOKES[pet.personality] || LOCAL_JOKES['molesto'];
    const selectedJoke = list[Math.floor(Math.random() * list.length)];
    return {
      message: selectedJoke,
      emotion: 'risa',
      source: 'local_joke',
    };
  }

  // 4. Action: Fact / Curiosidad (Prioritize LOCAL_FACTS for instant, fascinating curiosities)
  if (actionType === 'fact') {
    const selectedFact = LOCAL_FACTS[Math.floor(Math.random() * LOCAL_FACTS.length)];
    return {
      message: selectedFact,
      emotion: 'curioso',
      source: 'local_fact',
    };
  }

  // 3. Child Safety filter locally
  if (userInput) {
    const safety = checkChildSafety(userInput);
    if (!safety.isSafe && safety.response) {
      return {
        message: safety.response.answer,
        emotion: safety.response.emotion,
        source: 'local_rule',
      };
    }

    // 4. Simple Math local resolver (e.g. 5x5, 10+20)
    const mathResult = evaluateSimpleMath(userInput);
    if (mathResult) {
      return {
        message: mathResult.answer,
        emotion: mathResult.emotion,
        source: 'local_math',
      };
    }

    // 5. Quick Language translations (e.g. como se dice gracias en frances)
    const langResult = getQuickTranslation(userInput);
    if (langResult) {
      return {
        message: langResult.answer,
        emotion: langResult.emotion,
        source: 'local_rule',
      };
    }
  }

  // 6. Local chat knowledge for common questions. This keeps the app useful on GitHub Pages
  // even when the optional Gemini backend is not connected.
  if (!actionType || actionType === 'chat') {
    const clean = userInput.toLowerCase().trim();
    const localResponses: Array<{ test: RegExp; message: string; emotion: EmotionType }> = [
      { test: /^(hola|holi|hey|buenas|buenos dias|buenas tardes|buenas noches)\\b/, message: `¡Hola, ${player.nickname}! 🐾 ¿Qué quieres saber hoy?`, emotion: 'saluda' },
      { test: /como estas|cómo estás|como te sientes|cómo te sientes/, message: '¡Estoy muy bien! Me encanta estar contigo y conversar. ❤️', emotion: 'feliz' },
      { test: /quien eres|quién eres|que eres|qué eres/, message: `¡Soy ${pet.name}, tu mascota ${species.displayName}! Estoy aquí para conversar contigo. 🐾`, emotion: 'feliz' },
      { test: /que puedes hacer|qué puedes hacer|que sabes hacer|qué sabes hacer/, message: 'Puedo contarte chistes, curiosidades, ayudarte con cuentas y aprender contigo.', emotion: 'curioso' },
      { test: /te gusta|cual es tu favorito|cuál es tu favorito/, message: `Me gustan las cosas divertidas y pasar tiempo contigo. ¡Pregúntame algo más!`, emotion: 'feliz' },
      { test: /ayuda|como funciona|cómo funciona/, message: 'Escríbeme una pregunta, una cuenta o pulsa Chiste y Curiosidad para empezar.', emotion: 'curioso' },
    ];
    const localMatch = localResponses.find((item) => item.test.test(clean));
    if (localMatch) return { message: localMatch.message, emotion: localMatch.emotion, source: 'local_rule' };
  }

  // 6. Check Pet Tiredness / Low Energy
  if (pet.energy <= 10) {
    return {
      message: personality.sampleResponses.tired || 'Uff... ya no tengo energía 😴 Dame una siestita o comidita.',
      emotion: 'durmiendo',
      source: 'local_care',
    };
  }

  // 7. Check Daily AI Message Limit
  const dailyCount = getDailyAiMessageCount(player.id);
  if (dailyCount >= DAILY_AI_MESSAGE_LIMIT) {
    return {
      message: 'En este momento estoy ocupado, por favor inténtalo más tarde.',
      emotion: 'durmiendo',
      source: 'local_rule',
    };
  }

  // Determine query text for automatic buttons if empty
  let finalQuery = userInput;
  if (actionType === 'learn' && !finalQuery) {
    finalQuery = 'Enséñame algo corto y fácil de aprender hoy.';
  } else if (actionType === 'game' && !finalQuery) {
    finalQuery = 'Propónme un juego corto que podamos hacer juntos.';
  }

  // 8. Call Gemini Backend with full context & action type (with 10-second timeout)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        petType: species.displayName,
        petName: pet.name,
        personality: pet.personality,
        message: finalQuery,
        actionType: actionType || 'chat',
        playerName: player.nickname,
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    incrementDailyAiMessageCount(player.id);

    return {
      message: data.message || personality.sampleResponses.unknown,
      emotion: (data.emotion as EmotionType) || 'feliz',
      source: 'gemini',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('AI API call failed or timed out, falling back locally', err);

    return {
      message: `Mmm... todavía no puedo consultar esa pregunta 😅. Prueba con una cuenta, un saludo o pregúntame qué puedo hacer.`,
      emotion: 'curioso',
      source: 'local_rule',
    };
  }
}
