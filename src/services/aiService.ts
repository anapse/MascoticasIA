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
      message: personality.sampleResponses.eating || `¡Ñam ñam! ¡Qué rico ${species.favoriteFood}! ❤️`,
      emotion: 'comiendo',
      source: 'local_care',
    };
  }

  // 2. Action: Sleeping (Local resolution, NO Gemini call)
  if (actionType === 'care_sleep') {
    return {
      message: personality.sampleResponses.tired || 'Zzz... voy a descansar un ratito... zzz 😴',
      emotion: 'durmiendo',
      source: 'local_care',
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
    let limitMsg = `¡Ya gastamos todos nuestros ${DAILY_AI_MESSAGE_LIMIT} mensajes con IA de hoy! 😵 Necesito descansar.`;
    if (pet.personality === 'molesto') {
      limitMsg = `¡Oye! Ya se acabaron los mensajes de hoy 😒 Deja descansar mis patitas y vuelve mañana.`;
    } else if (pet.personality === 'lenta') {
      limitMsg = `Se terminaron los mensajitos por hoy... vamos a reposar con calma 🐢💤`;
    }
    return {
      message: limitMsg,
      emotion: 'durmiendo',
      source: 'local_rule',
    };
  }

  // Determine query text for automatic buttons if empty
  let finalQuery = userInput;
  if (actionType === 'joke' && !finalQuery) {
    finalQuery = 'Cuéntame un chiste corto y divertido.';
  } else if (actionType === 'fact' && !finalQuery) {
    finalQuery = 'Cuéntame una curiosidad corta e interesante.';
  } else if (actionType === 'learn' && !finalQuery) {
    finalQuery = 'Enséñame algo corto y fácil de aprender hoy.';
  } else if (actionType === 'game' && !finalQuery) {
    finalQuery = 'Propónme un juego corto que podamos hacer juntos.';
  }

  // 8. Call Gemini Backend with full context & action type
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        petType: species.displayName,
        petName: pet.name,
        personality: pet.personality,
        message: finalQuery,
        actionType: actionType || 'chat',
        playerName: player.nickname,
      }),
    });

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
    console.warn('AI API call failed, falling back locally', err);

    // Fallback locally with personality
    if (actionType === 'joke') {
      const list = LOCAL_JOKES[pet.personality] || LOCAL_JOKES['molesto'];
      return {
        message: list[Math.floor(Math.random() * list.length)],
        emotion: 'risa',
        source: 'local_joke',
      };
    }
    if (actionType === 'fact') {
      return {
        message: LOCAL_FACTS[Math.floor(Math.random() * LOCAL_FACTS.length)],
        emotion: 'curioso',
        source: 'local_fact',
      };
    }

    return {
      message: personality.sampleResponses.unknown || 'Mmm... no escuché bien, ¿puedes repetirlo? 🐾',
      emotion: 'curioso',
      source: 'local_rule',
    };
  }
}
