import React, { useEffect, useRef } from 'react';
import { EmotionType, PetModel } from '../types/pet';
import { EMOTIONS_MAP, normalizeEmotion, getSpriteCellRect } from '../pets/emotions';
import { getPetSpecies } from '../pets/petConfig';

interface SpriteSheetRendererProps {
  pet?: PetModel;
  speciesKey?: string;
  spriteUrl?: string;
  emotion?: EmotionType;
  isAnimating?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const SpriteSheetRenderer: React.FC<SpriteSheetRendererProps> = ({
  pet,
  speciesKey,
  spriteUrl: customUrl,
  emotion = 'feliz',
  isAnimating = false,
  size = 'lg',
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const normalized = normalizeEmotion(emotion);
  const coord = EMOTIONS_MAP[normalized] || EMOTIONS_MAP.feliz;
  const effectiveSpeciesKey = pet?.type || speciesKey || 'fox';
  const species = getPetSpecies(effectiveSpeciesKey);

  // Size dimensions
  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-14 h-14',
    md: 'w-32 h-32',
    lg: 'w-48 h-48 sm:w-56 sm:h-56',
    xl: 'w-60 h-60 sm:w-68 sm:h-68',
  };

  const spriteUrl =
    customUrl || pet?.customSpriteUrl || species.spriteSheet || `/sprites/${effectiveSpeciesKey}.png`;

  const drawCell = (img: HTMLImageElement, index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    if (!naturalW || !naturalH) return;

    // Mathematical 3x3 slicing (3 columns x 3 rows)
    const rect = getSpriteCellRect(index, naturalW, naturalH);

    const pixelRatio = window.devicePixelRatio || 2;
    canvas.width = 240 * pixelRatio;
    canvas.height = 240 * pixelRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

  // Load and draw image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = spriteUrl;

    img.onload = () => {
      imageRef.current = img;
      drawCell(img, coord.index);
    };
  }, [spriteUrl]);

  // Redraw on emotion change
  useEffect(() => {
    if (imageRef.current) {
      drawCell(imageRef.current, coord.index);
    }
  }, [coord.index]);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none cursor-pointer transition-transform duration-300 ${sizeMap[size]} ${className}`}
    >
      <div className={`w-full h-full flex items-center justify-center ${isAnimating ? 'animate-pet-jump' : 'animate-pet-breathe'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain drop-shadow-xl"
        />
      </div>
    </div>
  );
};
