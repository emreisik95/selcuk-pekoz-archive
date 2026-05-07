import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

export const BellIcon = (p: Props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="M3 5.5a4 4 0 1 1 8 0v2c0 .8.3 1.5.8 2H2.2c.5-.5.8-1.2.8-2v-2Z" />
    <path d="M5.7 11.5a1.5 1.5 0 0 0 2.6 0" />
  </svg>
);

export const PlayIcon = (p: Props) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" {...p}>
    <path d="M3 2.5v7l6.5-3.5z" />
  </svg>
);

export const CalIcon = (p: Props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    {...p}
  >
    <rect x="2" y="3" width="10" height="9" rx="1" />
    <path d="M2 6h10M5 1.5v3M9 1.5v3" />
  </svg>
);

export const SearchIcon = (p: Props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    {...p}
  >
    <circle cx="6" cy="6" r="4" />
    <path d="m9 9 3 3" />
  </svg>
);

export const ExtIcon = (p: Props) => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 11 11"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    {...p}
  >
    <path d="M4 1.5h5v5M9 1.5 4 6.5M9 6v3.5H1.5v-7H5" />
  </svg>
);

export const ArrowIcon = (p: Props) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    {...p}
  >
    <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" />
  </svg>
);

export const CloseIcon = (p: Props) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    {...p}
  >
    <path d="M3 3l8 8M11 3l-8 8" />
  </svg>
);
