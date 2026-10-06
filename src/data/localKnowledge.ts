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



// Extra kid-safe themed jokes: pets, food, movies, cartoons and games.
export const EXTRA_KID_JOKES: string[] = [
  '¿Qué hace un perro con un celular? ¡Guau-sapea! 🐶📱',
  '¿Qué hace un gato frente a la computadora? ¡Busca el ratón! 🐱🖱️',
  '¿Por qué el perro llevó una linterna? ¡Porque quería encontrar su hueso! 🐶🔦',
  '¿Qué mascota sabe contar chistes? ¡El loro, porque siempre repite los mejores! 🦜😂',
  '¿Qué le dijo el pez a la pecera? ¡Gracias por dejarme entrar! 🐟',
  '¿Qué hace una tortuga con una mochila? ¡Lleva su casa de viaje! 🐢🎒',
  '¿Por qué el conejo llegó temprano? ¡Porque no quería perder el salto! 🐰',
  '¿Qué hace un hámster en una rueda? ¡Entrena para las olimpiadas! 🐹🏅',
  '¿Cuál es la comida favorita de un fantasma? ¡Espagueti transparente! 👻🍝',
  '¿Qué le dijo la pizza al queso? ¡Tú haces que todo sea más divertido! 🍕🧀',
  '¿Por qué el plátano fue al doctor? ¡Porque no se sentía muy maduro! 🍌😂',
  '¿Qué hace una papa en una fiesta? ¡Se pone a bailar hecha puré! 🥔💃',
  '¿Cuál es el postre más musical? ¡El flan con su flan-ción! 🍮🎵',
  '¿Qué le dijo la hamburguesa al pan? ¡Contigo hago un buen equipo! 🍔',
  '¿Por qué el helado no cuenta secretos? ¡Porque se derrite de nervios! 🍦',
  '¿Qué hace una zanahoria en una película? ¡Actúa en primera fila! 🥕🎬',
  '¿Qué hace un superhéroe cuando tiene hambre? ¡Busca una súper merienda! 🦸🍎',
  '¿Qué le dijo el cine a la película? ¡Pasa, que ya tengo tus palomitas listas! 🎬🍿',
  '¿Por qué la película llevó paraguas? ¡Porque tenía muchas escenas de lluvia! 🎬☔',
  '¿Qué hace un director cuando tiene sueño? ¡Corta la escena y se va a dormir! 🎥😴',
  '¿Qué personaje de dibujos nunca llega tarde? ¡El que vive dentro del reloj! ⏰😂',
  '¿Por qué un dibujo animado fue a la escuela? ¡Para aprender a colorear sus ideas! 🖍️',
  '¿Qué hace un personaje cuando pierde su lápiz? ¡Busca una nueva aventura! ✏️📺',
  '¿Qué le dijo el héroe al villano después de la merienda? ¡Nos vemos en la próxima aventura! 🦸🍪',
  '¿Por qué Mickey llevó una maleta? ¡Porque se iba de vacaciones con sus amigos! 🐭🧳',
  '¿Qué hace Bob Esponja cuando tiene hambre? ¡Busca algo rico bajo el mar! 🍔🌊',
  '¿Qué hace un dragón en la cocina? ¡Prepara una sopa bien calentita! 🐉🍲',
  '¿Qué hace un panda en una película de acción? ¡Se defiende con su abrazo secreto! 🐼🎬',
  '¿Por qué un robot pidió una pizza? ¡Porque tenía hambre de batería... digo, de queso! 🤖🍕',
  '¿Qué hace un mono en el cine? ¡Se ríe antes de que empiece la película! 🐒🍿',
  '¿Qué hace un pingüino en una fiesta? ¡Baila con mucho hielo! 🐧🕺',
  '¿Qué hace un koala en el cine? ¡Busca una película para ver entre siestas! 🐨😴',
  '¿Qué hace una ardilla con una palomita? ¡La guarda para después! 🐿️🍿',
  '¿Qué hace un zorro cuando ve una película de misterio? ¡Dice que ya sabía quién era! 🦊🕵️',
  '¿Qué hace una mascota cuando termina una película? ¡Pide otra función! 🐾🎬',
  '¿Qué comida siempre está lista para una aventura? ¡La galleta exploradora! 🍪🗺️',
  '¿Qué le dijo el jugo a la naranja? ¡Exprésate! 🍊😂',
  '¿Qué hace una cuchara en una película? ¡Siempre aparece en los créditos de la sopa! 🥄🎬',
  '¿Qué hace el arroz cuando cuenta un chiste? ¡Se parte de risa! 🍚😂',
  '¿Por qué la galleta fue al cine? ¡Quería ver una película crujiente! 🍪🍿',
];

