import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const bubbles = [
  { delay: 0, x: -40, y: -60, size: 48 },
  { delay: 0.2, x: 50, y: -40, size: 36 },
  { delay: 0.4, x: -60, y: 20, size: 40 },
  { delay: 0.6, x: 30, y: 50, size: 32 },
  { delay: 0.8, x: -20, y: 80, size: 44 },
];

const text = "ChitChat".split("");

export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-[var(--color-primary-hover)]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating Bubbles */}
      <div className="relative w-48 h-48">
        {bubbles.map((bubble, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: bubble.x,
              y: bubble.y,
              scale: [0.8, 1.2, 0.8],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.5,
              delay: bubble.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
            style={{
              left: "50%",
              top: "50%",
              width: bubble.size,
              height: bubble.size,
              marginLeft: -bubble.size / 2,
              marginTop: -bubble.size / 2,
            }}
          >
            <div className="w-full h-full bg-[var(--color-primary-hover)] rounded-full blur-xl" />
            <motion.div
              className="absolute inset-2 bg-[var(--color-primary)] rounded-full shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <MessageCircle className="w-full h-full p-2 text-cyan-50" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* 3D Rotating Logo */}
      <motion.div
        className="relative mt-8 mb-6"
        animate={{ rotateY: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ perspective: 1000 }}
      >
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-full shadow-2xl"
            animate={{
              boxShadow: [
                "0 20px 40px rgba(6, 182, 212, 0.4)",
                "0 20px 40px rgba(6, 182, 212, 0.6)",
                "0 20px 40px rgba(6, 182, 212, 0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-2 bg-[var(--bg-main)] rounded-full flex items-center justify-center">
            <MessageCircle className="w-12 h-12 text-cyan-400" />
          </div>
        </div>
      </motion.div>

      {/* Animated Text */}
      <div className="flex gap-1 mt-4">
        {text.map((letter, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold"
            style={{
              background: "linear-gradient(to right, #FAFAF3, #0891B2, #FAFAF3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </div>

      {/* Tagline with fade-in */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-3 text-[var(--text-secondary)] text-sm sm:text-base tracking-wider"
      >
        Connecting the world, one chat at a time...
      </motion.p>

      {/* Bottom Dots */}
      <div className="absolute bottom-10 flex gap-2">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-[var(--color-primary)] rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </div>
  );
}