import React, { useEffect, useRef } from 'react';
import { EmotionType, PetModel } from '../types/pet';
import { EMOTIONS_MAP, normalizeEmotion, getSpriteCellRect } from '../pets/emotions';
import { getPetSpecies } from '../pets/petConfig';

export type PetAnimationType =
  | 'breathe'
  | 'jump'
  | 'eat'
  | 'sleep'
  | 'laugh'
  | 'dance'
  | 'curious'
  | 'talk';

interface SpriteSheetRendererProps {
  pet?: PetModel;
  speciesKey?: string;
  emotion?: EmotionType;
  animationType?: PetAnimationType;
  isAnimating?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  onClick?: () => void;
}

/**
 * Renders only the real supplied 3x3 sprite sheet.
 * No generated/vector fallback and no custom sprite override.
 */
export const SpriteSheetRenderer: React.FC<SpriteSheetRendererProps> = ({
  pet,
  speciesKey,
  emotion = 'feliz',
  animationType,
  isAnimating = false,
  size = 'hero',
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const normalized = normalizeEmotion(emotion);
  const coord = EMOTIONS_MAP[normalized] || EMOTIONS_MAP.feliz;
  const effectiveSpeciesKey = pet?.type || speciesKey || 'fox';
  const species = getPetSpecies(effectiveSpeciesKey);
  const spriteUrl = species.spriteSheet;

  const getAnimationClass = () => {
    if (animationType === 'dance') return 'animate-pet-dance';
    if (animationType === 'eat' || normalized === 'comiendo') return 'animate-pet-eat';
    if (animationType === 'sleep' || normalized === 'durmiendo') return 'animate-pet-sleep';
    if (animationType === 'laugh' || normalized === 'risa') return 'animate-pet-laugh';
    if (animationType === 'curious' || normalized === 'curioso') return 'animate-pet-curious';
    if (animationType === 'talk') return 'animate-pet-talk';
    if (animationType === 'jump' || isAnimating) return 'animate-pet-jump';
    return 'animate-pet-breathe';
  };

  const sizeMap = {
    xs: 'w-7 h-7 sm:w-8 sm:h-8',
    sm: 'w-14 h-14 sm:w-16 sm:h-16',
    md: 'w-28 h-28',
    lg: 'w-56 h-56 sm:w-64 sm:h-64',
    xl: 'w-64 h-64 sm:w-72 sm:h-72',
    hero: 'w-[min(68vw,280px)] h-[min(68vw,280px)] sm:w-72 sm:h-72',
  };

  const drawCell = (img: HTMLImageElement, index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return;

    const rect = getSpriteCellRect(index, width, height);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = 320 * pixelRatio;
    canvas.height = 320 * pixelRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scale = Math.min(canvas.width / rect.width, canvas.height / rect.height);
    const drawWidth = rect.width * scale;
    const drawHeight = rect.height * scale;
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    ctx.drawImage(
      img,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );
  };

  useEffect(() => {
    const img = new Image();
    let cancelled = false;

    const onReady = () => {
      if (cancelled) return;
      imageRef.current = img;
      drawCell(img, coord.index);
    };

    img.onload = onReady;
    img.onerror = () => {
      if (!cancelled) console.error('No se pudo cargar el sprite real:', spriteUrl);
    };
    img.src = spriteUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [spriteUrl]);

  useEffect(() => {
    const img = imageRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      drawCell(img, coord.index);
    }
  }, [coord.index]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none cursor-pointer transition-transform duration-300 ${sizeMap[size]} ${className}`}
    >
      <div className={`w-full h-full flex items-center justify-center ${getAnimationClass()}`}>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="w-full h-full object-contain drop-shadow-xl"
        />
      </div>
    </div>
  );
};
