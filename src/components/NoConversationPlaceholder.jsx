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
const NoConversationPlaceholder = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      {/* <div className="flex items-center justify-center gap-3 mb-4 ">
                        <div className="w-[3.7rem] h-[3.7rem] flex items-center justify-center p-2   text-[var(--text-primary)] bg-cyan-600 rounded-full">
                         <MessageCircleIcon className="w-[3.5rem] h-[3.5rem]" />
                        </div>
                        <h1  className="text-cyan-600 text-2xl sm:text-4xl font-bold" style={{
                          background: "linear-gradient(to right, #FAFAF3FF,#0891B2, #FAFAF3FF",
                          webkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}>ChitChat</h1>
                        </div> */}

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
      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Select a conversation</h3>
      <p className="text-[var(--text-secondary)] max-w-md">
        Choose a contact from the sidebar to start chatting or continue a previous conversation.
      </p>
    </div>
  );
};

export default NoConversationPlaceholder;
