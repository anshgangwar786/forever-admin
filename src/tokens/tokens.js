/**
 * Forever Quiet Luxury Design Tokens
 * Single source of truth consumed by storefront (frontend) and admin control panel.
 */

export const colors = {
  canvas: "#FAF8F5",
  canvasMuted: "#F4F1EA",
  canvasSubtle: "#FBF9F6",
  surface: "#FFFFFF",
  surfaceSand: "#FBF9F6",
  ink: "#1C1917",
  inkSecondary: "#44403C",
  inkMuted: "#78716C",
  inkFaint: "#A8A29E",
  hairline: "#E7E3D9",
  border: "#E7E3D9",
  borderSubtle: "#DCD7CC",
  borderDark: "#292524",
  accent: "#B08D57",
  accentHover: "#967543",
  accentLight: "#F7F3EB",
  accentGlow: "rgba(176, 141, 87, 0.2)",
  admin: {
    sidebar: "#1C1917",
    sidebarHover: "#292524",
    sidebarActive: "#2A2725",
    sidebarBorder: "rgba(231, 227, 217, 0.12)",
    sidebarText: "#FAF8F5",
    sidebarMuted: "#A8A29E",
    workbench: "#FAF8F5",
  },
  status: {
    success: "#2E5A36",
    successLight: "#EBF3EC",
    successBorder: "#C2D9C6",
    warning: "#8C581E",
    warningLight: "#FAF2E6",
    warningBorder: "#EAD7BA",
    danger: "#8E2824",
    dangerLight: "#FAECEB",
    dangerBorder: "#E8C4C2",
    info: "#2A4B6B",
    infoLight: "#EBF2F8",
    infoBorder: "#BFD3E6",
  },
};

export const typography = {
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    serif: "'Playfair Display', Georgia, serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  scale: {
    display: "font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-tight tracking-tight",
    h1: "font-serif text-3xl sm:text-4xl font-normal leading-snug tracking-tight",
    h2: "font-serif text-2xl sm:text-3xl font-normal leading-snug tracking-tight",
    h3: "font-serif text-xl sm:text-2xl font-normal leading-snug",
    h4: "font-serif text-lg font-medium leading-normal",
    h5: "font-sans text-base font-medium leading-normal",
    h6: "font-sans text-xs uppercase tracking-[0.2em] font-semibold",
    body: "font-sans text-sm sm:text-[15px] leading-relaxed text-ink-secondary",
    bodySm: "font-sans text-xs sm:text-sm leading-normal text-ink-muted",
    caption: "font-sans text-[11px] leading-normal tracking-wide text-ink-muted",
    overline: "font-sans text-[10px] uppercase tracking-[0.25em] font-semibold text-accent",
  },
};

export const motion = {
  easing: {
    luxury: "cubic-bezier(0.16, 1, 0.3, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  },
  duration: {
    micro: "150ms",
    ui: "250ms",
    page: "350ms",
    reveal: "800ms",
  },
};

export const shadows = {
  luxurySm: "0 1px 3px rgba(28, 25, 23, 0.04), 0 1px 2px rgba(28, 25, 23, 0.02)",
  luxuryMd: "0 4px 16px -2px rgba(28, 25, 23, 0.06), 0 2px 6px -1px rgba(28, 25, 23, 0.03)",
  luxuryLg: "0 12px 32px -4px rgba(28, 25, 23, 0.08), 0 4px 12px -2px rgba(28, 25, 23, 0.04)",
  luxuryXl: "0 24px 48px -12px rgba(28, 25, 23, 0.12), 0 8px 24px -4px rgba(28, 25, 23, 0.06)",
};

export default {
  colors,
  typography,
  motion,
  shadows,
};
