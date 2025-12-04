// src/components/StatusViewer.jsx
import { useStatusStore } from "../store/useStatusStore";
import { useAuthStore } from "../store/useAuthStore";
import { FiArrowLeft, FiArrowRight, FiX, FiShare2, FiMoreVertical } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Reply, Send } from "lucide-react";

const REPLY_HEIGHT = 60;

export default function StatusViewer({ onClose }) {
  const { selectedStatusUser, currentStatusIndex, nextStatus, prevStatus, viewStatus, reactToStatus, replyToStatus } = useStatusStore();
  const { authUser } = useAuthStore();
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
//console.log(currentStatusIndex,"currentStatusIndex")
  const status = selectedStatusUser.statuses[currentStatusIndex];
  const isMyStatus = selectedStatusUser.user._id === authUser._id;
  const isLast = currentStatusIndex === selectedStatusUser.statuses.length - 1;
  const isFirst = currentStatusIndex === 0;
 
 useEffect(() => {
  viewStatus(status._id);

  // Reset progress bars
  if (progressRef.current) {
    progressRef.current.querySelectorAll('.progress-segment').forEach(seg => {
      seg.style.transition = 'none';
      seg.style.width = '0%';
    });
    // Force reflow
    progressRef.current.offsetHeight;
  }

  const timer = setTimeout(() => {
    if (!showReply && isLast) {
      onClose();
    } else if (!showReply) {
      nextStatus();
    }
  }, status.type === "video" ? (status.duration || 30) * 1000 : 5000);

  return () => clearTimeout(timer);
}, [currentStatusIndex, status._id]);

  useEffect(() => {
    if (status.type === "video" && videoRef.current) {
      videoRef.current.play();
    }
  }, [status]);

  const sendReply = () => {
    if (!replyText.trim()) return;
    replyToStatus(status._id, replyText);
    setReplyText("");
    setShowReply(false);
  };

  function getRelativeLabel(date) {
  const now = new Date();
  const msgDate = new Date(date);
  const diffTime = now - msgDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  }

  return (
    <div 
        
     className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between text-[var(--text-primary)] mb-2">
        <button onClick={onClose} className="btn btn-circle btn-ghost">
          <FiX size={24} />
        </button>
        <div className="flex-1 px-4">
          <p style={{color: selectedStatusUser.user.color}} className="capitalize font-medium truncate">{selectedStatusUser.user.fullName}</p>
          <p className="text-xs opacity-90 text-[var(--text-primary)]">{ getRelativeLabel(new Date(status.createdAt))}, {format(new Date(status.createdAt), "h:mm a")}</p>
        </div>
        <button className="btn btn-circle btn-ghost">
          <FiMoreVertical size={20} />
        </button>
      </div>

      {/* Progress Bar */}
      <div ref={progressRef} className="absolute z-50 top-14 left-0 right-0 flex gap-1 p-2">
  {selectedStatusUser.statuses.map((_, i) => (
    <div key={i} className="progress-segment flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
      <div
        className={`h-full bg-white ${
          i === currentStatusIndex
            ? 'animate-progress'
            : i < currentStatusIndex
            ? 'w-full'
            : 'w-0'
        }`}
        style={{
          width: i === currentStatusIndex ? '0%' : i < currentStatusIndex ? '100%' : '0%',
          animationDuration:
            i === currentStatusIndex
              ? `${status.type === 'video' ? (status.duration || 30) : 5}s`
              : '0s',
        }}
      />
    </div>
  ))}
</div>

      {/* Media */}
      <div className="flex-1 flex items-center justify-center relative">
        {status.type === "image" && (
          <img src={status.content} className="max-h-[70vh] bg-red-500 max-w-full object-contain" />
        )}
        {status.type === "video" && (
          <video ref={videoRef} src={status.content} loop muted className="max-w-full max-h-full object-contain" />
        )}
        {status.type === "text" && (
          <div
            className="w-full h-full flex items-center justify-center p-8 text-center"
            style={{ backgroundColor: status.backgroundColor }}
          >
            <p className={`text-3xl ${status.fontStyle} break-words`} style={{ color: status.textColor }}>
              {status.caption}
            </p>
          </div>
        )}
        {status.type === "voice" && (
          <div>
          <audio src={status.content} controls autoPlay className="w-full max-w-md mb-8" />
        </div>
        )}

        {/* Caption */}
        {status.caption && (
          <div className="absolute bottom-20 left-4 right-4 bg-black/50 backdrop-blur text-[var(--text-primary)] p-3 text-center rounded-xl">
            <p>{status.caption}</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-all ${showReply ? 'h-32' : ''}`}>
        {!showReply ? (
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setShowReply(true)}
              className="btn btn-circle btn-ghost text-[var(--text-primary)]"
            >
              <Reply size={24} />
            </button>
            <div className="flex gap-2">
              {["like", "heart", "laughing", "surprised", "sad", "thanks"].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => reactToStatus(status._id, emoji)}
                  className="text-2xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {!isMyStatus && (
              <button className="btn btn-circle btn-ghost text-[var(--text-primary)]">
                <FiShare2 size={24} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendReply()}
              placeholder="Reply..."
              className="flex-1 input input-bordered rounded-full"
            />
            <button onClick={sendReply} className="btn btn-circle btn-primary">
              <Send />
            </button>
          </div>
        )}
      </div>
{isMyStatus && (
  <div className="absolute top-16 left-4 bg-black/70 text-[var(--text-primary)] p-3 rounded-xl max-h-64 overflow-y-auto">
    <p className="font-bold mb-2">{status.viewedBy.filter((views) => views.userId._id !== authUser._id ).length} viewed</p>
    {status.viewedBy.filter((views) => views.userId._id !== authUser._id ).map(v => (
      <div key={v.userId._id} className="flex items-center gap-2 text-xs">
        <img src={v.userId.profilePic} className="size-6 rounded-full" />
        <span className="capitalize">{v.userId.fullName}</span>
      </div>
    ))}
    </div>
)}
      {/* Navigation Arrows */}
      {!isFirst && (
        <button
          onClick={prevStatus}
          className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost text-[var(--text-primary)]"
        >
          <FiArrowLeft size={28} />
        </button>
      )}
      {!isLast && (
        <button
          onClick={nextStatus}
          className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost text-[var(--text-primary)]"
        >
          <FiArrowRight size={28} />
        </button>
      )}
    </div>
  );
}