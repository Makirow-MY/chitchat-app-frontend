// components/PrimaryColorPicker.jsx
import toast from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";

const colors = [
  { name: "cyan",        value: "#0891B2" },
  { name: "lightgreen",  value: "#2AE903" },
  { name: "yellow",      value: "#FFFF00" },
  { name: "red",         value: "#F91616" },
  { name: "blue",        value: "#3B82F6" },
  { name: "green",       value: "#10B981" },
  { name: "purple",      value: "#8B5CF6" },
  { name: "pink",        value: "#EC4899" },
  { name: "orange",      value: "#F97316" },

  // ────── NEW 11 COLORS ──────
  { name: "teal",        value: "#14B8A6" },
  { name: "indigo",      value: "#6366F1" },
  { name: "lime",        value: "#84CC16" },
  { name: "amber",       value: "#F59E0B" },
  { name: "rose",        value: "#F43F5E" },
  { name: "violet",      value: "#A78BFA" },
  { name: "emerald",     value: "#34D399" },
  { name: "sky",         value: "#0EA5E9" },
  { name: "fuchsia",     value: "#D946EF" },
  { name: "slate",       value: "#64748B" },
  { name: "zinc",        value: "#71717A" },
];

export default function PrimaryColorPicker({setShowColor}) {
  const { primaryColor, setPrimaryColor } = useThemeStore();

  return (
    <div
      onMouseLeave={() => setShowColor(false)}
     className="flex gap-2 flex-wrap absolute top-[50%] left-0 z-10 p-4 shadow-md bg-[var(--bg-main)]">
      {colors.map((c) => (
        <button
          key={c.name}
          onClick={() => {
            setPrimaryColor(c.name);
            toast.success(c.name);
          }}
          className={`
            w-8 h-8 rounded-full border-2 transition-all
            ${primaryColor === c.name ? "border-[var(--text-primary)] scale-110" : "border-transparent"}
          `}
          style={{
            backgroundColor: c.value,
           // borderColor: primaryColor === c.name ? c.value : "",
          }}
          title={c.name}
        />
      ))}
    </div>
  );
}