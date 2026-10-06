import React, { useState, useEffect, useRef } from 'react';
import { EmotionType, PetModel } from '../types/pet';
import { EMOTIONS_MAP, normalizeEmotion, getSpriteCellRect } from '../pets/emotions';
import { getPetSpecies } from '../pets/petConfig';

interface SpriteSheetRendererProps {
  pet: PetModel;
  emotion: EmotionType;
  isTalking?: boolean;
  isEating?: boolean;
  isSleeping?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const SpriteSheetRenderer: React.FC<SpriteSheetRendererProps> = ({
  pet,
  emotion = 'feliz',
  isTalking = false,
  isEating = false,
  isSleeping = false,
  size = 'lg',
  className = '',
  onClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const normalized = normalizeEmotion(emotion);
  const coord = EMOTIONS_MAP[normalized] || EMOTIONS_MAP.feliz;
  const species = getPetSpecies(pet.type);

  // Size dimensions
  const sizeMap = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-52 h-52 sm:w-60 sm:h-60',
    xl: 'w-64 h-64 sm:w-72 sm:h-72',
  };

  // Sprite URL priority: custom URL -> species default config spriteSheet
  const spriteUrl = pet.customSpriteUrl || species.spriteSheet || `/sprites/${pet.type}.png`;

  // Mathematical 3x3 Canvas Drawing
  useEffect(() => {
    setImageError(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = spriteUrl;

    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      drawCell(img, coord.index);
    };

    img.onerror = () => {
      setImageLoaded(false);
      setImageError(true);
    };
  }, [spriteUrl]);

  // Redraw when emotion changes
  useEffect(() => {
    if (imageRef.current && imageLoaded) {
      drawCell(imageRef.current, coord.index);
    }
  }, [coord.index, imageLoaded]);

  const drawCell = (img: HTMLImageElement, index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;

    // Mathematical 3x3 cell calculation
    const rect = getSpriteCellRect(index, naturalW, naturalH);

    // High DPI crispness
    const pixelRatio = window.devicePixelRatio || 2;
    canvas.width = 240 * pixelRatio;
    canvas.height = 240 * pixelRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw exact 3x3 mathematical slice
    ctx.drawImage(
      img,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  // Animation classes
  let animationClass = 'animate-pet-breathe';
  if (isSleeping || normalized === 'durmiendo') {
    animationClass = 'animate-pet-sleep';
  } else if (isEating || normalized === 'comiendo') {
    animationClass = 'animate-pet-eat';
  } else if (isTalking) {
    animationClass = 'animate-pet-talk';
  } else if (normalized === 'risa') {
    animationClass = 'animate-pet-laugh';
  } else if (normalized === 'sorpresa') {
    animationClass = 'animate-pet-jump';
  } else if (normalized === 'curioso') {
    animationClass = 'animate-pet-curious';
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none cursor-pointer transition-transform duration-300 ${sizeMap[size]} ${className}`}
    >
      {/* Visual FX Particles */}
      {normalized === 'durmiendo' && (
        <div className="absolute -top-3 right-2 flex flex-col items-center pointer-events-none z-20">
          <span className="text-xl font-bold text-sky-400 animate-bounce delay-100">Z</span>
          <span className="text-lg font-bold text-sky-300 animate-bounce delay-300 -mt-1 ml-3">z</span>
          <span className="text-base font-bold text-sky-200 animate-bounce delay-500 -mt-1 ml-5">z</span>
        </div>
      )}

      {normalized === 'risa' && (
        <div className="absolute -top-2 -right-2 text-2xl animate-spin text-amber-400 pointer-events-none z-20">
          ✨
        </div>
      )}

      {normalized === 'sorpresa' && (
        <div className="absolute -top-3 text-2xl font-black text-amber-500 animate-pulse pointer-events-none z-20">
          ❗
        </div>
      )}

      {normalized === 'curioso' && (
        <div className="absolute -top-3 right-4 text-2xl font-black text-indigo-500 animate-bounce pointer-events-none z-20">
          ❓
        </div>
      )}

      {normalized === 'comiendo' && (
        <div className="absolute -bottom-2 right-2 text-2xl animate-bounce pointer-events-none z-20">
          {species.foodEmoji}
        </div>
      )}

      {/* Main Pet Canvas / Vector Sprite */}
      <div className={`w-full h-full relative flex items-center justify-center ${animationClass}`}>
        {/* Mathematical HTML5 Canvas Slicer */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain drop-shadow-xl ${
            imageLoaded && !imageError ? 'block' : 'hidden'
          }`}
        />

        {/* Fallback Vector Art when Sprite Image is loading or absent */}
        {(!imageLoaded || imageError) && (
          <ChibiVectorPet
            species={pet.type}
            emotion={normalized}
            name={pet.name}
            color={species.themeColor.primary}
            accent={species.themeColor.accent}
          />
        )}
      </div>
    </div>
  );
};

interface ChibiVectorPetProps {
  species: string;
  emotion: EmotionType;
  name: string;
  color: string;
  accent: string;
}

const ChibiVectorPet: React.FC<ChibiVectorPetProps> = ({
  species,
  emotion,
  color,
  accent,
}) => {
  const renderEyes = () => {
    switch (emotion) {
      case 'durmiendo':
        return (
          <g stroke="#334155" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M 38 52 Q 48 60 58 52" />
            <path d="M 72 52 Q 82 60 92 52" />
          </g>
        );
      case 'risa':
        return (
          <g stroke="#334155" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M 38 54 Q 48 44 58 54" />
            <path d="M 72 54 Q 82 44 92 54" />
          </g>
        );
      case 'molesto':
        return (
          <g>
            <circle cx="48" cy="52" r="7" fill="#1e293b" />
            <circle cx="82" cy="52" r="7" fill="#1e293b" />
            <path d="M 36 43 L 56 48" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 94 43 L 74 48" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        );
      case 'sorpresa':
        return (
          <g>
            <circle cx="48" cy="50" r="10" fill="#1e293b" />
            <circle cx="82" cy="50" r="10" fill="#1e293b" />
            <circle cx="46" cy="47" r="3.5" fill="#ffffff" />
            <circle cx="80" cy="47" r="3.5" fill="#ffffff" />
          </g>
        );
      case 'curioso':
        return (
          <g>
            <circle cx="48" cy="50" r="9" fill="#1e293b" />
            <circle cx="82" cy="48" r="7" fill="#1e293b" />
            <circle cx="46" cy="47" r="3" fill="#ffffff" />
            <circle cx="80" cy="46" r="2.5" fill="#ffffff" />
            <path d="M 74 38 Q 82 34 90 38" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        );
      default: // feliz, saluda, comiendo, pensando
        return (
          <g>
            <circle cx="48" cy="50" r="8" fill="#1e293b" />
            <circle cx="82" cy="50" r="8" fill="#1e293b" />
            <circle cx="46" cy="47" r="2.8" fill="#ffffff" />
            <circle cx="80" cy="47" r="2.8" fill="#ffffff" />
            <circle cx="50" cy="52" r="1.2" fill="#ffffff" />
            <circle cx="84" cy="52" r="1.2" fill="#ffffff" />
          </g>
        );
    }
  };

  const renderMouth = () => {
    switch (emotion) {
      case 'risa':
        return <path d="M 52 62 Q 65 78 78 62 Z" fill="#e11d48" stroke="#334155" strokeWidth="2" />;
      case 'sorpresa':
        return <ellipse cx="65" cy="65" rx="5" ry="8" fill="#e11d48" stroke="#334155" strokeWidth="2" />;
      case 'molesto':
        return <path d="M 55 67 Q 65 60 75 67" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'comiendo':
        return (
          <g>
            <path d="M 55 64 Q 65 72 75 64" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="65" cy="64" r="3" fill="#e11d48" />
          </g>
        );
      case 'pensando':
        return <path d="M 58 65 Q 65 67 72 63" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />;
      default:
        return <path d="M 55 62 Q 65 73 75 62" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round" />;
    }
  };

  const renderEars = () => {
    if (species === 'fox') {
      return (
        <g>
          <polygon points="26,40 12,8 48,22" fill={color} stroke="#334155" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="28,34 18,16 42,24" fill={accent} />
          <polygon points="104,40 118,8 82,22" fill={color} stroke="#334155" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="102,34 112,16 88,24" fill={accent} />
        </g>
      );
    }
    if (species === 'rabbit') {
      return (
        <g>
          <ellipse cx="38" cy="18" rx="9" ry="24" transform="rotate(-10 38 18)" fill={color} stroke="#334155" strokeWidth="2.5" />
          <ellipse cx="38" cy="18" rx="4.5" ry="16" transform="rotate(-10 38 18)" fill="#fbcfe8" />
          <ellipse cx="92" cy="18" rx="9" ry="24" transform="rotate(10 92 18)" fill={color} stroke="#334155" strokeWidth="2.5" />
          <ellipse cx="92" cy="18" rx="4.5" ry="16" transform="rotate(10 92 18)" fill="#fbcfe8" />
        </g>
      );
    }
    if (species === 'panda' || species === 'koala') {
      return (
        <g>
          <circle cx="28" cy="30" r="14" fill={species === 'panda' ? '#1e293b' : color} stroke="#334155" strokeWidth="2" />
          <circle cx="28" cy="30" r="8" fill={accent} />
          <circle cx="102" cy="30" r="14" fill={species === 'panda' ? '#1e293b' : color} stroke="#334155" strokeWidth="2" />
          <circle cx="102" cy="30" r="8" fill={accent} />
        </g>
      );
    }
    if (species === 'turtle') {
      return null;
    }
    return (
      <g>
        <circle cx="32" cy="32" r="11" fill={color} stroke="#334155" strokeWidth="2" />
        <circle cx="32" cy="32" r="6" fill={accent} />
        <circle cx="98" cy="32" r="11" fill={color} stroke="#334155" strokeWidth="2" />
        <circle cx="98" cy="32" r="6" fill={accent} />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 130 130" className="w-full h-full drop-shadow-xl overflow-visible">
      {renderEars()}

      {species === 'fox' && (
        <path d="M 95 85 Q 128 75 120 50 Q 105 55 95 72 Z" fill={color} stroke="#334155" strokeWidth="2.5" />
      )}
      {species === 'turtle' && (
        <ellipse cx="65" cy="78" rx="42" ry="32" fill="#15803d" stroke="#14532d" strokeWidth="3" />
      )}
      {species === 'fish' && (
        <path d="M 10 65 Q 2 40 24 60 Q 2 85 10 65 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2.5" />
      )}

      {/* Head */}
      <circle cx="65" cy="58" r="40" fill={color} stroke="#334155" strokeWidth="3" />
      <ellipse cx="65" cy="66" rx="26" ry="20" fill={accent} />
      <circle cx="34" cy="58" r="6" fill="#fb7185" opacity="0.6" />
      <circle cx="96" cy="58" r="6" fill="#fb7185" opacity="0.6" />
      <polygon points="65,58 61,54 69,54" fill="#1e293b" />

      {renderEyes()}
      {renderMouth()}

      {emotion === 'saluda' && (
        <g className="animate-bounce">
          <ellipse cx="106" cy="45" rx="9" ry="8" transform="rotate(25 106 45)" fill={accent} stroke="#334155" strokeWidth="2" />
          <circle cx="106" cy="45" r="3" fill="#f472b6" />
        </g>
      )}

      {emotion === 'pensando' && (
        <g>
          <ellipse cx="78" cy="76" rx="7" ry="6" fill={accent} stroke="#334155" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};
