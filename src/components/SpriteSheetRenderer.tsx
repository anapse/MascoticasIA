import React, { useEffect, useRef } from 'react';
import { EmotionType, PetModel } from '../types/pet';
import { EMOTIONS_MAP, normalizeEmotion, getSpriteCellRect } from '../pets/emotions';
import { getPetSpecies } from '../pets/petConfig';

interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

// Global cache for calculated sprite crops to run image analysis only once per sheet
const CROP_CACHE = new Map<string, CropRect[]>();

function calculateSheetCrops(img: HTMLImageElement): CropRect[] {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return [];

  try {
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, width, height).data;

    const cellW = width / 3;
    const cellH = height / 3;
    const crops: CropRect[] = [];

    for (let index = 0; index < 9; index++) {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const startX = Math.round(col * cellW);
      const endX = Math.round((col + 1) * cellW);
      const startY = Math.round(row * cellH);
      const endY = Math.round((row + 1) * cellH);

      let minX = endX;
      let maxX = startX;
      let minY = endY;
      let maxY = startY;
      let solidPixels = 0;

      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * width + x) * 4;
          if (imgData[idx + 3] > 25) {
            solidPixels++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (solidPixels > 10) {
        const contentW = maxX - minX;
        const contentH = maxY - minY;
        const maxDim = Math.max(contentW, contentH);
        const padding = maxDim * 0.08;
        const squareSize = maxDim + padding * 2;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        let sx = centerX - squareSize / 2;
        let sy = centerY - squareSize / 2;
        let sw = squareSize;
        let sh = squareSize;

        if (sx < 0) sx = 0;
        if (sy < 0) sy = 0;
        if (sx + sw > width) sw = width - sx;
        if (sy + sh > height) sh = height - sy;

        crops.push({ sx, sy, sw, sh });
      } else {
        // Fallback to proportional cell
        const rect = getSpriteCellRect(index, width, height);
        crops.push({ sx: rect.x, sy: rect.y, sw: rect.width, sh: rect.height });
      }
    }
    return crops;
  } catch (err) {
    console.warn('Canvas pixel analysis unavailable, using geometric crop:', err);
    const crops: CropRect[] = [];
    for (let index = 0; index < 9; index++) {
      const rect = getSpriteCellRect(index, width, height);
      crops.push({ sx: rect.x, sy: rect.y, sw: rect.width, sh: rect.height });
    }
    return crops;
  }
}

export type PetAnimationType = 'breathe' | 'jump' | 'eat' | 'sleep' | 'laugh' | 'dance' | 'curious' | 'talk';

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

  // Compute dynamic CSS animation class
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

  // Size dimensions
  const sizeMap = {
    xs: 'w-7 h-7 sm:w-8 sm:h-8',
    sm: 'w-14 h-14 sm:w-16 sm:h-16',
    md: 'w-28 h-28',
    lg: 'w-56 h-56 sm:w-64 sm:h-64',
    xl: 'w-64 h-64 sm:w-72 sm:h-72',
    hero: 'w-[min(68vw,280px)] h-[min(68vw,280px)] sm:w-72 sm:h-72',
  };

  const spriteUrl = species.spriteSheet;

  const drawCell = (img: HTMLImageElement, index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    if (!naturalW || !naturalH) return;

    // Get cached or computed crop
    let crops = CROP_CACHE.get(spriteUrl);
    if (!crops || crops.length !== 9) {
      crops = calculateSheetCrops(img);
      if (crops.length === 9) {
        CROP_CACHE.set(spriteUrl, crops);
      }
    }

    const crop = (crops && crops[index]) || {
      sx: (index % 3) * (naturalW / 3),
      sy: Math.floor(index / 3) * (naturalH / 3),
      sw: naturalW / 3,
      sh: naturalH / 3,
    };

    const pixelRatio = Math.min(window.devicePixelRatio || 2, 3);
    canvas.width = 320 * pixelRatio;
    canvas.height = 320 * pixelRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw preserving aspect ratio and centered
    const scale = Math.min(canvas.width / crop.sw, canvas.height / crop.sh);
    const drawW = crop.sw * scale;
    const drawH = crop.sh * scale;
    const offsetX = (canvas.width - drawW) / 2;
    const offsetY = (canvas.height - drawH) / 2;

    ctx.drawImage(
      img,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      offsetX,
      offsetY,
      drawW,
      drawH
    );
  };

  // Load and draw image
  useEffect(() => {
    const img = new Image();
    img.src = spriteUrl;

    const onReady = () => {
      imageRef.current = img;
      drawCell(img, coord.index);
    };

    if (img.complete && img.naturalWidth > 0) {
      onReady();
    } else {
      img.onload = onReady;
      img.onerror = (e) => {
        console.error('Failed to load sprite sheet:', spriteUrl, e);
      };
    }
  }, [spriteUrl, coord.index]);

  // Redraw on emotion change
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0) {
      drawCell(imageRef.current, coord.index);
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
          className="w-full h-full object-contain drop-shadow-xl"
        />
      </div>
    </div>
  );
};
