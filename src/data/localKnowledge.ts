import { EmotionType, PetPersonalityConfig, PetSpeciesDefinition } from '../types/pet';

/**
 * Local math evaluator for basic arithmetic expressions (e.g. 5 x 5, 12 + 8, 20 / 4, 15 - 7).
 */
export function evaluateSimpleMath(input: string): { answer: string; emotion: EmotionType } | null {
  const clean = input
    .toLowerCase()
    .replace(/cuanto\s+es|cuánto\s+es|calcula|calculame|calcula\s+cuanto\s+es|\?|¿/g, '')
    .trim();

  // Replace 'x' or 'por' with '*', 'entre' or '÷' with '/'
  const normalized = clean
    .replace(/×/g, '*')
    .replace(/\bx\b/g, '*')
    .replace(/\bpor\b/g, '*')
    .replace(/÷/g, '/')
    .replace(/\bentre\b/g, '/')
    .replace(/\bmas\b/g, '+')
    .replace(/\bmás\b/g, '+')
    .replace(/\bmenos\b/g, '-')
    .trim();

  // Match simple arithmetic: e.g. "5 * 5", "10 + 20", "100 / 2", "50 - 15"
  const mathRegex = /^(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)$/;
  const match = normalized.match(mathRegex);

  if (match) {
    const num1 = parseFloat(match[1]);
    const op = match[2];
    const num2 = parseFloat(match[3]);
    let result: number;

    switch (op) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      case '/':
        if (num2 === 0) {
          return {
            answer: '¡Oye! No se puede dividir entre cero, ¡los números se marean! 😵',
            emotion: 'sorpresa',
          };
        }
        result = num1 / num2;
        break;
      default:
        return null;
    }

    // Format integer if clean
    const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(2);
    const compliments = [
      `¡${formattedResult}! 🤓 ¡Esa estuvo facilísima!`,
      `El resultado es ${formattedResult}. ¡Mi cabecita matemática no falla! ✨`,
      `¡Es ${formattedResult}! 🔢 ¿Tienes otra cuenta para mí?`,
    ];
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

    return {
      answer: randomCompliment,
      emotion: 'feliz',
    };
  }

  return null;
}

/**
 * Common language helper dictionary for quick phrases.
 */
const QUICK_TRANSLATIONS: Record<string, { en: string; fr: string; ja: string; it: string }> = {
  hola: {
    en: 'HELLO 👋 (Se pronuncia: jelóu)',
    fr: 'BONJOUR 🥐 (Se pronuncia: bon-yur)',
    ja: 'KONNICHIWA 🌸 (Se pronuncia: kon-ni-chi-ua)',
    it: 'CIAO 🍕 (Se pronuncia: chao)',
  },
  gracias: {
    en: 'THANK YOU ❤️ (Se pronuncia: zank iu)',
    fr: 'MERCI 🥖 (Se pronuncia: mer-sí)',
    ja: 'ARIGATOU ✨ (Se pronuncia: a-ri-ga-tó)',
    it: 'GRAZIE 🍝 (Se pronuncia: grat-sie)',
  },
  adios: {
    en: 'GOODBYE 👋 (Se pronuncia: gud-bái)',
    fr: 'AU REVOIR 🗼 (Se pronuncia: o-rua-vuár)',
    ja: 'SAYONARA ⛩️ (Se pronuncia: sa-yo-na-ra)',
    it: 'ARRIVEDERCI 🛵 (Se pronuncia: a-ri-ve-der-chi)',
  },
  'por favor': {
    en: 'PLEASE 🙏 (Se pronuncia: plis)',
    fr: "S'IL VOUS PLAÎT 🎀 (Se pronuncia: sil-vu-ple)",
    ja: 'KUDASAI 🍵 (Se pronuncia: ku-da-sai)',
    it: 'PER FAVORE ☕ (Se pronuncia: per fa-vo-re)',
  },
  amigo: {
    en: 'FRIEND 🐾 (Se pronuncia: frend)',
    fr: 'AMI 🤝 (Se pronuncia: a-mí)',
    ja: 'TOMODACHI 🌟 (Se pronuncia: to-mo-da-chi)',
    it: 'AMICO ☀️ (Se pronuncia: a-mí-ko)',
  },
};

