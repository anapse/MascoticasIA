import React from 'react';

export type QuickActionKey = 'joke' | 'fact' | 'ask' | 'learn' | 'game' | 'feed' | 'sleep';

interface QuickActionsProps {
  onAction: (action: QuickActionKey) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, disabled = false }) => {
  const actions = [
    { key: 'joke' as const, label: 'Chiste', emoji: '😂', bg: 'bg-amber-100/90 text-amber-900 hover:bg-amber-200 border-amber-300' },
    { key: 'fact' as const, label: 'Curiosidad', emoji: '💡', bg: 'bg-sky-100/90 text-sky-900 hover:bg-sky-200 border-sky-300' },
    { key: 'ask' as const, label: 'Preguntar', emoji: '🧠', bg: 'bg-purple-100/90 text-purple-900 hover:bg-purple-200 border-purple-300' },
    { key: 'learn' as const, label: 'Aprende', emoji: '📚', bg: 'bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200 border-emerald-300' },
    { key: 'game' as const, label: 'Jugar', emoji: '🎮', bg: 'bg-indigo-100/90 text-indigo-900 hover:bg-indigo-200 border-indigo-300' },
    { key: 'feed' as const, label: 'Dar comida', emoji: '🍖', bg: 'bg-rose-100/90 text-rose-900 hover:bg-rose-200 border-rose-300' },
    { key: 'sleep' as const, label: 'Dormir', emoji: '😴', bg: 'bg-blue-100/90 text-blue-900 hover:bg-blue-200 border-blue-300' },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2 min-w-max px-1">
        {actions.map((act) => (
          <button
            key={act.key}
            type="button"
            disabled={disabled}
            onClick={() => onAction(act.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-['Fredoka'] font-semibold text-sm border shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${act.bg}`}
          >
            <span className="text-base leading-none">{act.emoji}</span>
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
