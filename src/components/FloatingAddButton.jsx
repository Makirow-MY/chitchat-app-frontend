// src/components/FloatingAddButton.jsx
import { FiPlus } from "react-icons/fi";

export default function FloatingAddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 btn btn-circle btn-primary btn-lg shadow-lg z-40  text-[var(--text-primary)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] "
    >
      <FiPlus size={25} />
    </button>
  );
}