import React from 'react';

export const PetBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <img
        src="/sprites/fondo.png"
        alt="Fondo Mascoticas"
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
};