// Extra kid-safe themed curiosities. These are short educational facts or thematic facts.
export const EXTRA_KID_FACTS: string[] = [
  'Los perros tienen un olfato muchísimo más sensible que el nuestro. 🐶👃',
  'Los gatos usan sus bigotes para orientarse y detectar espacios. 🐱',
  'Los conejos pueden mover cada oreja de forma independiente. 🐰👂',
  'Las tortugas tienen un caparazón que forma parte de su esqueleto. 🐢',
  'Los pingüinos son aves, aunque no vuelan y son excelentes nadadores. 🐧🌊',
  'Los koalas tienen huellas dactilares que pueden parecerse a las humanas. 🐨',
  'Las ardillas ayudan a los bosques al esconder semillas que a veces olvidan. 🐿️🌳',
  'Los peces usan sus branquias para obtener oxígeno del agua. 🐟',
  'Los pandas tienen una adaptación especial en sus patas para sujetar bambú. 🐼🎋',
  'Los zorros tienen un oído muy desarrollado y pueden localizar pequeños sonidos. 🦊👂',
  'El chocolate no es un alimento seguro para los perros, aunque a muchas personas les encanta. 🐶🍫',
  'Las zanahorias son crujientes y contienen betacaroteno, que el cuerpo puede convertir en vitamina A. 🥕',
  'Las palomitas de maíz se hacen cuando el agua dentro del grano se convierte en vapor. 🍿',
  'El yogur se produce gracias a bacterias que transforman la leche durante la fermentación. 🥛',
  'La miel la producen las abejas a partir del néctar de las flores. 🍯🐝',
  'El pan puede crecer porque la levadura produce gas durante la fermentación. 🍞',
  'Las fresas son conocidas por tener sus pequeñas semillas en la parte exterior. 🍓',
  'La piña está formada por muchos pequeños frutos que se unen. 🍍',
  'El queso puede elaborarse a partir de leche de vaca, cabra u oveja. 🧀',
  'El cine combina imágenes mostradas rápidamente para crear la sensación de movimiento. 🎬',
  'Las películas de animación pueden crearse dibujando o generando muchas imágenes consecutivas. 🎞️',
  'Los efectos de sonido ayudan a que una película haga sentir al público dentro de la historia. 🔊🎬',
  'Un storyboard sirve para planear visualmente las escenas antes de producir una película. 🎬✏️',
  'Los personajes de dibujos animados pueden ser animales, personas, robots o criaturas imaginarias. 🐾📺',
  'Mickey Mouse apareció por primera vez en 1928 y se convirtió en uno de los personajes animados más reconocibles. 🐭🎬',
  'Bob Esponja vive en una piña bajo el mar dentro de su mundo de ficción. 🧽🌊',
  'Los dragones aparecen en mitos y cuentos de muchas culturas, aunque no existen como animales reales. 🐉📚',
  'Los superhéroes de ficción suelen tener poderes o habilidades especiales para contar historias emocionantes. 🦸',
  'Una banda sonora puede ayudar a crear emoción, suspense o alegría durante una película. 🎵🎬',
  'Los videojuegos y las películas pueden contar historias usando personajes, escenarios y aventuras. 🎮🎬',
  'Las estrellas parecen pequeñas desde la Tierra porque están extremadamente lejos. ⭐🌌',
  'La Luna no produce su propia luz: vemos la luz del Sol reflejada en ella. 🌙☀️',
  'Los arcoíris aparecen cuando la luz interactúa con gotas de agua y se separa en diferentes colores. 🌈',
  'Las abejas visitan flores para obtener néctar y polen. 🐝🌸',
  'Los árboles producen oxígeno durante la fotosíntesis. 🌳',
  'Los pulpos tienen tres corazones. 🐙❤️',
  'Los delfines son mamíferos, no peces. 🐬',
  'Los murciélagos son los únicos mamíferos capaces de realizar un vuelo verdadero. 🦇',
  'Algunas ranas pueden respirar parcialmente a través de su piel. 🐸',
  'Las mariposas prueban sustancias usando receptores ubicados en sus patas. 🦋',
];