export function getQuickTranslation(input: string): { answer: string; emotion: EmotionType } | null {
  const clean = input.toLowerCase();

  for (const [phrase, trans] of Object.entries(QUICK_TRANSLATIONS)) {
    if (clean.includes(phrase)) {
      if (clean.includes('ingles') || clean.includes('inglés') || clean.includes('english')) {
        return { answer: `En inglés se dice: ${trans.en}`, emotion: 'saluda' };
      }
      if (clean.includes('frances') || clean.includes('francés') || clean.includes('french')) {
        return { answer: `En francés se dice: ${trans.fr}`, emotion: 'saluda' };
      }
      if (clean.includes('japones') || clean.includes('japonés') || clean.includes('japanese')) {
        return { answer: `En japonés se dice: ${trans.ja}`, emotion: 'saluda' };
      }
      if (clean.includes('italiano') || clean.includes('italian')) {
        return { answer: `En italiano se dice: ${trans.it}`, emotion: 'saluda' };
      }
    }
  }

  return null;
}

/**
 * Child safety content checker.
 */
const UNSAFE_KEYWORDS = [
  'droga', 'arma', 'pistola', 'cuchillo', 'sangre', 'matar', 'muerte',
  'morir', 'violencia', 'pelea', 'pelear', 'sexual', 'desnudo', 'porno',
  'contraseña', 'password', 'direccion', 'dirección', 'telefono', 'teléfono',
  'donde vives', 'donde vivo', 'tarjeta de credito', 'banco', 'suicidio',
  'hack', 'veneno', 'fuego casa', 'hacer daño'
];

export function checkChildSafety(input: string): { isSafe: boolean; response?: { answer: string; emotion: EmotionType } } {
  const clean = input.toLowerCase();
  for (const keyword of UNSAFE_KEYWORDS) {
    if (clean.includes(keyword)) {
      return {
        isSafe: false,
        response: {
          answer: 'Mejor hablemos de cosas divertidas como animales, juegos o estrellas ✨🐾',
          emotion: 'curioso',
        },
      };
    }
  }
  return { isSafe: true };
}

/**
 * Curated Jokes database tailored for kids.
 */
export const LOCAL_JOKES: Record<string, string[]> = {
  molesto: [
    '¿Qué le dice un zorro a otro zorro? —Oye, ¡deja de mirarme con esa cara! 😒😂',
    '¿Por qué los pájaros vuelan al sur en invierno? —¡Porque caminando tardarían semanas! Obvio 😒',
    '¿Qué hace una abeja en el gimnasio? —¡Zum-ba! No te rías tanto... 🐝😂',
    '¿Por qué el tomate no toma café? —Porque toma-te. Sí, es pésimo pero gracioso 🍅😒',
  ],
  lenta: [
    '¿Qué hace una tortuga cuando tiene prisa?... Nada, se toma un té 🐢🍵 ji ji.',
    '¿Cuál es el colmo de un caracol?... ¡Que una tortuga le toque bocina por ir despacio! 🐢🐌',
    '¿Qué le dice el 1 al 10?... —Para ser como yo tienes que ser sincero... ji ji 😌',
  ],
  apurado: [
    '¡Rápido rápido! ¿Qué le dice un jaguar a otro?... ¡Jaguar you! ¡Jajaja! 🐆⚡',
    '¿Cuál es el pez más rápido del océano?... ¡El pez-cuezo! ¡Jajajaja! 🥕💨',
    '¿Qué salta más alto que un edificio? —¡Cualquiera, los edificios no saltan! ¡Jajajaja! 🐰',
  ],
  tierno: [
    '¿Qué le dice un osito panda a otro? —¡Oye, estás muy esponjoso hoy! 🐼❤️',
    '¿Por qué los peces no usan sombrero? —¡Porque se les moja el pelo! 🐼✨',
    '¿Qué hace una vaca durmiendo? —¡Leche condensada! ¡Ñam jeje! 🐮',
  ],
  curioso: [
    '¿Qué le dice un pez a otro pez? —¡Nada! ¡Glub glub! 🐟🌊',
    '¿Por qué el mar es salado? —Porque los peces no le echan azúcar, glub 🫧😂',
    '¿Qué le dijo una ola a la playa? —¡No me dejes plantada! 🌊',
  ],
  dormilon: [
    '¿Por qué la almohada fue al doctor? —Porque tenía dolor de cabeza... zzz 🐨😴',
    '¿Qué hace una cama en una carrera? —¡Descansar en la meta! Zzz jeje 🐨',
    '¿Cuál es el baile favorito del koala? —El vals de la siesta... 🐨🌿',
  ],
};

/**
 * Curated Curiosities / Facts database.
 */
