import React from 'react';

export const PetBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      <img
        src="/fondo.png"
        alt="Fondo Mascoticas"
        className="w-full h-full object-cover object-center"
      />
      {/* Soft translucent layer so pet and chat remain crystal clear */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
    </div>
  );
};
