/**
 * 图标系统
 * ----------------------------------------------------------
 * 统一的 24×24 viewBox、1.7 描边、round 端点，
 * 全部使用 currentColor 以继承设计系统颜色。
 */
import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export const IconTarget = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <circle cx="12" cy="12" r="3.1" />
    <path d="M12 1.6v2.4M12 20v2.4M1.6 12h2.4M20 12h2.4" />
  </svg>
);

export const IconDrag = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3v18M3 12h18" />
    <path d="M12 3l-2.4 2.6M12 3l2.4 2.6M12 21l-2.4-2.6M12 21l2.4-2.6" />
    <path d="M3 12l2.6-2.4M3 12l2.6 2.4M21 12l-2.6-2.4M21 12l-2.6 2.4" />
  </svg>
);

export const IconPlay = (p: P) => (
  <svg {...base} {...p}>
    <path d="M7.5 4.8v14.4l11-7.2z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPause = (p: P) => (
  <svg {...base} {...p}>
    <rect x="7" y="4.6" width="3.4" height="14.8" rx="1.1" fill="currentColor" stroke="none" />
    <rect x="13.6" y="4.6" width="3.4" height="14.8" rx="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconReset = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.6 12a8.4 8.4 0 1 0 2.6-6.1" />
    <path d="M3.4 4.2v4.6h4.6" />
  </svg>
);

export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.5 12.6l5 5L19.5 7" />
  </svg>
);

export const IconCross = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6" />
  </svg>
);

export const IconArrowRight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.6 12h14.8M13.4 6l6 6-6 6" />
  </svg>
);

export const IconArrowLeft = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19.4 12H4.6M10.6 6l-6 6 6 6" />
  </svg>
);

export const IconChevron = (p: P) => (
  <svg {...base} {...p}>
    <path d="M8.6 5l7 7-7 7" />
  </svg>
);

export const IconLock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.2" />
    <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
  </svg>
);

export const IconUnlock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.2" />
    <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.2-1.5" />
  </svg>
);

export const IconEye = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12z" />
    <circle cx="12" cy="12" r="2.9" />
  </svg>
);

export const IconGrid = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.4 3.4h17.2v17.2H3.4z" />
    <path d="M9.4 3.4v17.2M14.6 3.4v17.2M3.4 9.4h17.2M3.4 14.6h17.2" />
  </svg>
);

export const IconFlask = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9.4 3.4v5.2L4.6 17.4a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3l-4.8-8.8V3.4" />
    <path d="M8.4 3.4h7.2M7.2 13.6h9.6" />
  </svg>
);

export const IconBook = (p: P) => (
  <svg {...base} {...p}>
    <path d="M4.2 4.2h6a2.4 2.4 0 0 1 2.4 2.4v13a2 2 0 0 0-2-2H4.2z" />
    <path d="M19.8 4.2h-6a2.4 2.4 0 0 0-2.4 2.4v13a2 2 0 0 1 2-2h6.4z" />
  </svg>
);

export const IconSwords = (p: P) => (
  <svg {...base} {...p}>
    <path d="M14.6 3.4h6v6L11 19l-2.6-2.6z" />
    <path d="M9.4 3.4H3.4v6L13 19l2.6-2.6z" />
    <path d="M4.6 19.4l-1.2 1.2M19.4 19.4l1.2 1.2" />
  </svg>
);

export const IconSpark = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 2.6l2.1 6.1 6.1 2.1-6.1 2.1L12 19l-2.1-6.1L3.8 10.8l6.1-2.1z" />
  </svg>
);

export const IconInfo = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.4M12 7.7h.01" />
  </svg>
);

export const IconMinus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const IconPlus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconScope = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3.4 20.6V3.4M20.6 20.6H3.4" />
    <path d="M4 15.4c3 .2 4.4-8.2 7.6-8.2 2.6 0 2.4 5.4 4.6 5.4 1.8 0 3-1.6 4.4-3" />
  </svg>
);

export const IconWave = (p: P) => (
  <svg {...base} {...p}>
    <path d="M2.6 12c1.6-5 3.2-5 4.8 0s3.2 5 4.8 0 3.2-5 4.8 0 2.4 3 3.4 1.4" />
  </svg>
);
