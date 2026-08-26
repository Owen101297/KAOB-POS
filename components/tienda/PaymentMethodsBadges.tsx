import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SVGs OFICIALES Y MINIMALISTAS DE MÉTODOS DE PAGO Y FINANCIACIÓN (COLOMBIA)
// ─────────────────────────────────────────────────────────────────────────────

export function AddiLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Addi">
      {/* Fondo / Estilo de marca Addi con acento verde menta */}
      <rect width="120" height="40" rx="6" fill="#00D775" />
      <path
        d="M26.5 28L31.2 12H35.8L40.5 28H36.3L35.2 24H31.8L30.7 28H26.5ZM32.6 20.8H34.4L33.5 16.9L32.6 20.8ZM43.5 28V12H49.2C51.5 12 53.2 12.6 54.4 13.8C55.6 15 56.2 16.6 56.2 18.6V21.4C56.2 23.4 55.6 25 54.4 26.2C53.2 27.4 51.5 28 49.2 28H43.5ZM47.4 24.6H49.2C50.2 24.6 51 24.2 51.5 23.6C52.1 22.9 52.3 22 52.3 20.8V19.2C52.3 18 52.1 17.1 51.5 16.4C51 15.8 50.2 15.4 49.2 15.4H47.4V24.6ZM59.5 28V12H65.2C67.5 12 69.2 12.6 70.4 13.8C71.6 15 72.2 16.6 72.2 18.6V21.4C72.2 23.4 71.6 25 70.4 26.2C69.2 27.4 67.5 28 65.2 28H59.5ZM63.4 24.6H65.2C66.2 24.6 67 24.2 67.5 23.6C68.1 22.9 68.3 22 68.3 20.8V19.2C68.3 18 68.1 17.1 67.5 16.4C67 15.8 66.2 15.4 65.2 15.4H63.4V24.6ZM76.5 28V12H80.5V28H76.5Z"
        fill="#0A0A0A"
      />
    </svg>
  );
}

export function SistecreditoLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Sistecrédito">
      <rect width="140" height="40" rx="6" fill="#0047BA" />
      <text
        x="70"
        y="25"
        textAnchor="middle"
        fontFamily="'Montserrat', 'Inter', sans-serif"
        fontWeight="800"
        fontSize="16"
        letterSpacing="0.5"
        fill="#FFFFFF"
      >
        sistecrédito
      </text>
    </svg>
  );
}

export function NequiLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Nequi">
      <rect width="100" height="40" rx="6" fill="#1F0338" />
      <rect x="14" y="10" width="10" height="20" rx="2" fill="#FF287A" />
      <text
        x="60"
        y="26"
        textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontWeight="800"
        fontSize="17"
        letterSpacing="-0.5"
        fill="#FFFFFF"
      >
        nequi
      </text>
    </svg>
  );
}

export function BancolombiaLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Bancolombia">
      <rect width="130" height="40" rx="6" fill="#000000" />
      {/* Símbolo dinámico Bancolombia */}
      <path d="M18 14C23 11 27 12 30 15L27 17C25 15 22 14 19 16L18 14Z" fill="#FDDA24" />
      <path d="M16 20C16 16 19 13 23 13L24 15C21 15 18 17 18 20L16 20Z" fill="#00C389" />
      <path d="M18 25C22 28 27 27 30 24L32 26C28 30 22 31 17 27L18 25Z" fill="#FF4F00" />
      <text
        x="78"
        y="25"
        textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="#FFFFFF"
      >
        Bancolombia
      </text>
    </svg>
  );
}

export function PlanSepareLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 135 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Plan Separe KΛOB">
      <rect width="135" height="40" rx="6" fill="#18181B" stroke="#27272A" />
      <circle cx="20" cy="20" r="10" fill="#09090B" stroke="#D4D4D8" strokeWidth="1.5" />
      <text x="20" y="24" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="10" fill="#FFFFFF">
        KA
      </text>
      <text
        x="77"
        y="24"
        textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontWeight="700"
        fontSize="12"
        letterSpacing="0.8"
        fill="#FAFAFA"
      >
        PLAN SEPARE
      </text>
    </svg>
  );
}

export function CardBrandsLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Tarjetas Visa y Mastercard">
      <rect width="110" height="40" rx="6" fill="#18181B" />
      {/* Visa */}
      <text x="30" y="26" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="900" fontStyle="italic" fontSize="15" fill="#1A73E8">
        VISA
      </text>
      {/* Mastercard Circles */}
      <circle cx="75" cy="20" r="9" fill="#EB001B" />
      <circle cx="87" cy="20" r="9" fill="#F79E1B" fillOpacity="0.85" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIRA MINIMALISTA PARA TARJETA DE PRODUCTO (ProductCardTienda)
// ─────────────────────────────────────────────────────────────────────────────
export function ProductCardPaymentBadges({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity ${className}`}>
      <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Paga con:</span>
      <div className="flex items-center gap-1">
        <AddiLogo className="h-3.5 sm:h-4 w-auto rounded shadow-xs" />
        <SistecreditoLogo className="h-3.5 sm:h-4 w-auto rounded shadow-xs" />
        <NequiLogo className="h-3.5 sm:h-4 w-auto rounded shadow-xs" />
        <PlanSepareLogo className="h-3.5 sm:h-4 w-auto rounded shadow-xs" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FRANJA COMPLETA DE CONFIANZA Y MEDIOS DE PAGO (Footer y Trust Section)
// ─────────────────────────────────────────────────────────────────────────────
export function AllPaymentTrustStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}>
      <AddiLogo className="h-6 w-auto shadow-xs transition-transform hover:scale-105" />
      <SistecreditoLogo className="h-6 w-auto shadow-xs transition-transform hover:scale-105" />
      <NequiLogo className="h-6 w-auto shadow-xs transition-transform hover:scale-105" />
      <BancolombiaLogo className="h-6 w-auto shadow-xs transition-transform hover:scale-105" />
      <CardBrandsLogo className="h-6 w-auto shadow-xs transition-transform hover:scale-105" />
      <PlanSepareLogo className="h-6 w-auto shadow-xs transition-transform hover:scale-105" />
    </div>
  );
}