// Large local idle-conversation bank. Used without Gemini so the pet can feel alive while the user is away.
export const EXTRA_SPONTANEOUS_PHRASES: Record<string, string[]> = {
  molesto: [
    '¿Sigues ahí? Yo sí... esperando. 😒', 'Estoy pensando en algo... pero no te lo voy a contar todavía. 😏',
    '¿Sabes qué? Una merienda estaría bastante bien.', 'Aquí estoy. No es que te extrañe ni nada... 😒❤️',
    '¿Cuánto tiempo piensas dejarme mirando al techo?', 'Tengo ganas de hacer algo divertido.',
    'Te voy a dar exactamente cinco segundos para decirme hola. 😤', 'Bueno... hoy estás muy callado.',
    'Creo que merezco un poquito de atención.', '¿Un chiste? ¿Una curiosidad? ¿O vas a seguir ignorándome? 😒',
    'He decidido que necesito una aventura.', '¿Por qué nadie me pregunta cómo estoy?',
    'Estoy aburrido... y eso es culpa tuya. 😤', 'Podría bailar, pero primero necesito público.',
    '¿Me escuchas? Porque tengo cosas importantes que decir.', 'Voy a fingir que no estoy esperando tu respuesta. 😑',
    '¡Oye! Se me ocurrió algo genial.', '¿Ya regresaste? Bien. No hagamos esperar a la diversión.'
  ],
  lenta: [
    'Estoy aquí tranquilito... podemos hablar cuando quieras. 🐢', 'Qué bonito está todo cuando nadie tiene prisa.',
    'Creo que necesito una pequeña siesta... o una conversación.', 'Me pregunto qué habrá para aprender hoy.',
    '¿Sabías que me gusta escuchar historias?', 'Estoy pensando... despacito... pero pensando. 🤔',
    'Qué silencio tan agradable... aunque una charla estaría mejor.', '¿Quieres contarme cómo fue tu día?',
    'Voy a quedarme aquí descansando un poquito.', 'Tengo una pregunta: ¿qué animal te gusta más?',
    'Las mejores aventuras también pueden empezar despacio.', '¿Hacemos algo tranquilo?',
    'Estoy de buen humor hoy. 😊', 'Me gusta cuando vienes a visitarme.',
    'Podemos jugar cuando estés listo.', 'Creo que una curiosidad sería perfecta ahora.'
  ],
  picaro: [
    'Pssst... tengo una idea secreta. 😏', '¿Jugamos a descubrir algo?', 'Creo que escuché algo... ¿o fue mi imaginación?',
    'Tengo mis patitas listas para una aventura.', '¿Qué tal si hacemos una pregunta difícil?',
    'Estoy investigando una cosa muy misteriosa... 🕵️', 'Tengo una curiosidad guardada para ti.',
    '¿Quieres un reto rápido?', 'Creo que puedo sorprenderte.', 'Hoy tengo ganas de hacer travesuras... pequeñas, claro. 😜',
    '¿Qué crees que estoy pensando?', 'Tengo una pregunta para ti, pero primero dime hola.',
    '¿Vamos a descubrir algo nuevo?', 'Se me ocurrió un juego que podemos hacer aquí mismo.',
    'Tengo demasiada curiosidad. ¡Cuéntame algo!', '¿Adivinas qué animal me gustaría conocer?'
  ],
  tierno: [
    'Me alegra que estés aquí. ❤️', 'Solo quería decirte que eres un buen amigo.',
    '¿Quieres que nos quedemos charlando un ratito?', 'Me gusta mucho cuando vienes a verme. 🥰',
    'Estoy tranquilito esperando tu próxima pregunta.', 'Te guardé una curiosidad muy bonita.',
    '¿Cómo te sientes hoy?', 'Si estás aburrido, podemos inventar algo juntos.',
    'Aquí tienes una sonrisita. 😊', 'Me gusta pasar tiempo contigo.',
    '¿Quieres que te cuente algo divertido?', 'Creo que hoy será un buen día.',
    'No hace falta correr. Podemos hablar con calma.', 'Tengo ganas de jugar contigo.',
    '¿Quieres un abrazo virtual? 🤗', 'Gracias por venir a visitarme otra vez.'
  ],
  curioso: [
    'Me pregunto qué habrá más allá de las estrellas... ⭐', 'Tengo una pregunta: ¿cuál es tu animal favorito?',
    '¿Sabías que siempre hay algo nuevo que aprender?', 'Estoy pensando en una curiosidad interesante.',
    '¿Qué crees que pesa más: una nube o un elefante?', 'Tengo ganas de descubrir algo nuevo.',
    '¿Por qué algunas mascotas duermen tanto? 🤔', 'Se me ocurrió una pregunta divertida.',
    '¿Quieres jugar a las adivinanzas?', 'Hoy quiero aprender algo contigo.',
    'Tengo una teoría... pero necesito tu opinión.', '¿Qué película te gusta más?',
    '¿Qué comida nunca te cansarías de comer?', 'Creo que deberíamos investigar algo interesante.',
    'Mi cabeza está llena de preguntas. 😵‍💫', '¿Quieres que te cuente un dato sorprendente?'
  ],
  dormilon: [
    'Zzz... ah, hola. Creí que estabas dormido. 💤', 'Estoy despierto... más o menos. 😴',
    'Una siestita sería una excelente idea.', '¿Podemos hablar bajito?', 'Creo que mi almohada me está llamando.',
    'Tengo sueño, pero también quiero compañía. ❤️', 'Cinco minutitos más... zzz...',
    '¿Existe una película para ver mientras uno duerme?', 'Estoy intentando mantener los ojos abiertos.',
    'Creo que soñé con una montaña de comida.', 'Si no contesto, probablemente me quedé dormido. 😴',
    '¿Me cuentas algo tranquilo?', 'Hoy mi energía está en modo tortuguita.',
    'Una manta y una charla suenan perfectas.', 'Zzz... ¿dijiste algo?', 'Creo que necesito recargar mis pilitas.'
  ],
  default: [
    '¿Sigues por aquí? 🐾', 'Se me ocurrió algo que quería contarte.', '¿Qué hacemos ahora?',
    'Tengo ganas de conversar contigo.', '¿Quieres aprender algo nuevo?', 'Creo que podemos divertirnos un rato.',
    '¿Cómo va tu día?', 'Estoy aquí esperando una aventura.', '¿Chiste, curiosidad o charla?',
    'Me pregunto qué estás haciendo.', 'Tengo una pregunta para ti.', '¿Jugamos un ratito?',
    'Hoy tengo ganas de descubrir algo nuevo.', '¿Quieres que te cuente algo?', 'No te vayas muy lejos. 🐾',
    'Me alegra que sigas aquí.'
  ]
};
