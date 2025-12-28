import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, UploadIcon, RefreshCwIcon, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import randomColor from "randomcolor";
import { motion } from "framer-motion";
// Helper function to generate UI avatar URL based on fullName
const generateUIAvatar = (fullName) => {
 const name = fullName || "";
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=512&background=random&color=fff`
};
const text = "ChitChat".split("");
// Helper function to generate cartoon-like avatar with bright background
const generateCartoonAvatar = (seed = Math.random().toString(36).substring(2, 15)) => {
  const brightColors = ["00FF88", "00DDEB", "FFDD00", "FF66CC", "66FF99"];
  const randomColor = brightColors[Math.floor(Math.random() * brightColors.length)];
  return { url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=${randomColor}`, seed };
};

// Helper function to generate profile image-like avatar
const generateProfileAvatar = (seed = Math.random().toString(36).substring(2, 15), replyGender, replyImageNumber) => {
  return { url: `https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/${replyGender}/512/${replyImageNumber}.jpg`, seed };
};

// Helper function to generate nature/random picture
const generateNatureImage = (seed = Math.random().toString(36).substring(2, 15)) => {
  return { url: `https://picsum.photos/seed/${seed}/512/512`, seed };
};

function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    about: "Hey there, come let's chat",
    profilePic: "",
    color: randomColor({
      luminosity: 'bright',
      format: 'hex',
    })
  });
  const [avatarType, setAvatarType] = useState(!formData.fullName ? "uiAvatar" : "cartoon");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [cartoonSeed, setCartoonSeed] = useState(Math.random().toString(36).substring(2, 15));
  const [natureSeed, setNatureSeed] = useState(Math.random().toString(36).substring(2, 15));
  const [profileSeed, setProfileSeed] = useState(Math.random().toString(36).substring(2, 15));
  const [replyRandomNum] = useState(Math.floor(Math.random() * 100) + 1);
  const [replyGender, setReplyGender] = useState(replyRandomNum % 2 === 0 ?
    "female" : "male");
  const [replyImageNumber, setReplyImageNumber] = useState(Math.floor(Math.random() * 100));
  const { signup, isSigningUp } = useAuthStore();
  const fileInputRef = useRef(null);

  // Generate avatar options
  const avatarOptions = [
    {
      type: "upload",
      label: "Upload Image",
      preview: uploadedImage || "/avatar.png",
    },
    {
      type: "cartoon",
      label: "Cartoon Avatar",
      preview: generateCartoonAvatar(cartoonSeed).url,
    },
    {
      type: "profile",
      label: "Random Avatar",
      preview: generateProfileAvatar(profileSeed, replyGender,  replyImageNumber, ).url,
    },
    {
      type: "nature",
      label: "Nature Image",
      preview: generateNatureImage(natureSeed).url,
    },
    
          {
            type: "uiAvatar",
            label: "Default Avatar",
            preview: generateUIAvatar(formData.fullName),
          },
      
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        setFormData({ ...formData, profilePic: reader.result });
        setAvatarType("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = (type, preview) => {
    setAvatarType(type);
    setFormData({ ...formData, profilePic: type === "upload" ? uploadedImage : preview });
  };

  // Regenerate all random avatars (cartoon, nature, profile)
  const regenerateAvatars = () => {
    const newCartoonSeed = Math.random().toString(36).substring(2, 15);
    const newNatureSeed = Math.random().toString(36).substring(2, 15);
    const newProfileSeed = Math.random().toString(36).substring(2, 15);
    const replyRandomNum = Math.floor(Math.random() * 100) + 1;
    const replyGender = replyRandomNum % 2 === 0 ? "female" : "male";
    const replyImageNumber = Math.floor(Math.random() * 100);
    setReplyGender(replyGender);
    setReplyImageNumber(replyImageNumber)
    setCartoonSeed(newCartoonSeed);
    setNatureSeed(newNatureSeed);
    setProfileSeed(newProfileSeed, replyGender, replyImageNumber);
    if (avatarType === "cartoon") {
      setFormData({ ...formData, profilePic: generateCartoonAvatar(newCartoonSeed).url });
    } else if (avatarType === "nature") {
      setFormData({ ...formData, profilePic: generateNatureImage(newNatureSeed).url });
    } else if (avatarType === "profile") {
      setFormData({ ...formData, profilePic: generateProfileAvatar(newProfileSeed).url });
    }
  };

 function randomcolor (){
  const brightColors = [
    '#FF4136', '#FF851B', '#FFDC00', '#2ECC40', '#01FF70',
    '#7FDBFF', '#39CCCC', '#3D9970', '#0074D9', '#B10DC9',
    '#F012BE', '#85144B', '#FF6F61', '#FFB347', '#FFE66D',
    '#00FF7F', '#00CED1', '#1E90FF', '#9370DB', '#FF69B4',
    '#FF6347', '#FFA07A', '#98FB98', '#87CEEB', '#6A5ACD',
    '#FFDAB9', '#20B2AA', '#F08080', '#ADFF2F', '#FF4500'
  ];
  return brightColors[Math.floor(Math.random() * brightColors.length)]; 
}

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (!formData.profilePic) {
      if (formData.fullName) {
        setFormData({ ...formData, profilePic: generateUIAvatar(formData.fullName) });
      } else {
        const cartoon = generateCartoonAvatar(cartoonSeed);
        setFormData({ ...formData, profilePic: cartoon.url });
        setCartoonSeed(cartoon.seed);
      }
    }
    signup(formData);
  };

  return (
    <div className="w-full flex items-center justify-center p-4 bg-[var(--bg-main)] min-h-screen">
      <div className="relative w-full max-w-6xl md:h-[800px] h-auto">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row-reverse">
            {/* FORM COLUMN - LEFT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-[var(--border)] bg-[var(--bg-main)]">
              <div className="w-full max-w-md">
                {/* HEADING TEXT */}
                <div className="flex  flex-col items-center justify-center gap-3 mb-4 ">
                  
                   <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">Create Account</h2>
                  <p className="text-[var(--text-secondary)]">Sign up for a new account</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* FULL NAME */}
                  <div>
                    <label className="auth-input-label">Full Name</label>
                    <div className="relative">
                      <UserIcon className="auth-input-icon" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setFormData({ ...formData, fullName: newName });
                          if (!newName && avatarType === "uiAvatar") {
                            const cartoon = generateCartoonAvatar(cartoonSeed);
                            setAvatarType("cartoon");
                            setFormData({ ...formData, fullName: newName, profilePic: cartoon.url });
                          }
                        }}
                        className="input"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* EMAIL INPUT */}
                  <div>
                    <label className="auth-input-label">Email</label>
                    <div className="relative">
                      <MailIcon className="auth-input-icon" />
                      <input
                        type="email"
                        required
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
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  {/* PROFILE PICTURE SELECTION */}
                  <div>
                    <div className="flex items-center justify-between">
                         <label className="auth-input-label">Profile Picture</label>
                        {
                         avatarType !== "upload" && <button
                          type="button"
                          className="flex text-sm items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-primary)]"
                          onClick={regenerateAvatars}
                        >
                          <RefreshCwIcon />
                          <span>Regenerate</span>
                        </button> 
                        } 
                    </div>
                    <div className="grid grid-cols-5 gap-1 mt-2">
                      {avatarOptions.map((option) => (
                        <div
                          key={option.type}
                          className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            avatarType === option.type
                              ? "border-2 border-cyan-400 bg-[var(--bg-secondary)]"
                              : "border border-slate-600 hover:bg-[var(--bg-secondary)]"
                          }`}
                          onClick={() => handleAvatarSelect(option.type, option.preview)}
                        >
                          {option.type === "upload" ? (
                            <div className="relative group w-19 h-19 rounded-full overflow-hidden">
                              <img
                                src={option.preview}
                                alt={option.label}
                                className="w-full h-full object-cover"
                              />
                              {
                                avatarType === option.type &&  <div
                                className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                                onClick={() => fileInputRef.current.click()}
                              >
                                <UploadIcon className="w-6 h-6 text-white" />
                              </div>
                              }
                             
                            </div>
                          ) : (
                            <img
                              src={option.preview}
                              alt={option.label}
                              className="w-19 h-19 rounded-full object-cover"
                            />
                          )}
                          <span className="text-[var(--text-secondary)] text-center text-xs mt-2">{option.label}</span>
                        </div>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button className="auth-btn" type="submit" disabled={isSigningUp}>
                    {isSigningUp ? (
                      <LoaderIcon className="w-full h-5 animate-spin text-center" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="auth-link">
                    Already have an account? Login
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
                  src="/signup.png"
                  alt="People using mobile devices"
                  className="w-full h-auto object-contain"
                />
                <div className="mb-3 text-center">
                  <h3 className="text-xl font-medium text-[var(--color-primary)]">Start Your Journey Today</h3>
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

export default SignUpPage;