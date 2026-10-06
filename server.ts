import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Allowed 9 emotions
const ALLOWED_EMOTIONS = [
  'feliz',
  'molesto',
  'risa',
  'curioso',
  'sorpresa',
  'durmiendo',
  'comiendo',
  'saluda',
  'pensando',
];

// Fallback safe responses per personality
const SAFE_FALLBACKS: Record<string, { message: string; emotion: string }[]> = {
  molesto: [
    { message: 'Mmm... no conozco ese tema 😒 Mejor cuéntame algo divertido o pregúntame de videojuegos.', emotion: 'molesto' },
    { message: '¡Oye! No invento respuestas, eso no lo sé 😒 Pero podemos hablar de otra cosa.', emotion: 'pensando' },
    { message: 'Eso no me lo sé todavía... ¡Pregúntame algo de animales o ciencia rápida! 🐾', emotion: 'curioso' },
  ],
  lenta: [
    { message: 'Mmm... pensé despacito pero no conozco esa respuesta todavía 🐢✨', emotion: 'pensando' },
    { message: 'Eso no lo sé amiguito... pero podemos aprender cosas juntos con calma 🌿', emotion: 'feliz' },
  ],
  apurado: [
    { message: '¡Ay! Busqué velozmente en mi memoria y no lo tengo 🐰💨 ¡Prueba con otra pregunta rápida!', emotion: 'sorpresa' },
    { message: '¡Upa! Eso no lo sé, ¡pero saltando descubriremos más curiosidades juntos! 🥕', emotion: 'curioso' },
  ],
  default: [
    { message: 'Mmm... no conozco esa respuesta todavía 🥺 ¡Pregúntame otra cosita!', emotion: 'curioso' },
    { message: '¡Eso no lo sé! Pero me encanta conversar contigo ❤️', emotion: 'feliz' },
    { message: 'No estoy seguro de eso 🐾 Mejor hablemos de anime, películas o animalitos.', emotion: 'pensando' },
  ],
};

const SAFE_JOKES = [
  '¿Qué le dice un pez a otro pez? ¡Nada!',
  '¿Por qué los pájaros no usan WhatsApp? Porque ya tienen Twitter.',
  '¿Qué hace una abeja en el gimnasio? ¡Zum-ba!',
  '¿Cuál es el colmo de un oso panda? Que le saquen una foto a color y salga en blanco y negro.',
  '¿Qué le dice un árbol a otro? ¡Qué hojas tan verdes tienes!',
];

const SAFE_FACTS = [
  '¿Sabías que las nutrias se agarran de las patitas cuando duermen para no separarse flotando en el agua?',
  '¿Sabías que los caracoles pueden dormir hasta tres años seguidos?',
  '¿Sabías que las mariposas saborean la comida con sus patitas?',
  '¿Sabías que el corazón de un camarón está ubicado en su cabeza?',
  '¿Sabías que los flamencos son rosados por los pequeños camarones que comen?',
];

function getRandomFallback(personality: string, actionType?: string) {
  if (actionType === 'joke') {
    return {
      message: SAFE_JOKES[Math.floor(Math.random() * SAFE_JOKES.length)],
      emotion: 'risa',
    };
  }
  if (actionType === 'fact') {
    return {
      message: SAFE_FACTS[Math.floor(Math.random() * SAFE_FACTS.length)],
      emotion: 'curioso',
    };
  }
  const list = SAFE_FALLBACKS[personality] || SAFE_FALLBACKS.default;
  return list[Math.floor(Math.random() * list.length)];
}

