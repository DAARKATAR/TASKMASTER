import React, { useState, useRef } from 'react';
import { Wifi } from 'lucide-react';

export default function BankCard3D({ tenant, accountData }) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [foilPos, setFoilPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    setRotate({ x: rotateX, y: rotateY });
    setFoilPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setFoilPos({ x: 50, y: 50 });
  };

  const brandColor = tenant?.brand_color || '#6366F1';
  const titular = accountData?.titular || 'Elena Rostova';
  const saldo = accountData?.saldo ? Number(accountData.saldo).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '2,458,900.00';
  const accountId = accountData?.id || '1001';

  return (
    <div className="perspective-1000 w-full flex justify-center py-4">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full max-w-md h-60 rounded-2xl p-6 overflow-hidden cursor-pointer shadow-card-3d border border-white/20 select-none group"
      >
        {/* Fondo con Degradado Metálico Reactivo */}
        <div 
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: `linear-gradient(135deg, ${brandColor}dd 0%, #0F1524 60%, #080C14 100%)`
          }}
        />

        {/* Reflejo Foil Holográfico dinámico */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${foilPos.x}% ${foilPos.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 45%, transparent 70%)`
          }}
        />

        {/* Textura geométrica sutil */}
        <div className="absolute inset-0 opacity-10 bg-grid-pattern pointer-events-none" />

        {/* Contenido de la Tarjeta */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Top Row: Marca & Contactless */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-white text-lg tracking-wider drop-shadow-md">
                {(tenant?.nombre || 'ENTERPRISE').toUpperCase()}
              </span>
            </div>
            <div className="text-white/80">
              <Wifi className="w-5 h-5 rotate-90 stroke-[2.5]" />
            </div>
          </div>

          {/* Middle Row: Chip EMV & Tier */}
          <div className="flex items-center justify-between my-auto">
            {/* EMV Gold Smart Chip */}
            <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-1 border border-amber-300 shadow-md relative overflow-hidden">
              <div className="w-full h-full border border-amber-700/40 rounded flex flex-col justify-between">
                <div className="w-full h-[1px] bg-amber-700/30 my-auto" />
                <div className="w-[1px] h-full bg-amber-700/30 mx-auto absolute inset-0" />
              </div>
            </div>

            <span className="text-[10px] font-bold font-mono tracking-widest text-white/60 bg-black/30 px-2 py-0.5 rounded border border-white/10">
              BLACK METAL EDITION
            </span>
          </div>

          {/* Account Number */}
          <div className="font-mono text-lg font-semibold tracking-[0.25em] text-white text-shadow drop-shadow">
            4829 •••• •••• {accountId}
          </div>

          {/* Bottom Row: Holder & Expiry & Network */}
          <div className="flex items-end justify-between pt-1 border-t border-white/10">
            <div>
              <span className="block text-[9px] font-bold text-white/50 tracking-wider">TITULAR</span>
              <span className="font-display font-bold text-sm text-white tracking-wide drop-shadow truncate max-w-[200px] block">
                {titular}
              </span>
            </div>

            <div>
              <span className="block text-[9px] font-bold text-white/50 tracking-wider">VAL THRU</span>
              <span className="font-mono text-xs font-semibold text-white">09/29</span>
            </div>

            {/* Red Dual Circle Logo */}
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-red-500/80 backdrop-blur-sm shadow-sm" />
              <div className="w-6 h-6 rounded-full bg-amber-400/80 backdrop-blur-sm shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
