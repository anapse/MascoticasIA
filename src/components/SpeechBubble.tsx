import React from 'react';
import { EmotionType } from '../types/pet';
import { EMOTIONS_MAP, normalizeEmotion } from '../pets/emotions';

interface SpeechBubbleProps {
  petName: string;
  message: string;
  emotion: EmotionType;
  isThinking?: boolean;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  petName,
  message,
  emotion,
  isThinking = false,
}) => {
  const normalized = normalizeEmotion(emotion);
  const emotionInfo = EMOTIONS_MAP[normalized] || EMOTIONS_MAP.feliz;

  return (
    <div className="relative w-full max-w-sm mx-auto px-4 py-3 bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border-2 border-amber-200/80 transition-all duration-300 transform hover:scale-[1.01]">
      {/* Little triangle tail pointing to pet */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-white" />
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-b-[13px] border-b-amber-200/80 -z-10" />

      {/* Header with Pet Name and Emotion Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-amber-100">
        <span className="font-['Fredoka'] font-bold text-amber-900 text-sm tracking-wide flex items-center gap-1.5">
          🐾 {petName}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-800">
          <span>{emotionInfo.emoji}</span>
          <span className="capitalize">{emotionInfo.label}</span>
        </span>
      </div>

      {/* Message Text with Animated Dots if Thinking */}
      <div className="text-slate-800 text-base sm:text-lg font-medium leading-snug break-words">
        {isThinking ? (
          <div className="flex items-center gap-2 text-slate-400 py-1 font-['Fredoka']">
            <span>{petName} está pensando</span>
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
            </span>
          </div>
        ) : (
          <p className="font-['Nunito'] text-slate-800">{message}</p>
        )}
      </div>
    </div>
  );
};
