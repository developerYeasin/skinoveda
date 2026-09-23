/**
 * Decorative art layer.
 *
 * The reference design is photography-led. Until the real clinic photos are
 * uploaded through the admin panel, every image slot falls back to a styled
 * purple/gold art panel so the composition still reads correctly.
 */
import { assetUrl } from '../api/client';

/** Purple blossom motif used in the corners of the hero and banners. */
export function Blossom({ style, size = 180, opacity = 0.5 }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ position: 'absolute', opacity, pointerEvents: 'none', ...style }} aria-hidden>
      <defs>
        <radialGradient id="pet" cx="50%" cy="20%">
          <stop offset="0%" stopColor="#E9C8F5" />
          <stop offset="60%" stopColor="#B478CE" />
          <stop offset="100%" stopColor="#7B3A96" />
        </radialGradient>
      </defs>
      <g fill="url(#pet)">
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="100" cy="58" rx="26" ry="44" transform={`rotate(${r} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="13" fill="#EFD9A3" />
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
    return <img src={assetUrl(src)} alt={alt} className={className} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} loading="lazy" />;
  }

  return (
    <div className={`photo-art ${className}`} style={{ background: tones[tone], ...style }} aria-label={alt} role="img">
      <span className="photo-art__glow" />
      <span className="photo-art__icon">{icon}</span>
      {children}
    </div>
  );
}
