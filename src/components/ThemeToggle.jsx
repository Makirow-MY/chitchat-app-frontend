// components/ThemeToggle.jsx
import { FiMoon, FiSun } from "react-icons/fi";
import { useThemeStore } from "../store/useThemeStore";

export default function ThemeToggle() {
  const { mode, setMode } = useThemeStore();

  return (
    <button
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      className="relative  w-[10rem] h-7 bg-[var(--bg-secondary)] rounded-full p-1 transition-all duration-300"
    >
      <div
        className={`absolute top-1 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-xs
          ${mode === 'dark' ? 'translate-x-0 text-[var(--bg-main)] bg-yellow-400' : 'translate-x-7 bg-yellow-400 text-slate-900'}`}
      >
        {mode === 'dark' ? <FiMoon /> : <FiSun />}
      </div>
    </button>
  );
}