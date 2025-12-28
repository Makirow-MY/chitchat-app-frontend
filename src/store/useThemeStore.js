import { create } from 'zustand';
const hexToRgba50 = (hex) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substr(0, 2), 16);
  const g = parseInt(clean.substr(2, 2), 16);
  const b = parseInt(clean.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, 0.5)`;
};

const ALL_COLORS = [
  "cyan", "lightgreen", "yellow", "red", "blue", "green", "purple", "pink", "orange",
  "teal", "indigo", "lime", "amber", "rose", "violet", "emerald", "sky", "fuchsia", "slate", "zinc"
];

const COLOR_MAP = {
  cyan:       { base: "#0891b2", hover: "#067a94" },
  lightgreen: { base: "#2ae903", hover: "#22c703" },
  yellow:     { base: "#ffff00", hover: "#e6e600" },
  red:        { base: "#f91616", hover: "#d91414" },
  blue:       { base: "#3b82f6", hover: "#2563eb" },
  green:      { base: "#10b981", hover: "#059669" },
  purple:     { base: "#8b5cf6", hover: "#7c3aed" },
  pink:       { base: "#ec4899", hover: "#db2777" },
  orange:     { base: "#f97316", hover: "#ea580c" },
  teal:       { base: "#14b8a6", hover: "#0d9488" },
  indigo:     { base: "#6366f1", hover: "#4f46e5" },
  lime:       { base: "#84cc16", hover: "#65a30d" },
  amber:      { base: "#f59e0b", hover: "#d97706" },
  rose:       { base: "#f43f5e", hover: "#e11d48" },
  violet:     { base: "#a78bfa", hover: "#8b5cf6" },
  emerald:    { base: "#34d399", hover: "#10b981" },
  sky:        { base: "#0ea5e9", hover: "#0284c7" },
  fuchsia:    { base: "#d946ef", hover: "#c026d3" },
  
};

export const useThemeStore = create((set, get) => {
  const html = document.documentElement;

  const applyTheme = (mode, colorName) => {
    const { base} = COLOR_MAP[colorName] || {base: "#0891b2", hover: "#067a94"};
const hover = hexToRgba50(base)
    // 1. Set CSS variables directly (bypass specificity)
    html.style.setProperty('--color-primary', base);
    html.style.setProperty('--color-primary-hover', hover);
  localStorage.setItem('primary-color', colorName) || 'cyan';

    // 2. Set classes (for Tailwind & legacy)
    html.classList.toggle('light', mode === 'light');
    html.className = html.className.replace(/theme-\w+/g, '').trim();
    html.classList.add(`theme-${colorName}`);

    void html.offsetHeight;
  };

  const storedMode = localStorage.getItem('theme-mode') || 'dark';
  const storedColor = localStorage.getItem('primary-color') || 'cyan';

  let timer = null;

  const startRotation = () => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const { primaryColor } = get();
      const idx = ALL_COLORS.indexOf(primaryColor);
      const next = ALL_COLORS[(idx + 1) % ALL_COLORS.length];
      get().setPrimaryColor(next);
    }, 5 * 60 * 1000);
  };

  return {
    mode: storedMode,
    primaryColor: storedColor,

    setMode: (mode) => {
      set({ mode });
      localStorage.setItem('theme-mode', mode);
      applyTheme(mode, get().primaryColor);
    },

    setPrimaryColor: (color) => {
      set({ primaryColor: color });
      // Do NOT save rotating color
      applyTheme(get().mode, color);
    },

    init: () => {
      applyTheme(storedMode, storedColor);
      startRotation();
    },

    stopRotation: () => timer && clearInterval(timer),
  };
});