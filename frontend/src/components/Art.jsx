/**
 * Decorative art layer.
 *
 * The reference design is photography-led with soft purple blossoms drifting
 * over the edges. Until the real clinic photos are uploaded through the admin
 * panel, every image slot falls back to a styled purple/gold art panel so the
 * composition still reads correctly.
 */
import { useId } from 'react';
import { assetUrl } from '../api/client';

/**
 * Soft purple blossom.
 *
 * Built from layered petals with radial shading and a blurred edge so it reads
 * as a photographed flower catching the light, rather than flat clip art.
 */
export function Blossom({ style, className = '', size = 180, opacity = 0.5, hue = 0 }) {
  const id = useId().replace(/:/g, '');
  const petals = [0, 51, 103, 154, 206, 257, 309];

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={{ position: 'absolute', opacity, pointerEvents: 'none', filter: `hue-rotate(${hue}deg)`, ...style }}
      aria-hidden
    >
      <defs>
        {/* petal shading: bright at the tip, deep purple at the base */}
        <radialGradient id={`p${id}`} cx="50%" cy="14%" r="86%">
          <stop offset="0%" stopColor="#F3DDFA" />
          <stop offset="34%" stopColor="#D3A6E6" />
          <stop offset="70%" stopColor="#9B55BC" />
          <stop offset="100%" stopColor="#5E1E77" />
        </radialGradient>
        {/* the back row sits in shadow */}
        <radialGradient id={`b${id}`} cx="50%" cy="18%" r="84%">
          <stop offset="0%" stopColor="#C89BD8" />
          <stop offset="55%" stopColor="#7E3A9C" />
          <stop offset="100%" stopColor="#400F55" />
        </radialGradient>
        <radialGradient id={`c${id}`} cx="42%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#F7E7BE" />
          <stop offset="55%" stopColor="#D9AE62" />
          <stop offset="100%" stopColor="#9A6F2C" />
        </radialGradient>
        <filter id={`s${id}`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      <g filter={`url(#s${id})`}>
        {/* back row, rotated off the front row so petals interleave */}
        <g opacity="0.85">
          {petals.map((r) => (
            <path
              key={`b${r}`}
              d="M100 96 C 84 76, 80 50, 90 30 C 95 20, 105 20, 110 30 C 120 50, 116 76, 100 96 Z"
              fill={`url(#b${id})`}
              transform={`rotate(${r + 26} 100 100)`}
            />
          ))}
        </g>

        {/* front row */}
        {petals.map((r) => (
          <path
            key={`f${r}`}
            d="M100 100 C 82 78, 77 48, 88 24 C 94 12, 106 12, 112 24 C 123 48, 118 78, 100 100 Z"
            fill={`url(#p${id})`}
            transform={`rotate(${r} 100 100)`}
          />
        ))}

        {/* centre */}
        <circle cx="100" cy="100" r="15" fill={`url(#c${id})`} />
        <circle cx="96" cy="95" r="4.5" fill="#FBEFD2" opacity=".7" />
      </g>
    </svg>
  );
}

/** Small lotus used as a section ornament. */
export function Lotus({ size = 34, color = '#E0BC72' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill={color} aria-hidden>
      <path d="M32 8c4 7 6 12 6 16s-2 8-6 10c-4-2-6-6-6-10s2-9 6-16z" />
      <path d="M14 22c7 2 12 5 14 8s2 7 1 11c-5-1-9-3-11-6s-4-8-4-13z" />
      <path d="M50 22c0 5-2 10-4 13s-6 5-11 6c-1-4-1-8 1-11s7-6 14-8z" />
    </svg>
  );
}

/**
 * An image slot. Renders the uploaded photo when there is one, otherwise a
 * styled art panel with the given icon so the layout never collapses.
 */
export function Photo({ src, alt = '', icon = '🪷', className = '', style, tone = 'purple', children }) {
  const tones = {
    purple: 'linear-gradient(150deg, #4A1259 0%, #7B2D8E 55%, #26082F 100%)',
    soft: 'linear-gradient(150deg, #F3E6F8 0%, #E5CCEE 60%, #D6B4E4 100%)',
    dark: 'linear-gradient(150deg, #26082F 0%, #3A0F47 60%, #5C1A6E 100%)',
  };

  if (src) {
    return (
      <img
        src={assetUrl(src)}
        alt={alt}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`photo-art ${className}`} style={{ background: tones[tone], ...style }} aria-label={alt} role="img">
      <span className="photo-art__glow" />
      <span className="photo-art__icon">{icon}</span>
      {children}
    </div>
  );
}