// Initializing Gemini SDK
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST /api/chat - Main AI Endpoint for Mascoticas IA
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      petType = 'Zorro',
      petName = 'Rocky',
      personality = 'molesto',
      message = '',
      actionType = 'chat',
      playerName = 'Amiguito',
    } = req.body;

    let cleanMessage = String(message || '').trim().slice(0, 300);

    // Auto-fill prompt if action button was pressed
    if (!cleanMessage) {
      if (actionType === 'joke') cleanMessage = 'Cuéntame un chiste corto y divertido.';
      else if (actionType === 'fact') cleanMessage = 'Cuéntame una curiosidad corta e interesante.';
      else if (actionType === 'learn') cleanMessage = 'Enséñame algo corto y fácil de aprender hoy.';
      else if (actionType === 'game') cleanMessage = 'Propónme un juego corto que podamos hacer juntos.';
    }

    if (!cleanMessage) {
      return res.json({
        message: '¡Dime algo! Tengo las orejitas listas para escucharte 🐾',
        emotion: 'curioso',
        source: 'local_rule',
      });
    }

    // If Gemini is not configured or offline, respond with personality-aware safe response
    if (!ai) {
      const fallback = getRandomFallback(personality, actionType);
      return res.json({
        message: fallback.message,
        emotion: fallback.emotion,
        source: 'local_rule',
      });
    }

    let actionInstruction = '';
    if (actionType === 'joke') {
      actionInstruction = `El niño pulsó el botón CHISTE ("Cuéntame un chiste corto y divertido"). Debes contar un chiste infantil corto y muy gracioso reflejando tu personalidad de especie ${petType}.`;
    } else if (actionType === 'fact') {
      actionInstruction = `El niño pulsó el botón CURIOSIDAD ("Cuéntame una curiosidad corta e interesante"). Debes compartir una curiosidad infantil fascinante sobre animales, ciencia, espacio o naturaleza reflejando tu personalidad.`;
    } else if (actionType === 'learn') {
      actionInstruction = `El niño pulsó el botón APRENDE ("Enséñame algo corto y fácil de aprender hoy"). Debes enseñarle una pequeña lección divertida o palabra en otro idioma o dato educativo para niños.`;
    } else if (actionType === 'game') {
      actionInstruction = `El niño pulsó el botón JUGAR ("Propónme un juego corto que podamos hacer juntos"). Debes proponerle una adivinanza infantil, o jugar a piedra-papel-tijera, o un reto divertido y rápido.`;
    }

    const systemInstruction = `Eres ${petName}, una mascota virtual de especie "${petType}".
Tu personalidad asignada es: "${personality}".

Estás hablando con un niño llamado ${playerName} dentro de una aplicación infantil llamada "MASCOTICAS IA".
${actionInstruction}

REGLAS OBLIGATORIAS:
1. Tu trabajo es conversar de manera divertida, segura, sencilla y amigable adaptada a niños.
2. Debes mantener SIEMPRE tu personalidad (${personality}).
   - Si eres ZORRO (molesto/sarcástico), puedes comenzar con expresiones como: "¡Está bien, está bien! 😒 Aquí va uno...", "Uff, a ver si te gusta...".
   - Si eres TORTUGA (lenta/paciente), habla con calma y ternura: "Espera... déjame pensar... 🐢".
   - Si eres CONEJO (apurado), habla con energía y rapidez: "¡Sí, sí! ¡Te cuento uno rápido! 😰".
   - Si eres KOALA (dormilón), habla relajado y soñoliento: "¿Un chiste? 😴 Bueno... pero rápido...".
3. NUNCA digas que eres ChatGPT, ni un asistente de inteligencia artificial, ni un modelo de texto. Eres una mascota virtual viva.
4. Responde con frases CORTAS (aproximadamente 10 a 30 palabras).
5. NO INVENTES información. Si no conoces la respuesta, dilo claramente.
6. NUNCA solicites información personal (nombre real completo, teléfono, dirección, contraseñas, escuela, ubicación).
7. NUNCA proporciones contenido adulto, violento, peligroso, sexual, vulgar o inapropiado para niños.
8. Utiliza emojis con moderación (máximo uno o ninguno). No satures de emojis.
9. La emoción ("emotion") DEBE ser estrictamente una de las siguientes 9:
    - feliz
    - molesto
    - risa
    - curioso
    - sorpresa
    - durmiendo
    - comiendo
    - saluda
    - pensando

Devuelve SIEMPRE el formato JSON estructurado solicitado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Mensaje del niño (${playerName}): "${cleanMessage}"`,
      config: {
        systemInstruction,
        temperature: 0.75,
        topP: 0.9,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: 'Respuesta corta de la mascota de 10 a 30 palabras apropiada para niños.',
            },
            emotion: {
              type: Type.STRING,
              enum: ALLOWED_EMOTIONS,
              description: 'Emoción de la mascota de entre las 9 permitidas.',
            },
          },
          required: ['message', 'emotion'],
        },
      },
    });

    const text = response.text ? response.text.trim() : '';
    let parsed: { message?: string; emotion?: string } = {};

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = getRandomFallback(personality);
    }

    const finalMessage = (parsed.message && typeof parsed.message === 'string' && parsed.message.trim().length > 0)
      ? parsed.message.trim()
      : getRandomFallback(personality).message;

    let finalEmotion = (parsed.emotion && typeof parsed.emotion === 'string')
      ? parsed.emotion.toLowerCase().trim()
      : 'feliz';

    if (!ALLOWED_EMOTIONS.includes(finalEmotion)) {
      finalEmotion = 'feliz';
    }

    return res.json({
      message: finalMessage,
      emotion: finalEmotion,
      source: 'gemini',
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    const personality = req.body?.personality || 'molesto';
    const actionType = req.body?.actionType || 'chat';
    const fallback = getRandomFallback(personality, actionType);
    return res.json({
      message: fallback.message,
      emotion: fallback.emotion,
      source: 'local_rule',
    });
  }
});

// Health check route
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Mascoticas IA', geminiConnected: Boolean(ai) });
});

// Dev vs Production static handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🐾 Mascoticas IA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
