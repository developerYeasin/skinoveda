/**
 * Line-art icon set.
 *
 * The reference design uses fine gold line icons rather than emoji, which is
 * what gives it its premium feel. Every icon here is a single stroked path on a
 * 24x24 grid so they all read as one family.
 */

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const Svg = ({ size, children, ...rest }) => (
  <svg {...base} {...rest} width={size || base.width} height={size || base.height}>
    {children}
  </svg>
);

/* ---------- speciality / quick access ---------- */

export const IconLaser = (p) => (
  <Svg {...p}>
    <path d="M12 2v3M5.6 4.6l2.1 2.1M18.4 4.6l-2.1 2.1" />
    <path d="M12 8a4 4 0 0 1 4 4v1H8v-1a4 4 0 0 1 4-4Z" />
    <path d="M7 16h10M9 19h6" />
  </Svg>
);

export const IconLotus = (p) => (
  <Svg {...p}>
    <path d="M12 4c1.7 2.6 2.4 4.5 2.4 6.1 0 1.6-.9 2.9-2.4 3.8-1.5-.9-2.4-2.2-2.4-3.8C9.6 8.5 10.3 6.6 12 4Z" />
    <path d="M5 9c2.6.7 4.3 1.7 5.2 3 .9 1.3.9 2.6.4 4-1.7-.3-3.2-1-4.1-2.3C5.6 12.4 5 10.9 5 9Z" />
    <path d="M19 9c0 1.9-.6 3.4-1.5 4.7-.9 1.3-2.4 2-4.1 2.3-.5-1.4-.5-2.7.4-4 .9-1.3 2.6-2.3 5.2-3Z" />
    <path d="M4 18c2.3 1.4 5 2 8 2s5.7-.6 8-2" />
  </Svg>
);

export const IconLeaf = (p) => (
  <Svg {...p}>
    <path d="M4 20c0-8 4.5-13 15-13 0 9-4.5 13-11 13H4Z" />
    <path d="M8 17c1.8-4 4.4-6.6 8-8" />
  </Svg>
);

export const IconStethoscope = (p) => (
  <Svg {...p}>
    <path d="M6 3v5a4 4 0 0 0 8 0V3" />
    <path d="M6 3H4.5M14 3h1.5" />
    <path d="M10 12v2a5 5 0 0 0 5 5h.5" />
    <circle cx="18" cy="17" r="2.4" />
  </Svg>
);

export const IconSkinScan = (p) => (
  <Svg {...p}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" />
    <circle cx="12" cy="12" r="3.6" />
    <path d="M10.6 11.3h.01M13.4 11.3h.01M10.8 14c.8.6 1.6.6 2.4 0" />
  </Svg>
);

export const IconGift = (p) => (
  <Svg {...p}>
    <path d="M3 11h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9Z" />
    <path d="M2.5 7.5h19V11h-19zM12 7.5V21" />
    <path d="M12 7.5S10.8 4 8.8 4a2 2 0 0 0 0 3.5H12ZM12 7.5S13.2 4 15.2 4a2 2 0 0 1 0 3.5H12Z" />
  </Svg>
);

/* ---------- why / values ---------- */

export const IconSprout = (p) => (
  <Svg {...p}>
    <path d="M12 21v-8" />
    <path d="M12 13C12 9.7 9.8 7.5 6 7.5c0 3.3 2.2 5.5 6 5.5Z" />
    <path d="M12 13c0-3 2-5 5.5-5 0 3-2 5-5.5 5Z" />
    <path d="M7 21h10" />
  </Svg>
);

export const IconSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
  </Svg>
);

export const IconHeart = (p) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" />
  </Svg>
);

export const IconBalance = (p) => (
  <Svg {...p}>
    <path d="M12 4v16M5 8h14" />
    <path d="M5 8l-2.5 5a2.8 2.8 0 0 0 5 0L5 8ZM19 8l-2.5 5a2.8 2.8 0 0 0 5 0L19 8Z" />
    <path d="M8 20h8" />
  </Svg>
);

/* ---------- trust bar ---------- */

export const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 2.7v5.5c0 4.3-2.9 7.6-7 9.8-4.1-2.2-7-5.5-7-9.8V5.7L12 3Z" />
    <path d="M9.2 12.1l2 2 3.6-3.9" />
  </Svg>
);

export const IconCard = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <path d="M2.5 10h19M6 14.5h3.5" />
  </Svg>
);

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7v5.2l3.2 2" />
  </Svg>
);

export const IconSupport = (p) => (
  <Svg {...p}>
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <path d="M4 13.5h1.8a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4.8A.8.8 0 0 1 4 18.2v-4.7ZM20 13.5h-1.8a1 1 0 0 0-1 1V18a1 1 0 0 0 1 1h1a.8.8 0 0 0 .8-.8v-4.7Z" />
    <path d="M18 19v.5a2 2 0 0 1-2 2h-2.5" />
  </Svg>
);

/* ---------- small meta icons ---------- */

export const IconCap = (p) => (
  <Svg {...p}>
    <path d="M12 5.5 21 9.5l-9 4-9-4 9-4Z" />
    <path d="M6.5 11.5V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.5" />
    <path d="M21 9.5v4" />
  </Svg>
);

export const IconStar = (p) => (
  <Svg {...p}>
    <path d="M12 4.5l2.3 4.8 5.2.7-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 10l5.2-.7L12 4.5Z" />
  </Svg>
);

/* ---------- header ---------- */

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
);

export const IconPhone = (p) => (
  <Svg {...p}>
    <path d="M7 3.5 9.2 8 7.4 9.9a12 12 0 0 0 5 5L14.3 13l4.5 2.2v3.1a2 2 0 0 1-2.2 2C9.6 19.6 4.7 14.7 4.1 7.4A2 2 0 0 1 6.1 5.2h.6Z" />
  </Svg>
);

export const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
  </Svg>
);

export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6" />
  </Svg>
);

export const IconArrow = (p) => (
  <Svg {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
);

/* Named lookup so data tables can reference an icon by string. */
export const ICONS = {
  laser: IconLaser,
  lotus: IconLotus,
  leaf: IconLeaf,
  stethoscope: IconStethoscope,
  skinScan: IconSkinScan,
  gift: IconGift,
  sprout: IconSprout,
  sparkle: IconSparkle,
  heart: IconHeart,
  balance: IconBalance,
  shield: IconShield,
  card: IconCard,
  clock: IconClock,
  support: IconSupport,
  cap: IconCap,
  star: IconStar,
  search: IconSearch,
  phone: IconPhone,
  calendar: IconCalendar,
  user: IconUser,
  arrow: IconArrow,
};

export function Icon({ name, size = 24, ...rest }) {
  const Cmp = ICONS[name];
  return Cmp ? <Cmp size={size} {...rest} /> : null;
}
