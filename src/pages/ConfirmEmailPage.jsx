import { Mail, CheckCircle, ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { motion } from "framer-motion";
import CapitalizeName from "../components/CapitalizeName";
// Helper function to generate UI avatar 

export default function ConfirmEmailPage() {
  const text = "ChitChat".split("");
  const getUser =   window.localStorage.getItem("userName") || null
  return (
       <div className={`w-full flex items-center justify-center p-4  "bg-[var(--bg-main)] `}>
          <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
            <BorderAnimatedContainer>
    <div className="w-full flex flex-col md:flex-row-reverse">
            {/* FORM CLOUMN - LEFT SIDE */}
            <div className="md:w-1/2 p-8 flex flex-col items-center justify-center md:border-r border-[var(--border)] bg-[var(--bg-main)] h-full">
             <div className="w-full max-w-md">
           <div className="text-center mb-8">
                  
            
                  <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Email Verification</h2>
                  <p className="text-[var(--text-secondary)]">Check your Email inbox</p>
                </div>
        </div>

        <div className="space-y-4">
           <p className="text-[var(--text-primary)]">Dear {getUser !== null ? CapitalizeName(getUser) : "user"}, we've sent a confirmation link to your email. Within 24 hours</p>
          <div className="flex items-center  gap-2 text-inherit font-semibold">
            <CheckCircle className="w-5 h-5" />
            <span>Click the link provided to activate your account</span>
          </div>
        </div>

        <div className="text-sm  mt-4 bg-[var(--bg-secondary)] rounded-lg p-6 rounded-lg space-y-3">
          <p className="text-[var(--color-primary)] shadow-xl font-semibold ">Didn't receive the email?</p>
          <ol className="text-left mt-1 ">
            <li>Check your spam/junk folder</li>
            <li>Verify your internet connection</li>
            <li>Make sure you entered the correct email</li>
          </ol>
        </div>
   <div className="mt-6 text-center">
                  <Link className="auth-link w-fit flex items-center gap-1"
          to="/login"
        >
          Back to Login
          <ArrowRight className="w-4 h-4" />
        </Link>
        </div>
      </div>

        <div className="hidden md:w-1/2 md:flex flex-col items-center justify-center p-6 bg-gradient-to-bl from-[var(--bg-secondary)] to-[var(--bg-main)]">
                                
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
                                    
                                     <div>
                      <img
                        src="/login.png"
                        alt="People using mobile devices"
                        className="w-full h-auto object-contain"
                      />
                      <div className="mt-6 text-center">
                        <h3 className="text-xl font-medium text-cyan-400">Connect anytime, anywhere</h3>
      
                        <div className="mt-4 flex justify-center gap-4">
                          <span className="auth-badge">Free</span>
                          <span className="auth-badge">Easy Setup</span>
                          <span className="auth-badge">Private</span>
                        </div>
                      </div>
                    </div>
                  </div>

    </div>
    </BorderAnimatedContainer>
    </div>
    </div>
  );
}