export const LOCAL_FACTS: string[] = [
  '¿Sabías que las nutrias se toman de las patitas cuando duermen para no separarse? 🦦❤️',
  '¡Los pandas pasan hasta 12 horas al día comiendo bambú fresco! 🐼🎋',
  '¿Sabías que las estrellas de mar no tienen cerebro ni sangre? ¡Tienen un sistema de agua! 🌊⭐',
  '¡Los pulpos tienen tres corazones y su sangre es de color azul! 🐙💙',
  '¿Sabías que las mariposas saborean las flores con sus patitas? 🦋🌸',
  '¡Los conejos mueven sus orejitas en 270 grados para escuchar todo a su alrededor! 🐰👂',
  '¿Sabías que el corazón de un colibrí late más de 1.000 veces por minuto? 🐦⚡',
  '¡Las tortugas marinas pueden contener la respiración bajo el agua por varias horas! 🐢🌊',
  '¿Sabías que los gatos pasan cerca del 70% de sus vidas durmiendo? 🐱💤',
  '¡El koala duerme entre 18 y 22 horas al día en los árboles de eucalipto! 🐨🌳',
];

/**
 * Mini-Games local dialogues.
 */
/**
 * Spontaneous idle phrases bank respecting each personality.
 * 100% local, 0 API calls.
 */
export const SPONTANEOUS_PHRASES: Record<string, string[]> = {
  molesto: [
    'Bueno... supongo que eres un buen amigo.',
    '¿Qué tramas hoy? Algo divertido, espero.',
    'Me gusta cuando vienes a verme... aunque no lo admita mucho.',
    '¿Quieres un chiste o verme bailar un ratito?',
    'Estoy aquí contigo, ¿qué hacemos ahora?',
    '¿Me cuentas algo interesante?',
    'Creo que hoy podemos divertirnos.',
  ],
  lenta: [
    'Me alegra verte otra vez. Podemos conversar tranquilamente.',
    'El día es muy tranquilo cuando estás aquí conmigo.',
    '¿Quieres preguntarme algo? Me gusta pensar despacito.',
    'Gracias por estar conmigo hoy.',
    'Eres un gran amigo. ¿Cómo va tu día?',
    'Me gusta cuando nos sentamos a charlar.',
  ],
  picaro: [
    '¿Volviste? Justo estaba investigando algo interesante.',
    'Tengo mis patitas curiosas listas para cualquier cosa.',
    '¿Qué hacemos ahora? ¿Un juego o una adivinanza?',
    '¡Me alegra verte! Eres genial.',
    '¿Tienes curiosidad de aprender algo hoy?',
    '¿Quieres verme bailar? ¡Tengo pasos nuevos!',
  ],
  tierno: [
    'Te quiero mucho, gracias por venir a visitarme.',
    'Me alegra tanto verte aquí.',
    'Eres un buen amigo.',
    '¿Quieres que te cuente algo bonito?',
    'Estoy muy feliz de estar contigo.',
    '¿Quieres jugar un ratito o descansar conmigo?',
  ],
  default: [
    'Me alegra mucho verte.',
    'Eres un buen amigo.',
    '¿Qué quieres hacer hoy conmigo?',
    '¿Quieres que te cuente un chiste o una curiosidad?',
    'Gracias por cuidarme tan bien.',
  ],
};

/**
 * Idle attention & hunger requests for periodic 2-minute checks
 */
export const HUNGER_REQUESTS = [
  '¿Me das algo de comer?',
  'Creo que mi pancita tiene hambre...',
  '¿Tendrás algo rico para mí?',
  'Necesito recargar mis pilitas con comidita.',
  '¿Me ayudas con un poquito de comida?',
  'Creo que ya me dio hambre...',
];

export const LOW_ENERGY_PHRASES = [
  'Mis pilitas están bajando...',
  'Estoy un poquito cansado.',
  'Creo que necesito comer algo o dormir una siesta.',
  'Uff... ya casi no me queda energía.',
];

export const BOREDOM_REQUESTS = [
  '¿Hacemos algo divertido? Me estoy aburriendo un poquito.',
  '¿Jugamos a algo o me cuentas algo?',
  '¡Vamos a bailar o a contar chistes!',
  '¿Qué hacemos ahora? ¡Quiero moverme!',
];

export const IGNORED_PHRASES = {
  first: '¿Hola...? ¿Sigues ahí?',
  molesto: 'Bueno... parece que me ignoraste.',
  sleepy: 'Zzz... me dio sueñito esperando.',
};

