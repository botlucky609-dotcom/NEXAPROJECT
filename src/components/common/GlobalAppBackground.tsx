import React from 'react';
import { BackgroundConfig } from '../../types/settings';

interface GlobalAppBackgroundProps {
  config: BackgroundConfig;
}

export const GlobalAppBackground: React.FC<GlobalAppBackgroundProps> = ({ config }) => {
  const isImageMode = config.mode === 'wallpaper' || config.mode === 'custom';

  if (!isImageMode) {
    // Solid color or CSS Gradient mode
    const isGradient = config.mode === 'gradient' || config.value.includes('gradient');
    const backgroundStyle = isGradient 
      ? { background: config.value } 
      : { backgroundColor: config.value };

    return (
      <div 
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-50 transition-all duration-700 ease-in-out"
        style={backgroundStyle}
      />
    );
  }

  // Image mode (Built-in shipyard wallpaper or custom user upload)
  return (
    <div 
      aria-hidden="true" 
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden"
    >
      {/* Background Image with optional blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out scale-105"
        style={{
          backgroundImage: `url('${config.value}')`,
          filter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : 'none',
        }}
      />

      {/* Dark high-contrast translucent overlay for optimal text & form legibility */}
      <div 
        className="absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          backgroundColor: '#020617',
          opacity: Math.max(0.3, Math.min(0.95, config.overlayOpacity)),
        }}
      />

      {/* Subtle blueprint vignette gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"
      />
    </div>
  );
};
