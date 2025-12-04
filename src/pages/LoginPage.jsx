import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, MailIcon, LoaderIcon, LockIcon, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import randomColor from "randomcolor"; 
import { motion } from "framer-motion";
// Helper function to generate UI avatar URL based on fullName
const generateUIAvatar = (fullName) => {
 const name = fullName || "";
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=512&background=random&color=fff`
};

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", 
    password: "", color: randomColor({
      luminosity: 'bright',
      format: 'hex',
    })
   });
  const { login, isLoggingIn, theme } = useAuthStore();
const text = "ChitChat".split("");
  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className={`w-full flex items-center justify-center p-4  "bg-[var(--bg-main)] `}>
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row-reverse">
            {/* FORM CLOUMN - LEFT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-[var(--border)] bg-[var(--bg-main)]">
              <div className="w-full max-w-md">
                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                  
            
                  <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Welcome Back</h2>
                  <p className="text-[var(--text-secondary)]">Login to access to your account</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* EMAIL INPUT */}
                  <div>
                    <label className="auth-input-label">Email</label>
                    <div className="relative">
                      <MailIcon className="auth-input-icon" />

                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder="johndoe@gmail.com"
                      />
                    </div>
                  </div>

                  {/* PASSWORD INPUT */}
                  <div>
                    <label className="auth-input-label">Password</label>
                    <div className="relative">
                      <LockIcon className="auth-input-icon" />

                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button className="auth-btn" type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <LoaderIcon className="w-full h-5 animate-spin text-center" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/signup" className="auth-link">
                    Don't have an account? Sign Up
                  </Link>
                </div>
              </div>
            </div>

            {/* FORM ILLUSTRATION - RIGHT SIDE */}
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
export default LoginPage;
