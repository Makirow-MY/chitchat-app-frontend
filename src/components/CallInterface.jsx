// components/CallInterface.js
import { useEffect, useRef, useState, useCallback } from "react";
import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  PhoneIcon, VideoIcon, MicIcon, MicOffIcon, VideoOffIcon,
  Volume2, VolumeX, Camera, CameraOff, Minimize2,
  ScreenShare, Users, Lock, MoreVertical, MessageCircle,
  PhoneOff,
  X,
  PhoneCall,
  PhoneOffIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const CallInterface = ({isMinimized, setIsMinimized}) => {
  //const { activeCall, remoteStreams, localStream, endCall, leaveCall, toggleMic, toggleVideo, toggleSpeaker, switchCamera, startScreenShare ,} = useCallStore();
  const { selectedUser,
    acceptCall, rejectCall,
    initiateCall, exit,  selectedGroup,activeCall,isRinging, incomingCall, remoteStreams, localStream, endCall, leaveCall,toggleMute, toggleMic, toggleVideo, toggleSpeaker, switchCamera, startScreenShare } = useChatStore();
  const { authUser } = useAuthStore();

  const localVideoRef = useRef(null);
  const [callDuration, setCallDuration] = useState(0);
  const handleVoiceCall = () => {
    const targetId = selectedUser?._id || selectedGroup?._id;
    const isGroup = !!selectedGroup;
    initiateCall({type:'voice', targetId, isGroup, roomId: isGroup ? selectedGroup._id : selectedUser.roomId});
  };

// **Function: Handle video call initiation**
// Triggers video call using call store.
  const handleVideoCall = () => {
    const targetId = selectedUser?._id || selectedGroup?._id;
    const isGroup = !!selectedGroup;
    initiateCall({type:'video', targetId, isGroup, roomId: isGroup ? selectedGroup._id : selectedUser.roomId});
  };
 // REMOVE: const [isRinging, setIsRinging] = useState(...)
// USE:

console.log("iyetyuwqoqlkhgdt898te2781",activeCall, incomingCall,localStream)
  const [showControls, setShowControls] = useState(true);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const participants = !!selectedGroup
    ? selectedGroup?.members || []
    : [selectedUser, authUser].filter(Boolean);

  const remoteParticipantStreams = remoteStreams ? Object.entries(remoteStreams) : [];
  const totalParticipants = remoteParticipantStreams.length + 1;

  // Timer
  useEffect(() => {
    if (activeCall?.status === 'ongoing' && activeCall?.startedAt) {
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - new Date(activeCall.startedAt)) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeCall]);

  // Local video
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Auto-hide controls
  useEffect(() => {
    if (!isRinging) {
      const timer = setTimeout(() => setShowControls(false), 5000);
      const reset = () => { setShowControls(true); clearTimeout(timer); };
      window.addEventListener('mousemove', reset);
      window.addEventListener('touchstart', reset);
      return () => {
        window.removeEventListener('mousemove', reset);
        window.removeEventListener('touchstart', reset);
      };
    }
  }, [isRinging]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
      const audioRef = useRef(null)
  const timeoutRef = useRef(null)
  useEffect(() => {
   if(incomingCall){ audioRef.current = new Audio("/sounds/ring.mp3");
    audioRef.current.loop = true;
    audioRef.current.play()
    timeoutRef.current = setTimeout(() => {
         if(audioRef.current)
         {
          audioRef.current.pause();
          audioRef.current.currentTime = 0
         }
    }, 5 * 60 *1000)}
    else{
      if(audioRef.current)
         {
          audioRef.current.pause();
          audioRef.current.currentTime = 0
         }

         clearTimeout(timeoutRef.current)
    }
    return () => {
      clearTimeout(audioRef.current)
      if(audioRef.current)
         {
          audioRef.current.pause();
         }
    }
  }, [incomingCall])

const handleEnd = async () => {
  if (!activeCall?._id) return;
  toast.success(activeCall._id)
  await endCall(activeCall._id); // Always use endCall
};
 const handleAccept = async () => {
  if (!activeCall?._id) return;
  toast.success(activeCall._id)
  await acceptCall(activeCall._id); // Always use endCall
};
  // Active speaker detection
  useEffect(() => {
    if (remoteParticipantStreams.length > 0) {
      const volumes = remoteParticipantStreams.map(([id, stream]) => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        return { id, volume: data.reduce((a, b) => a + b) / data.length };
      });
      const loudest = volumes.reduce((max, curr) => curr.volume > max.volume ? curr : max, volumes[0]);
      setActiveSpeakerId(loudest?.id);
    }
  }, [remoteStreams]);

if (isMinimized && activeCall && activeCall?.participants?.find((id) => id === selectedUser._id)) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 120, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
      exit={{ scale: 0, opacity: 0, y: 120, rotate: 10 }}
      whileHover={{ 
        scale: 1.08, 
        boxShadow: "0 0 60px rgba(34, 197, 94, 0.8), 0 0 120px rgba(34, 197, 94, 0.4)",
        y: -8
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
      className="fixed bottom-8 right-8 w-72 h-48 bg-gradient-to-br from-[var(--bg-secondary)]/95 via-zinc-900/90 to-black/70 backdrop-blur-2xl rounded-3xl overflow-hidden cursor-pointer z-[100000] shadow-2xl border border-white/20"
      onClick={() => setIsMinimized(false)}
      style={{ 
        backgroundImage: `radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.2), transparent 50%)`,
        filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))"
      }}
    >
      {/* Holographic Video Background with Parallax */}
      <div className="absolute inset-0 overflow-hidden">
        {activeCall.type !== "voice" ? (
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-125 blur-md brightness-75"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          />
        ) : (
          <img 
            src={selectedUser?.profilePic || selectedGroup?.profilePic} 
            className="w-full h-full object-cover scale-125 blur-lg brightness-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent animate-pulse" />
      </div>

      {/* 3D Floating Orb with Depth Glow */}
      <motion.div
        animate={{ 
          y: [0, -12, 0],
          rotateZ: [0, 5, -5, 0]
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full overflow-hidden ring-4 ring-green-400/70 shadow-2xl"
        style={{
          boxShadow: "0 0 40px rgba(34, 197, 94, 0.6), inset 0 0 20px rgba(255,255,255,0.2)",
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)"
        }}
      >
        <img src={selectedUser?.profilePic || selectedGroup?.profilePic} className="w-full h-full object-cover" />
        <div className="absolute inset-0 ring-2 ring-white/30 rounded-full" />
      </motion.div>

      {/* Quantum Encryption Pulse */}
      <motion.div
        animate={{ 
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.1, 1]
        }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-medium text-green-300"
        style={{ textShadow: "0 0 8px rgba(34, 197, 94, 0.8)" }}
      >
        <Lock size={13} className="drop-shadow-md" />
        <span className="tracking-wider">QUANTUM SECURED</span>
      </motion.div>

      {/* Live Duration with Neon Flicker */}
      {activeCall.status !== "ringing" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
          className="absolute top-4 right-4 text-xs font-bold tracking-wider text-green-400 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-green-500/30"
          style={{
            textShadow: "0 0 12px rgba(34, 197, 94, 0.9)",
            animation: "flicker 3s infinite alternate"
          }}
        >
          {formatDuration(callDuration)}
        </motion.div>
      )}

      {/* Holographic Name Tag */}
      <motion.div
        style={{ color: selectedUser?.color || selectedGroup?.color || "#22c55e" }}
        className="absolute bottom-4 left-4 text-base font-black capitalize tracking-tight bg-gradient-to-r from-black/70 to-black/40 backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl border border-white/20"
        animate={{ 
          textShadow: [
            "0 0 10px currentColor",
            "0 0 30px currentColor",
            "0 0 10px currentColor"
          ],
          x: [-1, 1, -1]
        }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        {selectedUser?.fullName || selectedGroup?.name}
      </motion.div>

      {/* Expanding Pulse Rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ 
            scale: [1, 2.5 + i * 0.5], 
            opacity: [0.4, 0.1, 0] 
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.5, 
            ease: "easeOut",
            delay: i * 0.3
          }}
          className="absolute inset-0 rounded-3xl border-2 border-green-400/40 pointer-events-none"
          style={{ filter: "blur(1px)" }}
        />
      ))}

      {/* Subtle Scanline Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-green-400 to-transparent animate-scan" />
      </div>
    </motion.div>
  );
}

return (
  <div className="fixed inset-0 bg-[var(--bg-main)] flex flex-col z-[100000] overflow-hidden">
    {/* GLOBAL BACKGROUND PARTICLES */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-[var(--bg-main)] to-black/50" />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400/30 rounded-full"
          initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }}
          animate={{
            y: [null, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
    {/* === RINGING SCREEN (CINEMATIC INCOMING) === */}
        <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 flex flex-col items-center justify-center p-10 relative"
        >
          {/* GLASSMORPHIC TOP BAR */}
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center text-green-300 backdrop-blur-2xl bg-white/5 border-b border-white/10 rounded-b-3xl shadow-2xl"
            style={{ backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              <Lock size={18} className="drop-shadow" />
              <span className="tracking-wider">MILITARY-GRADE ENCRYPTION</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMinimized(true)}
              className="p-3 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 transition-all shadow-lg"
            >
              <Minimize2 size={22} />
            </motion.button>
          </motion.div>

          {/* HOLOGRAPHIC AVATAR ORB */}
          <motion.div
            animate={{ 
              scale: [1, 1.25, 1],
              rotateZ: [0, 5, -5, 0]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-44 h-44 rounded-full overflow-hidden mb-10 ring-8 ring-green-400/70 ring-offset-8 ring-offset-black shadow-2xl relative"
            style={{
              boxShadow: "0 0 80px rgba(34, 197, 94, 0.7), inset 0 0 40px rgba(255,255,255,0.2)",
              background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent)"
            }}
          >
            <img src={incomingCall.caller?.profilePic} className="w-full h-full object-cover" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-4 border-green-300 opacity-60"
              style={{ filter: "blur(1px)" }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-b-4 border-cyan-400 opacity-40"
              style={{ filter: "blur(1.5px)" }}
            />
          </motion.div>

          {/* NAME WITH NEON GLOW */}
          <motion.h2
            style={{ color: incomingCall.caller.color || "#22d3ee" }}
            className="text-5xl capitalize font-black tracking-tighter mb-3"
            animate={{ 
              textShadow: [
                "0 0 15px currentColor, 0 0 30px currentColor",
                "0 0 40px currentColor, 0 0 80px currentColor",
                "0 0 15px currentColor, 0 0 30px currentColor"
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {incomingCall.caller.fullName}
          </motion.h2>
          <p className="text-green-300 text-xl mb-12 animate-pulse font-medium tracking-widest">
            INCOMING {incomingCall?.type} CALL
          </p>

          {/* ACTION BUTTONS WITH SHOCKWAVE */}
          <div className="flex gap-12">
            {[
              { 
                color: "emerald", 
                label: "ACCEPT", 
                icon: PhoneIncomingIcon,
                onClick: () => { 
                  acceptCall(incomingCall.callId, !!selectedGroup ? selectedGroup.roomId || selectedGroup._id : selectedUser.roomId);
                  if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
                }
              },
              { 
                color: "red", 
                label: "DECLINE", 
                icon: PhoneOutgoingIcon,
                onClick: () => { 
                  rejectCall(incomingCall.callId, !!selectedGroup ? selectedGroup.roomId || selectedGroup._id : selectedUser.roomId);
                  if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
                },
                rotate: "rotate-135"
              }
            ].map((btn, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={btn.onClick}
                className={`relative bg-gradient-to-br from-${btn.color}-600 to-${btn.color}-700 p-8 rounded-full shadow-2xl overflow-hidden group flex items-center justify-center`}
                style={{
                  boxShadow: `0 0 60px rgba(${btn.color === 'emerald' ? '34,197,94' : '239,68,68'}, 0.6)`,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 rounded-full bg-white/30 pointer-events-none"
                />
                <btn.icon size={40} className={`text-white relative z-10 ${btn.rotate || ''}`} />
                <span className="ml-3 text-white font-bold text-lg tracking-wide">{btn.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    {/* === CONNECTED CALL SCREEN === */}
    {!isRinging && activeCall && activeCall?.participants?.find((id) => id === selectedUser._id) && (
      <>
        {/* VIDEO GRID */}
        <div className="flex-1 relative overflow-hidden">
          {activeCall?.type === 'video' ? (
            <div className={`grid h-full ${totalParticipants === 1 ? 'grid-cols-1' : totalParticipants <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-2 p-2`}>
              {remoteParticipantStreams.map(([id, stream]) => {
                const user = participants.find(p => p._id === id);
                const isActive = activeSpeakerId === id;
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`relative rounded-2xl overflow-hidden ${isActive ? 'ring-4 ring-green-500 ring-offset-4 ring-offset-black' : ''} shadow-xl`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <video autoPlay playsInline srcObject={stream} className="w-full h-full object-cover" />
                    {/* Name Tag */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-[var(--text-secondary)] px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      {user?.fullName?.split(' ')[0]}
                    </motion.div>
                    {user?.muted && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <MicOffIcon className="absolute top-3 right-3 text-red-500" size={22} />
                      </motion.div>
                    )}
                    {/* Active Speaker Pulse */}
                    {isActive && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 ring-4 ring-green-500 pointer-events-none"
                      />
                    )}
                  </motion.div>
                );
              })}
              {/* Local PiP with Hover Float */}
              <motion.div
                whileHover={{ scale: 1.1, zIndex: 50 }}
                className="absolute bottom-6 right-6 w-36 h-48 rounded-2xl overflow-hidden border-4 border-white/50 shadow-2xl backdrop-blur-sm"
              >
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 text-xs bg-black/60 backdrop-blur px-2 py-1 rounded-full">You</div>
              </motion.div>
            </div>
          ) : (
            /* VOICE CALL - EPIC CENTERED AVATAR */
            <div className="flex flex-col items-center justify-center h-full relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-[10rem] h-[10rem] rounded-full overflow-hidden ring-8 ring-[var(--color-primary)]/50 ring-offset-8 ring-offset-transparent shadow-2xl relative"
              >
                <img src={selectedUser.profilePic} className="w-full h-full object-cover" />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-4 border-[var(--color-primary)] opacity-40"
                />
              </motion.div>
              <motion.h3
                style={{ color: selectedUser.color }}
                className="text-4xl capitalize font-extrabold mt-6 tracking-tight"
                animate={{ textShadow: ["0 0 10px currentColor", "0 0 30px currentColor", "0 0 10px currentColor"] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {selectedUser.fullName}
              </motion.h3>
              {(activeCall.status === 'ringing' || activeCall.status === 'ongoing') && (
                <p className="text-[var(--text-primary)] text-lg capitalize mt-2 animate-pulse">{activeCall.status}...</p>
              )}
              {activeCall.status === 'rejected' && (
                <p className="text-red-400 text-lg capitalize">{activeCall.type} call {activeCall.status}</p>
              )}
              {activeCall.status === 'ongoing' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-[var(--text-secondary)] mt-3"
                >
                  {formatDuration(callDuration)}
                </motion.span>
              )}
            </div>
          )}
        </div>
        {/* TOP BAR - GLASSMORPHIC */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-[var(--text-secondary)] backdrop-blur-xl bg-white/5 border-b border-white/10"
        >
          <div className="flex items-center gap-2 text-sm">
            <Lock size={16} />
            <span>End-to-end encrypted</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMinimized(true)}
            className="p-2 rounded-lg bg-white/10 backdrop-blur hover:bg-white/20 transition-all"
          >
            <Minimize2 size={20} />
          </motion.button>
        </motion.div>
        {/* BOTTOM CONTROLS - FLOATING PANEL */}
        {(activeCall.status === "ringing" || activeCall.status === "ongoing") && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: showControls ? 0 : 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 backdrop-blur-2xl"
          >
            <div className="flex justify-center items-center gap-6">
              {[
                { onClick: toggleSpeaker, icon: Volume2, active: true },
                {
                  onClick: () => toggleMute(),
                  icon: localStream?.getAudioTracks()[0]?.enabled ? MicIcon : MicOffIcon,
                  active: localStream?.getAudioTracks()[0]?.enabled,
                  bg: localStream?.getAudioTracks()[0]?.enabled ? "bg-white/20" : "bg-[var(--color-primary-hover)]"
                },
                ...(activeCall?.type === 'video' ? [{
                  onClick: toggleVideo,
                  icon: localStream?.getVideoTracks()[0]?.enabled ? VideoIcon : VideoOffIcon,
                  active: localStream?.getVideoTracks()[0]?.enabled,
                  bg: localStream?.getVideoTracks()[0]?.enabled ? "bg-white/20" : "bg-[var(--color-primary)]"
                }] : []),
                { onClick: handleEnd, icon: PhoneOutgoingIcon, bg: "bg-red-600", rotate: "rotate-135", size: 28 },
                ...(activeCall?.type === 'video' ? [
                  { onClick: switchCamera, icon: Camera },
                  { onClick: startScreenShare, icon: ScreenShare }
                ] : [])
              ].map((btn, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={btn.onClick}
                  className={`w-16 h-16 ${btn.bg || 'bg-white/20'} backdrop-blur rounded-full flex items-center justify-center shadow-xl transition-all`}
                >
                  <btn.icon size={btn.size || 24} className={`text-[var(--text-primary)] ${btn.rotate || ''}`} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        {/* REJECTED STATE */}
        {activeCall.status === "rejected" && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8"
          >
            <div className="flex justify-center gap-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={activeCall.type !== 'video' ? handleVoiceCall : handleVideoCall}
                className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-full flex items-center gap-3 text-xl font-bold shadow-2xl"
              >
                {activeCall.type !== 'video' ? <PhoneOutgoingIcon size={28} /> : <VideoIcon size={28} />}
                Call Again
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exit}
                className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-full flex items-center gap-3 text-xl font-bold shadow-2xl"
              >
                Exit
              </motion.button>
            </div>
          </motion.div>
        )}
      </>
    )}
  </div>
);

// return (
//   <div className="fixed inset-0 bg-[var(--bg-main)] flex flex-col z-[100000] overflow-hidden">
//     {/* NEURAL BACKGROUND NETWORK */}
//     <div className="absolute inset-0 pointer-events-none overflow-hidden">
//       <div className="absolute inset-0 bg-gradient-radial from-green-900/20 via-[var(--bg-main)] to-black/80" />
      
//       {/* Floating Neural Nodes */}
//       {[...Array(8)].map((_, i) => (
//         <motion.div
//           key={`node-${i}`}
//           className="absolute w-2 h-2 bg-green-400/60 rounded-full shadow-lg"
//           initial={{ 
//             x: Math.random() * window.innerWidth, 
//             y: Math.random() * window.innerHeight 
//           }}
//           animate={{
//             y: [null, -150 - Math.random() * 100],
//             x: [null, (Math.random() - 0.5) * 100],
//             opacity: [0, 1, 0.7, 0],
//           }}
//           transition={{
//             duration: 4 + Math.random() * 3,
//             repeat: Infinity,
//             delay: Math.random() * 3,
//             ease: "easeOut"
//           }}
//           style={{
//             boxShadow: "0 0 20px rgba(34, 197, 94, 0.8)",
//             filter: "blur(0.5px)"
//           }}
//         />
//       ))}

//       {/* Connection Lines */}
//       {[...Array(4)].map((_, i) => (
//         <motion.div
//           key={`line-${i}`}
//           className="absolute w-px bg-gradient-to-b from-green-400/50 to-transparent"
//           style={{
//             left: `${20 + i * 20}%`,
//             height: "100%",
//             filter: "blur(0.8px)"
//           }}
//           animate={{ opacity: [0.3, 0.8, 0.3] }}
//           transition={{ duration: 2 + i * 0.5, repeat: Infinity }}
//         />
//       ))}
//     </div>

//     {/* === RINGING SCREEN: EPIC CINEMATIC INCOMING === */}


//     {/* === ACTIVE CALL: FUTURISTIC VIDEO GRID === */}
//     {!isRinging && activeCall && activeCall?.participants?.find((id) => id === selectedUser._id) && (
//       <>
//         <div className="flex-1 relative overflow-hidden">
//           {activeCall?.type === 'video' ? (
//             <div className={`grid h-full ${totalParticipants === 1 ? 'grid-cols-1' : totalParticipants <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-3 p-3`}>
//               {remoteParticipantStreams.map(([id, stream]) => {
//                 const user = participants.find(p => p._id === id);
//                 const isActive = activeSpeakerId === id;
//                 return (
//                   <motion.div
//                     key={id}
//                     layout
//                     initial={{ opacity: 0, scale: 0.7, rotateY: 30 }}
//                     animate={{ opacity: 1, scale: 1, rotateY: 0 }}
//                     exit={{ opacity: 0, scale: 0.8 }}
//                     transition={{ type: "spring", stiffness: 300 }}
//                     className={`relative rounded-3xl overflow-hidden ${isActive ? 'ring-4 ring-green-400 ring-offset-4 ring-offset-black' : ''} shadow-2xl`}
//                     whileHover={{ scale: 1.03, zIndex: 10 }}
//                     style={{
//                       background: "linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.1))",
//                       backdropFilter: "blur(12px)"
//                     }}
//                   >
//                     <video autoPlay playsInline srcObject={stream} className="w-full h-full object-cover" />
                    
//                     {/* Holographic Nameplate */}
//                     <motion.div
//                       initial={{ y: 30, opacity: 0 }}
//                       animate={{ y: 0, opacity: 1 }}
//                       className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-xl text-white px-4 py-2 rounded-full text-sm font-bold border border-white/30"
//                       style={{ textShadow: "0 0 10px rgba(0,0,0,0.8)" }}
//                     >
//                       {user?.fullName?.split(' ')[0]}
//                     </motion.div>

//                     {user?.muted && (
//                       <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
//                         <MicOffIcon className="absolute top-4 right-4 text-red-400 drop-shadow-lg" size={26} />
//                       </motion.div>
//                     )}

//                     {/* Active Speaker Aura */}
//                     {isActive && (
//                       <>
//                         <motion.div
//                           animate={{ opacity: [0.4, 1, 0.4] }}
//                           transition={{ repeat: Infinity, duration: 1.2 }}
//                           className="absolute inset-0 ring-4 ring-green-400 pointer-events-none rounded-3xl"
//                           style={{ filter: "blur(8px)" }}
//                         />
//                         <motion.div
//                           animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
//                           transition={{ repeat: Infinity, duration: 1 }}
//                           className="absolute -inset-2 rounded-3xl bg-green-400 pointer-events-none"
//                           style={{ filter: "blur(20px)" }}
//                         />
//                       </>
//                     )}
//                   </motion.div>
//                 );
//               })}

//               {/* LOCAL PIP WITH MAGNETIC HOVER */}
//               <motion.div
//                 drag
//                 dragElastic={0.2}
//                 dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
//                 whileHover={{ scale: 1.2, zIndex: 100 }}
//                 whileDrag={{ scale: 1.1 }}
//                 className="absolute bottom-8 right-8 w-40 h-56 rounded-3xl overflow-hidden border-4 border-white/60 shadow-2xl backdrop-blur-xl cursor-move"
//                 style={{
//                   boxShadow: "0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(34,197,94,0.3)",
//                   background: "rgba(255,255,255,0.1)"
//                 }}
//               >
//                 <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
//                 <div className="absolute bottom-2 left-2 text-xs font-bold bg-gradient-to-r from-green-500 to-cyan-500 text-transparent bg-clip-text">
//                   YOU
//                 </div>
//                 <div className="absolute inset-0 ring-2 ring-white/30 rounded-3xl pointer-events-none" />
//               </motion.div>
//             </div>
//           ) : (
//             /* VOICE CALL - EPIC AVATAR CORE */
//             <div className="flex flex-col items-center justify-center h-full relative">
//               <motion.div
//                 animate={{ 
//                   scale: [1, 1.08, 1],
//                   rotateZ: [0, 3, -3, 0]
//                 }}
//                 transition={{ repeat: Infinity, duration: 5 }}
//                 className="w-64 h-64 rounded-full overflow-hidden ring-8 ring-[var(--color-primary)]/70 ring-offset-12 ring-offset-black shadow-2xl relative"
//                 style={{
//                   boxShadow: "0 0 100px rgba(34, 197, 94, 0.8), inset 0 0 60px rgba(255,255,255,0.2)"
//                 }}
//               >
//                 <img src={selectedUser.profilePic} className="w-full h-full object-cover" />
//                 <motion.div
//                   animate={{ rotate: -360 }}
//                   transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
//                   className="absolute inset-0 rounded-full border-t-8 border-[var(--color-primary)] opacity-50"
//                   style={{ filter: "blur(2px)" }}
//                 />
//               </motion.div>

//               <motion.h3
//                 style={{ color: selectedUser.color || "#22c55e" }}
//                 className="text-5xl capitalize font-black mt-8 tracking-tighter"
//                 animate={{ 
//                   textShadow: [
//                     "0 0 15px currentColor, 0 0 40px currentColor",
//                     "0 0 50px currentColor, 0 0 100px currentColor",
//                     "0 0 15px currentColor, 0 0 40px currentColor"
//                   ]
//                 }}
//                 transition={{ repeat: Infinity, duration: 2.5 }}
//               >
//                 {selectedUser.fullName}
//               </motion.h3>

//               {(activeCall.status === 'ringing' || activeCall.status === 'ongoing') && (
//                 <p className="text-green-400 text-xl capitalize mt-3 animate-pulse font-medium tracking-widest">
//                   {activeCall.status === 'ringing' ? 'CONNECTING...' : 'LIVE'}
//                 </p>
//               )}
//               {activeCall.status === 'ongoing' && (
//                 <motion.span
//                   initial={{ scale: 0, opacity: 0 }}
//                   animate={{ scale: 1, opacity: 1 }}
//                   transition={{ type: "spring", stiffness: 400 }}
//                   className="text-3xl font-bold text-green-300 mt-5 tracking-wider"
//                   style={{ textShadow: "0 0 20px rgba(34,197,94,0.8)" }}
//                 >
//                   {formatDuration(callDuration)}
//                 </motion.span>
//               )}
//             </div>
//           )}
//         </div>

//         {/* GLASSMORPHIC TOP BAR */}
//         <motion.div
//           initial={{ y: -100, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center text-green-300 backdrop-blur-2xl bg-white/5 border-b border-white/10"
//         >
//           <div className="flex items-center gap-3 text-sm font-medium">
//             <Lock size={18} />
//             <span>END-TO-END ENCRYPTED</span>
//           </div>
//           <motion.button
//             whileHover={{ scale: 1.2, rotate: -90 }}
//             whileTap={{ scale: 0.9 }}
//             onClick={() => setIsMinimized(true)}
//             className="p-3 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 transition-all"
//           >
//             <Minimize2 size={22} />
//           </motion.button>
//         </motion.div>

//         {/* FLOATING CONTROL ORB */}
//         {(activeCall.status === "ringing" || activeCall.status === "ongoing") && (
//           <motion.div
//             initial={{ y: 200, opacity: 0 }}
//             animate={{ y: showControls ? 0 : 200, opacity: showControls ? 1 : 0 }}
//             transition={{ type: "spring", stiffness: 350, damping: 30 }}
//             className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-10 backdrop-blur-3xl"
//           >
//             <div className="flex justify-center items-center gap-8">
//               {[
//                 { onClick: toggleSpeaker, icon: Volume2 },
//                 {
//                   onClick: () => toggleMute(),
//                   icon: localStream?.getAudioTracks()[0]?.enabled ? MicIcon : MicOffIcon,
//                   active: localStream?.getAudioTracks()[0]?.enabled,
//                   bg: localStream?.getAudioTracks()[0]?.enabled ? "bg-white/20" : "bg-gradient-to-br from-red-500 to-pink-600"
//                 },
//                 ...(activeCall?.type === 'video' ? [{
//                   onClick: toggleVideo,
//                   icon: localStream?.getVideoTracks()[0]?.enabled ? VideoIcon : VideoOffIcon,
//                   active: localStream?.getVideoTracks()[0]?.enabled,
//                   bg: localStream?.getVideoTracks()[0]?.enabled ? "bg-white/20" : "bg-gradient-to-br from-purple-500 to-indigo-600"
//                 }] : []),
//                 { onClick: handleEnd, icon: PhoneIcon, bg: "bg-gradient-to-br from-red-600 to-rose-700", rotate: "rotate-135", size: 32 },
//                 ...(activeCall?.type === 'video' ? [
//                   { onClick: switchCamera, icon: Camera },
//                   { onClick: startScreenShare, icon: ScreenShare }
//                 ] : [])
//               ].map((btn, i) => (
//                 <motion.button
//                   key={i}
//                   whileHover={{ scale: 1.25, rotate: 360 }}
//                   whileTap={{ scale: 0.85 }}
//                   onClick={btn.onClick}
//                   className={`w-20 h-20 ${btn.bg || 'bg-white/20'} backdrop-blur-2xl rounded-full flex items-center justify-center shadow-2xl transition-all relative overflow-hidden`}
//                   style={{
//                     boxShadow: btn.bg?.includes('gradient') ? "0 0 40px rgba(255,255,255,0.3)" : "0 0 30px rgba(0,0,0,0.5)"
//                   }}
//                 >
//                   <motion.div
//                     animate={{ rotate: [0, -10, 10, 0] }}
//                     transition={{ duration: 2, repeat: Infinity }}
//                     className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
//                     style={{ opacity: 0.3 }}
//                   />
//                   <btn.icon size={btn.size || 28} className={`text-white ${btn.rotate || ''} drop-shadow-lg`} />
//                 </motion.button>
//               ))}
//             </div>
//           </motion.div>
//         )}
//         {/* REJECTED STATE */}
//         {activeCall.status === "rejected" && (
//           <motion.div
//             initial={{ y: 100 }}
//             animate={{ y: 0 }}
//             className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-8"
//           >
//             <div className="flex justify-center gap-8">
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={activeCall.type !== 'video' ? handleVoiceCall : handleVideoCall}
//                 className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-full flex items-center gap-3 text-xl font-bold shadow-2xl"
//               >
//                 {activeCall.type !== 'video' ? <PhoneIcon size={28} /> : <VideoIcon size={28} />}
//                 Call Again
//               </motion.button>
//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 onClick={exit}
//                 className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-full flex items-center gap-3 text-xl font-bold shadow-2xl"
//               >
//                 Exit
//               </motion.button>
//             </div>
//           </motion.div>
//         )}
//       </>
//     )}
//   </div>
// )
};

export default CallInterface;