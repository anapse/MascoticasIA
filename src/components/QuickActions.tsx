import React, { useState, useRef, useEffect } from 'react';

export type QuickActionKey = 'joke' | 'fact' | 'feed' | 'sleep' | 'dance';

interface QuickActionsProps {
  onAction: (action: QuickActionKey) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, disabled = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleActionClick = (action: QuickActionKey) => {
    setIsDropdownOpen(false);
    onAction(action);
  };

  const btnClass =
    "px-3 py-1.5 rounded-xl font-['Fredoka'] font-medium text-xs bg-white/80 hover:bg-white text-slate-800 border border-amber-900/10 shadow-2xs transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center gap-1";

  return (
    <div className="w-full flex items-center justify-center gap-2 py-0.5 relative z-30">
      {/* 1. Chiste */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction('joke')}
        className={btnClass}
      >
        Chiste
      </button>

      {/* 2. Curiosidad */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction('fact')}
        className={btnClass}
      >
        Curiosidad
      </button>

      {/* 3. Desplegable: Acciones ▾ (Comer, Dormir, Bailar) */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`${btnClass} ${isDropdownOpen ? 'bg-amber-100/90 text-amber-950 font-semibold' : ''}`}
        >
          <span>Acciones</span>
          <span className="text-[10px] transition-transform duration-200">
            {isDropdownOpen ? '▴' : '▾'}
          </span>
        </button>

        {isDropdownOpen && (
          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 w-32 bg-white/95 backdrop-blur-md rounded-2xl p-1.5 border border-amber-900/10 shadow-lg flex flex-col gap-1 animate-scale-up z-50">
            <button
              type="button"
              onClick={() => handleActionClick('feed')}
              className="w-full px-2.5 py-1.5 rounded-xl text-left font-['Fredoka'] text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-950 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>🍖</span>
              <span>Comer</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('sleep')}
              className="w-full px-2.5 py-1.5 rounded-xl text-left font-['Fredoka'] text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-950 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>😴</span>
              <span>Dormir</span>
            </button>

            <button
              type="button"
              onClick={() => handleActionClick('dance')}
              className="w-full px-2.5 py-1.5 rounded-xl text-left font-['Fredoka'] text-xs font-medium text-slate-700 hover:bg-amber-50 hover:text-amber-950 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>💃</span>
              <span>Bailar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
