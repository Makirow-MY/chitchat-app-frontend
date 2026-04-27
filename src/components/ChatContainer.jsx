import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { FileIcon, PlayIcon, PauseIcon, DownloadIcon, MaximizeIcon, EllipsisVertical, Reply, CopyIcon, Edit2Icon, ForwardIcon, StarIcon, PinIcon, DeleteIcon, Trash2Icon, Star, SaveIcon, StarOff, Forward, LoaderIcon, Delete, PhoneIcon, Share2Icon, Send, VideoIcon, PhoneOff, Minimize2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import InforArea from "./InforArea";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { MdAttachFile, MdCancel, MdChatBubble, MdEmojiEmotions, MdReport } from "react-icons/md";
import { IoDocument, IoImage, IoMicOff, IoMicSharp, IoVideocam, IoWarning } from "react-icons/io5";
import { FaCheck, FaPlus, FaSearch, FaStar, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { IoExit, IoStarOutline } from "react-icons/io5";
import { FiX } from "react-icons/fi";
import { useCallStore } from "../store/useCallStore";
import CallInterface from "./CallInterface";
import { useThemeStore } from "../store/useThemeStore";
import { AnimatePresence, motion } from "framer-motion";

function getOrdinal(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

const AudioPlayer = ({ attachment }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.duration || 0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(new Audio(attachment.attachmentUrl));
  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'metadata';
    audio.playbackRate = speed;
    const updateDuration = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        setDuration(0);
      }
    };
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('error', () => {
      setDuration(0);
    });
    audio.load();
    const timeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    audio.addEventListener('timeupdate', timeUpdate);
    audio.addEventListener('ended', () => setPlaying(false));
    const pauseListener = (e) => {
      if (e.detail && e.detail.except !== audio && playing) {
        audio.pause();
        setPlaying(false);
      }
    };
    document.addEventListener('pauseMedia', pauseListener);
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('error', () => setDuration(0));
      audio.removeEventListener('timeupdate', timeUpdate);
      audio.removeEventListener('ended', () => setPlaying(false));
      document.removeEventListener('pauseMedia', pauseListener);
    };
  }, [speed, attachment.attachmentUrl]);
  const togglePlay = () => {
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
    } else {
      document.dispatchEvent(new CustomEvent('pauseMedia', { detail: { except: audio } }));
      audio.play();
    }
    setPlaying(!playing);
  };
  const handleSeek = (e) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = time;
    setProgress(parseFloat(e.target.value));
  };
  const handleSpeedChange = (e) => {
    setSpeed(parseFloat(e.target.value));
  };
  const formatTime = (time) => {
    if (!Number.isFinite(time) || Number.isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };
  const handleAudioDownload = async () => {
    try {
      const response = await fetch(attachment.attachmentUrl);
      const blob = await response.blob();
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = attachment.originalName || 'audio';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download audio");
    }
  };
  const generateDocumentThumbnail = (file, ext) => {
    const fileTypeIcons = {
      pdf: 'https://cdn-icons-png.flaticon.com/512/337/337946.png',
      doc: 'https://img.icons8.com/?size=100&id=pGHcje298xSl&format=png&color=000000',
      docx: 'https://cdn-icons-png.flaticon.com/512/337/337932.png',
      xls: 'https://cdn-icons-png.flaticon.com/512/337/337956.png',
      xlsx: 'https://cdn-icons-png.flaticon.com/512/337/337956.png',
      ppt: 'https://img.icons8.com/?size=100&id=ifP93G7BXUhU&format=png&color=000000',
      pptx: 'https://img.icons8.com/?size=100&id=ifP93G7BXUhU&format=png&color=000000',
      js: 'https://img.icons8.com/?size=100&id=PXTY4q2Sq2lG&format=png&color=000000',
      json: 'https://img.icons8.com/?size=100&id=SrDTEN0d3OPH&format=png&color=000000',
      c: 'https://img.icons8.com/?size=100&id=ifP93G7BXUhU&format=png&color=000000',
      php: 'https://img.icons8.com/?size=100&id=pKaVdzbCJGgA&format=png&color=000000',
      exe: 'https://img.icons8.com/?size=100&id=aqDSvbRDAhQi&format=png&color=000000',
      rtf: 'https://cdn-icons-png.flaticon.com/512/337/337907.png',
      zip: 'https://img.icons8.com/?size=100&id=PLvn50bVGAlA&format=png&color=000000',
      psd: 'https://cdn-icons-png.flaticon.com/512/337/337940.png',
      txt: 'https://img.icons8.com/?size=100&id=50nDvbuc0xFF&format=png&color=000000',
      mkv: 'https://img.icons8.com/?size=100&id=Kih6SqIrbdzh&format=png&color=000000',
      rar: 'https://img.icons8.com/?size=100&id=yxSKT8l5rvS6&format=png&color=000000',
       mp3: 'https://img.icons8.com/?size=100&id=CWZOl3WNER6r&format=png&color=000000',
       mp4: 'https://img.icons8.com/?size=100&id=CWZOl3WNER6r&format=png&color=000000'
    };
    return fileTypeIcons[ext] || 'https://img.icons8.com/?size=100&id=Hku9UaGJ7edj&format=png&color=000000';
  };
  const audioIcon = 'audio-file.png'
  return (
    <div className="bg-[var(--bg-secondary)] p-2 rounded-lg w-full">
      <div className="flex items-center gap-2">
        <div className="relative">
          <img src={attachment.preview || generateDocumentThumbnail(null, "mp4")} alt="audio preview" className="w-12 h-12 rounded" />
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[var(--text-primary)] bg-black/50 rounded-full p-1 cursor-pointer opacity-0 hover:opacity-100"
          >
            {playing ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
          </button>
        </div>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleSeek}
            className="w-full accent-cyan-600 outline-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex justify-start text-xs text-[var(--text-secondary)]">
              <span>{formatTime(currentTime)}</span> /
              <span>{duration > 0 ? formatTime(duration) : '0:00'}</span>
            </div>
            <button
              onClick={handleAudioDownload}
              className="text-[var(--text-secondary)] hover:text-cyan-400"
            >
              <DownloadIcon size={16} />
            </button>
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">{truncatePar(attachment.originalName, 25)}</p>
    </div>
  );
};
// src/components/CallMessage.jsx
const CallMessage = ({ attachment, msg }) => {
 const { authUser } = useAuthStore();
 const attachmentLength =  msg?.attachments?.length
  // const { callStates } = useCallStore();
  // const [liveText, setLiveText] = useState("");
  // const [liveIcon, setLiveIcon] = useState(null);

  // const callId = attachment.callId;
 // console.log(msg)
  const stage = msg?.attachments[attachmentLength - 1]?.mimeType;
   const senderId = typeof msg.senderId === "string" ? msg.senderId : (msg?.senderId?._id ? msg?.senderId?._id.toString() : '');
                     const isOwnMessage = senderId === authUser._id.toString();
                      
  // const duration = attachment.duration || 0;
  // const userState = callStates[callId]?.[authUser._id];

  // useEffect(() => {
  //   if (!userState) {
  //     // Fallback to attachment stage
  //     const fallback = getFallbackText();
  //     setLiveText(fallback.text);
  //     setLiveIcon(fallback.icon);
  //     return;
  //   }

  //   setLiveText(userState);
  //   setLiveIcon(getIconForState(userState));
  // }, [userState, stage]);

  // const getIconForState = (text) => {
  //   if (text.includes("calling") || text.includes("Ringing")) return <PhoneIcon className="animate-pulse" />;
  //   if (text.includes("joined")) return <UserCheck />;
  //   if (text.includes("ended")) return <Clock />;
  //   if (text.includes("missed") || text.includes("declined")) return <UserX className="text-red-500" />;
  //   return <PhoneIcon />;
  // };

  // const getFallbackText = () => {
  //   if (stage === "initiated") return { text: "Call started", icon: <PhoneIcon /> };
  //   if (stage === "accepted") return { text: "Call connected", icon: <UserCheck /> };
  //   if (stage === "ended") return { text: `Call ended • ${formatDuration(duration)}`, icon: <Clock /> };
  //   if (stage === "missed") return { text: "Missed call", icon: <UserX className="text-red-500" /> };
  //   return { text: "Call", icon: <PhoneIcon /> };
  // };

  // const formatDuration = (secs) => {
  //   const m = String(Math.floor(secs / 60)).padStart(2, "0");
  //   const s = String(secs % 60).padStart(2, "0");
  //   return `${m}:${s}`;
  // };

  const isVideo = attachment.preview === "voice";

  return (
    <div className={` ${isOwnMessage ? 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-main)] hover:underline' : 'bg-[var(--color-primary-hover)]'}  backdrop-blur p-4 rounded-xl flex items-center gap-4  transition-all `}>
      <div className="relative flex items-center gap-2 w-full flex-shrink-0">
        <div className="w-10 h-10 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
          {attachment.preview !== "voice" ? <VideoIcon size={20} className="text-[var(--text-primary)]" /> :  <PhoneIcon size={20} className="text-[var(--text-primary)] " />}
        </div>
        
        {stage === "ringing" && (
          <div className="absolute inset-0 rounded-full border-4 border-[var(--border)] animate-ping"></div>
        )}
        <div>
<h2 className="text-sm text-[var(--text-primary)] font-semibold text-nowrap ">
              {  msg.text
              } 
              </h2>
              

              {
            //msg?.attachments[attachmentLength - 1]?.mimeType === "Decline" ? 'Decline'  : "Incoming"} {msg?.attachments[attachmentLength - 1]?.preview} call
              }
            
            <p className="text-sm text-[var(--text-secondary)] capitalize">Tap to call back  </p>
    
        </div>
      
      </div>

      <div className="flex-1">
        {/* <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
          {liveIcon}
          <span>{liveText || "Call in progress..."}</span>
        </p>
        {duration > 0 && (
          <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
            <Clock size={12} />
            {formatDuration(duration)}
          </p>
        )} */}
      </div>

      {stage === "ringing" && (
        <div className="text-xs text-cyan-400 animate-pulse">● Live</div>
      )}
    </div>
  );
};
const VideoPlayer = ({ attachment }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(attachment.duration || 0);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
      const updateDuration = () => {
        if (!isNaN(video.duration)) {
          setDuration(video.duration);
        }
      };
      video.addEventListener('loadedmetadata', updateDuration);
      if (isNaN(video.duration)) {
        video.load();
      } else {
        updateDuration();
      }
      const timeUpdate = () => {
        setCurrentTime(video.currentTime);
        setProgress((video.currentTime / video.duration) * 100 || 0);
      };
      video.addEventListener('timeupdate', timeUpdate);
      video.addEventListener('ended', () => setPlaying(false));
      video.addEventListener('fullscreenchange', () => setFullscreen(document.fullscreenElement === video));
      const pauseListener = (e) => {
        if (e.detail && e.detail.except !== video && playing) {
          video.pause();
          setPlaying(false);
        }
      };
      document.addEventListener('pauseMedia', pauseListener);
      return () => {
        video.pause();
        video.removeEventListener('loadedmetadata', updateDuration);
        video.removeEventListener('timeupdate', timeUpdate);
        video.removeEventListener('ended', () => setPlaying(false));
        video.removeEventListener('fullscreenchange', () => setFullscreen(document.fullscreenElement === video));
        document.removeEventListener('pauseMedia', pauseListener);
      };
    }
  }, [speed, attachment.attachmentUrl]);
  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (playing) {
        video.pause();
      } else {
        document.dispatchEvent(new CustomEvent('pauseMedia', { detail: { except: video } }));
        video.play();
      }
      setPlaying(!playing);
    }
  };
  const handleSeek = (e) => {
    const video = videoRef.current;
    if (video) {
      const time = (parseFloat(e.target.value) / 100) * duration;
      video.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (video) {
      if (fullscreen) {
        document.exitFullscreen();
      } else {
        video.requestFullscreen();
      }
    }
  };
  const handleSpeedChange = (e) => {
    setSpeed(parseFloat(e.target.value));
  };
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };
  const handleVideoDownload = async () => {
    try {
      const response = await fetch(attachment.attachmentUrl);
      const blob = await response.blob();
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = attachment.originalName || 'video';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download video");
    }
  };
  return (
    <div className="relative rounded-lg overflow-hidden h-32 sm:h-48">
      <video
        ref={videoRef}
        src={attachment.attachmentUrl}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 flex items-center gap-2 text-[var(--text-primary)] text-xs">
        <button onClick={togglePlay} className="hover:text-cyan-400">
          {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={handleSeek}
          className="flex-1 accent-cyan-600"
        />
        <span>{formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : 'Loading...'}</span>
        <select
          value={speed}
          onChange={handleSpeedChange}
          className="bg-[var(--bg-secondary)] rounded px-1"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
        <button onClick={toggleFullscreen} className="hover:text-cyan-400">
          <MaximizeIcon size={16} />
        </button>
        <button onClick={handleVideoDownload} className="hover:text-cyan-400">
          <DownloadIcon size={16} />
        </button>
      </div>
    </div>
  );
};

function formatFullDate(date) {
  const d = new Date(date);
  const weekday = d.toLocaleString('en-US', { weekday: 'long' });
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const ordinal = getOrdinal(day);
  return `${weekday} ${day}${ordinal} ${month}`;
}
function getRelativeLabel(date) {
  const now = new Date();
  const msgDate = new Date(date);
  const diffTime = now - msgDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `(${diffDays} days ago)`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `(${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago)`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `(${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago)`;
  const diffYears = Math.floor(diffDays / 365);
  return `(${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago)`;
}
const truncatePar = (word, maxword) => {
  if (!word) return "";
  return word.length <= maxword ? word : word.slice(0, maxword) + "...";
};
function ChatContainer() {
  const {
    selectedUser,
    selectedGroup,
    getMessagesByUserId,
    getMessagesByGroupId,
    messages,
    getUsersForRequest,
    setAttached,
    isMessagesLoading,
    markMessageAsRead,
    showEmojiPicker,
    setShowEmojiPicker,
    chats,
    sendFriendRequest,
    cancelRequest,
    queueAction,
    acceptRequest,
    declineRequest,
    usersForRequest,
    setSelectedUser,
    groupChats,
    setReplyTo,
    starMessage,
    setEditingMessage,
    saveMessage,
    setBlockedUsers,
    getAllContacts,
    sendGroupJoinRequest,
    allContacts,
    reportChat,
    receivedRequests,
    sentRequests,
     getReceivedRequests,
    getSentRequests,
    getUserGroups,
   targetHighlightMsgId,
    checkIsChatArchived,
    setTargetHighlightMsgId,
    clearProcessedMessageIds,
    deleteFriend,
    blockedUsers,
    setSelectedGroup,
    exitGroup,
    report,
   getIncomingCallHistory,




    incomingCall, activeCall, acceptCall, rejectCall, ringingAudio
  } = useChatStore();
  const { authUser, theme, showmedia, setShowMedia, socket, isOnline } = useAuthStore();
  const messageEndRef = useRef(null);
  const {mode} = useThemeStore()
  const messageRefs = useRef({});
   const groupRefs = useRef({});
  const observerRef = useRef(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showReactorsModal, setShowReactorsModal] = useState({ msgId: null, reactors: [] });
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const [selectedChatsForForward, setSelectedChatsForForward] = useState([]);
  const [searchGroupName, setSearchGroupName] = useState("");
  const [recentEmojis, setRecentEmojis] = useState(JSON.parse(localStorage.getItem('recentEmojis')) || ['👍', '❤️', '😂', '😢', '😡', '😮']);
  const [menuOpenForMsg, setMenuOpenForMsg] = useState(null);
const [searchQuery, setSearchQuery] = useState("");
const [matches, setMatches] = useState([]); // Array of matching msg _ids
const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
const [resultsCount, setResultsCount] = useState(0);
const [tempHighlightMsgId, setTempHighlightMsgId] = useState(null); // For pulse animation on navigation
//const { incomingCall, activeCall, acceptCall, rejectCall, ringingAudio } = useCallStore();
const handleNextMatch = () => {
  if (resultsCount === 0) return;
  const nextIndex = (currentMatchIndex + 1) % resultsCount; // Wrap around
  setCurrentMatchIndex(nextIndex);
  const nextId = matches[nextIndex];
  const ref = messageRefs.current[nextId];
  if (ref) {
    ref.scrollIntoView({ behavior: "smooth", block: "center" });
    setTempHighlightMsgId(nextId);
    setTimeout(() => setTempHighlightMsgId(null), 2000);
  }
};
const handlePrevMatch = () => {
  if (resultsCount === 0) return;
  const prevIndex = (currentMatchIndex - 1 + resultsCount) % resultsCount; // Wrap around
  setCurrentMatchIndex(prevIndex);
  const prevId = matches[prevIndex];
  const ref = messageRefs.current[prevId];
  if (ref) {
    ref.scrollIntoView({ behavior: "smooth", block: "center" });
    setTempHighlightMsgId(prevId);
    setTimeout(() => setTempHighlightMsgId(null), 2000);
  }
};
 const handleDeleteFriend = async () => {
    if (!isGroup && selectedUser?._id) {
      try {
        await deleteFriend(selectedUser._id);
      // setSelectedUser(null);
       // handleClose();
        toast.success("Friend deleted successfully");
      } catch (error) {
        toast.error("Failed to delete friend");
        console.error("Delete friend error:", error);
      }
    }
  };
const onSearchChange = (value) => {
  setSearchQuery(value);
};

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);
  const [highlightedMsg, setHighlightedMsg] = useState(null);
  useEffect(() => {
    if (socket) {
      socket.on("groupTerminated", ({ groupId }) => {
        if (selectedGroup?._id === groupId) {
          toast.error("This group has been terminated");
          useChatStore.getState().updateGroupStatus(groupId, { terminated: true });
        }
      });
      socket.on("typing", ({ chatId, userId, userName, isGroup, roomId }) => {
        if ((selectedGroup && isGroup && selectedGroup._id === chatId) || (selectedUser && !isGroup && selectedUser._id === chatId)) {
         // useChatStore.getState().setTyping({ userId, userName, roomId });
        }
      });
      socket.on("stopTyping", ({ chatId, userId, isGroup, roomId }) => {
        if ((selectedGroup && isGroup && selectedGroup._id === chatId) || (selectedUser && !isGroup && selectedUser._id === chatId)) {
          //useChatStore.getState().setTyping(null);
        }
      });
      socket.on("groupCreated", () => {
        useChatStore.getState().getUserGroups();
      useChatStore.getState().getGroupChats(); // Refresh group chats to include new group with system recentMessage
    });
      socket.on("groupJoined", ({ groupId, groupName, roomId }) => {
          useChatStore.getState().getUserGroups();
          useChatStore.getState().getGroupJoinRequests(groupId);
          toast.success(`Joined group: ${groupName}`);
          socket.emit("join_groups", [roomId]);
        });
         socket.on("user_unblocked", ({userId, unblockedBy, roomId }) => {
        const authUser = useAuthStore.getState().authUser;
        if (unblockedBy === authUser._id) {
          // I unblocked: Local toast (store handles state)
          toast.success("User unblocked successfully");
        } else if (userId === authUser._id && selectedUser?._id === unblockedBy) {
          // I was unblocked, chat open
          toast.success("You have been unblocked by this user");
          useChatStore.getState().setSelectedUser({
            ...selectedUser,
            roomId,
            blockedUsers: (selectedUser.blockedUsers || []).filter((id) => id !== authUser._id),
          });
        }
        setBlockedUsers(get().blockedUsers.filter((id) => id !== userId)); // Sync local
        getAllContacts(); // Refresh
              });
         socket.on("user_blocked", ({userId, blockedBy, roomId }) => {
        const authUser = useAuthStore.getState().authUser;
       if(report) {
         localStorage.setItem("reportChat", report)
         }
        if (blockedBy === authUser._id) {
          // I blocked: Local toast
          toast.success("User blocked successfully");
        } else if (userId === authUser._id && selectedUser?._id === blockedBy) {
          // I am blocked, chat open
          toast.success("You have been blocked by this user");
          useChatStore.getState().setSelectedUser({
            ...selectedUser,
            roomId,
            blockedUsers: [...(selectedUser.blockedUsers || []), authUser._id],
          });
        }
        setBlockedUsers([...get().blockedUsers, userId]); // Sync local
        getAllContacts(); // Refresh
          });
      return () => {
         socket.off("user_blocked");
        socket.off("user_unblocked");
        socket.off("groupTerminated");
        socket.off("typing");
        socket.off("stopTyping");
        socket.off("groupCreated");
        socket.off("groupJoined");
      };
    }
  }, [socket, selectedGroup, selectedUser, report]);
  const debounceMarkAsRead = useCallback(
    (msgIds, groupId = null) => {
      if (msgIds.length > 0 && isOnline) {
        markMessageAsRead(msgIds, groupId);
      }
    },
    [markMessageAsRead, isOnline]
  );
  const handleDownload = async (url, name) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };
  const updateRecentEmojis = (emoji) => {
    let updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 6);
    setRecentEmojis(updated);
    localStorage.setItem('recentEmojis', JSON.stringify(updated));
  };
  const handleReplyClick = (msgId) => {
    const originalMsgRef = messageRefs.current[msgId];
    if (originalMsgRef) originalMsgRef.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const [showCalendar, setShowCalendar] = useState(false);
  const handleMenuClick = (msgId) => {
    setMenuOpenForMsg(menuOpenForMsg === msgId ? null : msgId);
  };
  const handleReactionClick = (msgId, emoji) => {
    useChatStore.getState().reactToMessage(msgId, emoji);
    updateRecentEmojis(emoji);
    setMenuOpenForMsg(null);
  };
  const handleShowReactors = async (msgId) => {
    try {
      const res = await axiosInstance.get(`/messages/reactions/${msgId}`);
      const reactors = res.data.map(r => ({ userId: r.userId._id, emoji: r.emoji, name: r.userId.fullName }));
      setShowReactorsModal({ msgId, reactors });
    } catch (error) {
      toast.error("Failed to fetch reactors");
    }
  };
    const handleReactors = async (emojies) => {
   let emojiesA = []
  };
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };
  const handleSave = (msgId) => {
    saveMessage(msgId);
    toast.success("Message saved");
  };
  const toggleMultiSelect = (msg) => {
    if (selectedMessages.length >= 5) {
      toast.error("Max 5 messages can be selected");
      return;
    }
    if (multiSelectMode) {
      setSelectedMessages((prev) => prev.includes(msg._id) ? prev.filter(id => id !== msg._id) : [...prev, msg._id]);
    } else {
      setMultiSelectMode(true);
      setSelectedMessages([msg._id]);
    }
  };
  const toggleForwardChat = (chatId) => {
    if (selectedChatsForForward.length >= 5) {
      toast.error("Max 5 chats");
      return;
    }
    setSelectedChatsForForward(prev => prev.includes(chatId) ? prev.filter(id => id._id !== chatId._id) : [...prev, chatId]);
  };
    const toggleShareChat = (chatId) => {
    if (selectedChatsForForward.length >= 5) {
      toast.error("Max 5 chats");
      return;
    }
    setSelectedChatsForForward(prev => prev.includes(chatId) ? prev.filter(id => id._id !== chatId._id) : [...prev, chatId]);
  };
  const handleForward = () => {
    if (selectedMessages.length > 5) return toast.error("Max 5 messages");
    setForwardModalOpen(true);
  };
  const handleDelete = async (msgIds, everyone = false) => {
    const msg = messages.find(m => m._id === msgIds[0]);
    const isGroup = !!selectedGroup;
    const chatId = isGroup ? selectedGroup._id : selectedUser._id;
    const isArchived = await checkIsChatArchived(chatId, isGroup);
    if (isArchived) {
      toast.error("Cannot delete messages in archived chats");
      return;
    }
    const forEveryone = everyone;
   
  
    setShowDel(null)
  useChatStore.getState().deleteMessage(msgIds, forEveryone);
    setMultiSelectMode(false);
    setSelectedMessages([]);
  };
 const [downloadedFiles, setDownloadedFiles] = useState({});
 const [ShowPin, setShowPin] = useState(null);
const [ShowDel, setShowDel] = useState(null);
 const handlePin = async (msgId) => {
    const msg = messages.find(m => m._id === msgId);
    const chatId = selectedGroup ? selectedGroup._id : selectedUser._id;
    const isGroup = !!selectedGroup;
    const isArchived = await checkIsChatArchived(chatId, isGroup);
    if (isArchived) {
      toast.error("Cannot pin messages in archived chats");
      return;
    }
    if (msg.pinnedUntil) {
      useChatStore.getState().unpinMessage(msgId);
    } else {
     setShowPin(msgId)
    }
    setMenuOpenForMsg(null);
  };
  const handleStar = (msgId) => {
    starMessage(msgId);
    setMenuOpenForMsg(null);
  };
  const handleEdit = async (msgId) => {
    const msg = messages.find(m => m._id === msgId._id);
    const chatId = selectedGroup ? selectedGroup._id : selectedUser._id;
    const isGroup = !!selectedGroup;
    const isArchived = await checkIsChatArchived(chatId, isGroup);
    if (isArchived) {
      toast.error("Cannot edit messages in archived chats");
      return;
    }
    if (msg.senderId._id !== authUser._id) return toast.error("Only sender can edit");
    setEditingMessage(msg);
    setMenuOpenForMsg(null);
  };
  const handleReact = (msgId, emojiObject) => {
    useChatStore.getState().reactToMessage(msgId, emojiObject.emoji);
    updateRecentEmojis(emojiObject.emoji);
    setShowReactionPicker(null);
  };
  const handleForwardConfirm = async () => {
    if (selectedChatsForForward.length === 0) return toast.error("Cannot forward message(s), no chat selected");
    if (selectedChatsForForward.length > 5) return toast.error("Max 5 chats");
     toast.loading("Message forwarding in process")
    try {
      const tempforwardmess = selectedMessages
      const tempforwardchat = selectedChatsForForward
    setMultiSelectMode(false);
    setSelectedMessages([]);
    setForwardModalOpen(false);
    setSelectedChatsForForward([]);
  
      await useChatStore.getState().forwardMessages(tempforwardmess, tempforwardchat);
      toast.dismiss()
      toast.success("Messages forwarded successfully");
    } catch (error) {
      toast.dismiss()
      console.error("Failed to forward messages", error)
      toast.error("Failed to forward messages");
    }
    setMultiSelectMode(false);
    setSelectedMessages([]);
    setForwardModalOpen(false);
    setSelectedChatsForForward([]);
  };
   const handleShareConfirm = async () => {
    if (selectedChatsForForward.length === 0) return toast.error("Cannot forward message(s), no chat selected");
    if (selectedChatsForForward.length > 5) return toast.error("Max 5 chats");
     toast.loading("Message Sending in process")
    try {
      const tempforwardchat = selectedChatsForForward
   
      setShareModalOpen(false);
    setSelectedChatsForForward([]);
  
      await useChatStore.getState().shareMessages(selectedUser, tempforwardchat);
      toast.dismiss()
      toast.success("Messages shared successfully");
    } catch (error) {
      toast.dismiss()
      console.error("Failed to forward messages", error)
      toast.error("Failed to forward messages");
    }
    setMultiSelectMode(false);
    setSelectedMessages([]);
    setForwardModalOpen(false);
    setSelectedChatsForForward([]);
  };
  // NEW: State for report modal
  
useEffect(() => {
    clearProcessedMessageIds();
    if (selectedUser) {
      getMessagesByUserId(selectedUser._id);
       getAllContacts();
    getReceivedRequests();
    getUsersForRequest()
    getSentRequests();
    getIncomingCallHistory(selectedUser._id, "ringing")
    getIncomingCallHistory(selectedUser._id, "rejected")
    getIncomingCallHistory(selectedUser._id, 'missed')
      
    } else if (selectedGroup) {
      getMessagesByGroupId(selectedGroup._id);
      getIncomingCallHistory(selectedGroup._id, 'ringing')
      getIncomingCallHistory(selectedGroup._id, 'rejected')
      getIncomingCallHistory(selectedGroup._id, 'missed')
        getAllContacts();
        getUsersForRequest()
    getReceivedRequests();
    getSentRequests();
    }
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [selectedUser, selectedGroup,getReceivedRequests,getSentRequests, getMessagesByUserId, getMessagesByGroupId, clearProcessedMessageIds, getIncomingCallHistory]);
  useEffect(() => {
    if (!selectedUser && !selectedGroup) return;
    if (isMessagesLoading) return;
    const safeMessages = Array.isArray(messages) ? messages : [];
//const sortedMessages = [...safeMessages]
    const unreadMsgIds = safeMessages
      .filter((msg) => {
        const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id.toString();
        return (
          senderId !== authUser._id.toString() &&
          !msg.readBy.some((r) => r.userId.toString() === authUser._id.toString())
        );
      })
      .map((msg) => msg._id);
    if (unreadMsgIds.length > 0) {
      debounceMarkAsRead(unreadMsgIds, selectedGroup?._id || null);
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleMessageIds = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const msgId = entry.target.dataset.msgId;
            const message = messages.find((m) => m._id.toString() === msgId);
            if (message) {
              const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id.toString();
              if (
                senderId !== authUser._id.toString() &&
                !message.readBy.some((r) => r.userId.toString() === authUser._id.toString())
              ) {
                visibleMessageIds.push(msgId);
              }
            }
          }
        });
        if (visibleMessageIds.length > 0) {
          debounceMarkAsRead(visibleMessageIds, selectedGroup?._id || null);
        }
      },
      { threshold: 0.5 }
    );
    Object.values(messageRefs.current).forEach((ref) => {
      if (ref) observerRef.current.observe(ref);
    });
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, authUser._id, debounceMarkAsRead, isMessagesLoading, selectedUser, selectedGroup]);
  useEffect(() => {
    if (messageEndRef.current && !isMessagesLoading) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isMessagesLoading]);
  const safeMessages = Array.isArray(messages) ? messages : [];
const sortedMessages = [...safeMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const groupedMessages = sortedMessages.reduce((acc, msg) => {
    const dateKey = new Date(msg.createdAt).toISOString().split('T')[0];
    let group = acc.find((g) => g.dateKey === dateKey);
    if (!group) {
      group = { dateKey, messages: [] };
      acc.push(group);
    }
    group.messages.push(msg);
    return acc;
  }, []);
  useEffect(() => {
  if (groupedMessages
   && targetHighlightMsgId
    && !isMessagesLoading) {
   const selctedm = messages.find((message) => message.text.trim() == targetHighlightMsgId.trim())
  console.log(selctedm, "selctedm", targetHighlightMsgId)
   const msgRef = messageRefs.current[selctedm._id];
    if (msgRef) {
      msgRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsg(selctedm._id);
      setTimeout(() => {
        setHighlightedMsg(null);
        setTargetHighlightMsgId(null);
      }, 5000); // Highlight for 3 seconds
    }
  }
}, [targetHighlightMsgId, isMessagesLoading]);
 const handleJoinRequest = async (joinGroupId) => {
    if (!joinGroupId.trim()) {
      toast.error("Group ID is required");
      return;
    }
    if (!isOnline) {
      queueAction({ type: "sendGroupJoinRequest", groupId: joinGroupId });
      toast.success("Join request queued for when online");
     
      return;
    }
    const toastId = toast.loading("Sending join request...");
    try {
     await sendGroupJoinRequest(joinGroupId);
      toast.dismiss(toastId);
      getUserGroups();
    toast.success("Join request sent successfully");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Failed to send join request");
      console.error("Join request error:", error);
    }
  };const highlightText = (text, query) => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/\s+/g, "\\s*").replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
};
const highlightQuery = (text, query) => {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-yellow-400 text-inherit font-medium px-1 rounded">
        {part}
      </span>
    ) : (
      <span key={i} className="text-inherit">{part}</span>
    )
  );
};
  const generateDocumentThumbnail = (file, ext) => {
    const fileTypeIcons = {
      pdf: 'https://cdn-icons-png.flaticon.com/512/337/337946.png',
      doc: 'https://img.icons8.com/?size=100&id=pGHcje298xSl&format=png&color=000000',
      docx: 'https://cdn-icons-png.flaticon.com/512/337/337932.png',
      xls: 'https://cdn-icons-png.flaticon.com/512/337/337956.png',
      xlsx: 'https://cdn-icons-png.flaticon.com/512/337/337956.png',
      ppt: 'https://img.icons8.com/?size=100&id=ifP93G7BXUhU&format=png&color=000000',
      pptx: 'https://img.icons8.com/?size=100&id=ifP93G7BXUhU&format=png&color=000000',
      js: 'https://img.icons8.com/?size=100&id=PXTY4q2Sq2lG&format=png&color=000000',
      json: 'https://img.icons8.com/?size=100&id=SrDTEN0d3OPH&format=png&color=000000',
      c: 'https://img.icons8.com/?size=100&id=ifP93G7BXUhU&format=png&color=000000',
      php: 'https://img.icons8.com/?size=100&id=pKaVdzbCJGgA&format=png&color=000000',
      exe: 'https://img.icons8.com/?size=100&id=aqDSvbRDAhQi&format=png&color=000000',
      rtf: 'https://cdn-icons-png.flaticon.com/512/337/337907.png',
      zip: 'https://img.icons8.com/?size=100&id=PLvn50bVGAlA&format=png&color=000000',
      psd: 'https://cdn-icons-png.flaticon.com/512/337/337940.png',
      txt: 'https://img.icons8.com/?size=100&id=50nDvbuc0xFF&format=png&color=000000',
      mkv: 'https://img.icons8.com/?size=100&id=Kih6SqIrbdzh&format=png&color=000000',
      rar: 'https://img.icons8.com/?size=100&id=yxSKT8l5rvS6&format=png&color=000000',
      mkv: 'https://img.icons8.com/?size=100&id=Kih6SqIrbdzh&format=png&color=000000',
      mp3: 'https://img.icons8.com/?size=100&id=erOSlN6i8sJp&format=png&color=000000'
    };
    return fileTypeIcons[ext] || 'https://img.icons8.com/?size=100&id=Hku9UaGJ7edj&format=png&color=000000';
  };
  socket.on("messageDeleted", (payload) => {
  const { msgId, deletedForEveryone, deletedBy, recentMessageUpdate, chatId, isGroup } = payload;
  // …store update…
  // Force re-render of the chat list with the new recentMessage
  //useChatStore.getState().updateChatRecentMessage(chatId, isGroup, recentMessageUpdate);
});
 
useEffect(() => {
  if (!searchQuery.trim()) {
    setMatches([]);
    setResultsCount(0);
    setCurrentMatchIndex(0);
    setTempHighlightMsgId(null);
    return;
  }
  // Escape regex special chars and allow spaces
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const queryRegex = new RegExp(escapedQuery, 'gi');
  const matchingIds = [];
  sortedMessages.forEach((msg) => {
    const deletedForMe = msg.deletedBy?.some(d => d.userId.toString() === authUser._id.toString());
    const deletedEvery = msg.deletedForEveryone;
    if (deletedForMe || deletedEvery) return;
    const textMatch = msg.text && queryRegex.test(msg.text);
    const attachMatch = msg.attachments?.some(
      (att) => att?.originalName && queryRegex.test(att.originalName)
    );
    if (msg.deletedBy && !msg.deletedBy.includes(authUser._id) && (textMatch || attachMatch)) {
      matchingIds.push(msg._id);
    }
  });
  setMatches(matchingIds);
  setResultsCount(matchingIds.length);
  setCurrentMatchIndex(0);
  // Only scroll to first on NEW search
  if (matchingIds.length > 0) {
    const firstRef = messageRefs.current[matchingIds[0]];
    if (firstRef) {
      firstRef.scrollIntoView({ behavior: "smooth", block: "center" });
      setTempHighlightMsgId(matchingIds[0]);
      setTimeout(() => setTempHighlightMsgId(null), 2000);
    }
  }
}, [searchQuery, authUser._id]);
const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  
  const allRequests = [
    ...usersForRequest.map((req) => ({ ...req, type: "notfriend" })),
    ...receivedRequests.map((req) => ({ ...req, type: "received" })),
    ...allContacts.map((contact) => ({ ...contact, type: "friend" })),    
    ...sentRequests.map((req) => ({ ...req, type: "sent" })),
  ].sort((a, b) => {
    const aPending = a.type !== "friend" ? 1 : 0;
    const bPending = b.type !== "friend" ? 1 : 0;
    if (aPending !== bPending) return bPending - aPending;
    if (a.type === "friend") {
      return (a.fullName || "").localeCompare(b.fullName || "");
    }
    return new Date(a.updatedAt) - new Date(b.updatedAt);
  });

  // NEW: Standard report reasons (like WhatsApp/Telegram)
  const reportReasons = [
    "Spam or unwanted messages",
    "Harassment or bullying",
    "Fake account or impersonation",
    "Inappropriate content",
    "Illegal activity",
    "Other"
  ];
  const [isMinimized, setIsMinimized] = useState(false);
    
  // NEW: Updated handleReportChat to open modal first
  const handleReportChat = () => {
    setDropdownOpen(false)
    setShowReportModal(!showReportModal); // Open modal instead of direct call
  };
  // NEW: Function to submit report after modal input
  const submitReport = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason");
      return;
    }
    try {
      const IsGroup = !!selectedGroup
      await reportChat(IsGroup ? selectedGroup._id: selectedUser._id, selectedReason, reportDetails); // Pass reason and details to backend
      toast.success("Chat reported successfully");
      setShowReportModal(false);
      setSelectedReason("");
      setReportDetails("");
    } catch (error) {
      toast.error("Failed to report chat");
      console.error("Report chat error:", error);
    }
  };
   const handleSendRequest = async (userId) => {
      if (!isOnline) {
        queueAction({ type: "sendFriendRequest", userId, senderId: authUser._id });
        toast.success("Friend request queued for when online");
        return;
      }
      try {
        await sendFriendRequest(userId);
      } catch (error) {
        toast.error("Failed to send friend request");
        console.error("Send request error:", error);
      }
    };

  //     const audioRef = useRef(null)
  // const timeoutRef = useRef(null)
  // useEffect(() => {
  //  if(incomingCall){ audioRef.current = new Audio("/sounds/ring.mp3");
  //   audioRef.current.loop = true;
  //   audioRef.current.play()
  //   timeoutRef.current = setTimeout(() => {
  //        if(audioRef.current)
  //        {
  //         audioRef.current.pause();
  //         audioRef.current.currentTime = 0
  //        }
  //   }, 5 * 60 *1000)}
  //   else{
  //     if(audioRef.current)
  //        {
  //         audioRef.current.pause();
  //         audioRef.current.currentTime = 0
  //        }

  //        clearTimeout(timeoutRef.current)
  //   }
  //   return () => {
  //     clearTimeout(audioRef.current)
  //     if(audioRef.current)
  //        {
  //         audioRef.current.pause();
  //        }
  //   }
  // }, [incomingCall])

  
// // console.log(incomingCall, "incomingCallinChatContainer")
// if (incomingCall && !isMinimized) {

//     return (
//        <AnimatePresence>
//       {incomingCall && (
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           exit={{ opacity: 0, scale: 0.9 }}
//           className="flex-1 flex flex-col items-center justify-center p-8 relative"
//         >
//           {/* Pulsing Avatar Ring */}
//           <motion.div
//             animate={{ scale: [1, 1.2, 1] }}
//             transition={{ repeat: Infinity, duration: 1.5 }}
//             className="w-36 h-36 rounded-full overflow-hidden mb-8 ring-8 ring-green-500/50 ring-offset-8 ring-offset-black shadow-2xl relative"
//           >
//             <img src={incomingCall.caller?.profilePic} className="w-full h-full object-cover" />
//             <motion.div
//               animate={{ rotate: 360 }}
//               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
//               className="absolute inset-0 rounded-full border-t-4 border-green-400 opacity-50"
//             />
//           </motion.div>

//           <motion.h2
//             style={{ color: incomingCall.caller.color }}
//             className="text-4xl capitalize font-extrabold tracking-tight mb-2"
//             animate={{ textShadow: ["0 0 10px currentColor", "0 0 30px currentColor", "0 0 10px currentColor"] }}
//             transition={{ repeat: Infinity, duration: 2 }}
//           >
//             {incomingCall.caller.fullName}
//           </motion.h2>
//           <p className="text-[var(--text-secondary)] text-lg mb-8 animate-pulse">Incoming {incomingCall.type} call</p>

//           {/* Action Buttons with Ripple Effect */}
//           <div className="flex gap-8">
//             <motion.button
//               whileTap={{ scale: 0.9 }}
//               whileHover={{ scale: 1.1 }}
//               onClick={() => { acceptCall(incomingCall.callId); ringingAudio.pause(); }}
//               className="relative bg-green-600 p-6 rounded-full shadow-2xl overflow-hidden group"
//             >
//               <span className="absolute inset-0 bg-green-400 opacity-0 group-active:opacity-50 transition-opacity" />
//               <PhoneIcon size={32} className="text-white relative z-10" />
//               <span className="ml-2 text-white font-bold">Accept</span>
//             </motion.button>

//             <motion.button
//               whileTap={{ scale: 0.9 }}
//               whileHover={{ scale: 1.1 }}
//               onClick={() => { rejectCall(incomingCall.callId); ringingAudio.pause(); }}
//               className="relative bg-red-600 p-6 rounded-full shadow-2xl overflow-hidden group"
//             >
//               <span className="absolute inset-0 bg-red-400 opacity-0 group-active:opacity-50 transition-opacity" />
//               <PhoneOff size={32} className="text-white rotate-135 relative z-10" />
//               <span className="ml-2 text-white font-bold">Decline</span>
//             </motion.button>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//     );
//   }
if ((incomingCall || activeCall) && !isMinimized) {
    return <CallInterface isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
     } 
const availableDates = [...new Set(sortedMessages.map((msg) => new Date(msg.createdAt).toISOString().split('T')[0]))].sort();
  const isUserBlockedInGroup = selectedGroup && selectedGroup.restrictions?.find((m) => m.userId === authUser._id)?._id;
  const isUserGroupMember = selectedGroup && selectedGroup.members?.find((m) => m._id === authUser._id)?._id;
  const isGroupTerminated = selectedGroup && selectedGroup.terminated;
// console.log(selectedUser? {selectedUser, authUser, blockedUsers} : selectedGroup)
  const allChatsForForward = [...allContacts, ...groupChats].filter(chat => !chat.terminated && !chat.isArchived);
  const list = searchGroupName
    ? allChatsForForward.filter(
        (contact) =>
          (contact.fullName && contact.fullName.toLowerCase().trim().includes(searchGroupName.toLowerCase().trim())) ||
          (contact.name && contact.name.toLowerCase().trim().includes(searchGroupName.toLowerCase().trim()))
      )
    : allChatsForForward;
    const handleExitGroup = async () => {
    if (selectedGroup && selectedGroup?._id && !isGroupTerminated) {
      try {
      await exitGroup(selectedGroup._id);
        setSelectedGroup({...selectedGroup, roomId:null});
        toast.success("Exited group successfully");
      } catch (error) {
        toast.error("Failed to exit group");
        console.error("Exit group error:", error);
      }
    } else {
      toast.error(isGroupTerminated ? "Cannot exit a terminated group" : "Invalid group");
    }
  };

  return (
    <div className="flex w-full overflow-hidden">
      <div className={` ${showmedia ? "w-[25rem] hidden   md:w-[100%] md:flex": "flex w-full"} flex-col h-[100vh] bg-[var(--bg-main)] backdrop-blur-sm overflow-hidden `}>
        <ChatHeader
        dropdownOpen={dropdownOpen}
         setDropdownOpen={setDropdownOpen}
        handleReportChat={handleReportChat}
        searchQuery={searchQuery}
  onSearchChange={onSearchChange}
  handleNextMatch={handleNextMatch}
  handlePrevMatch={handlePrevMatch}
  resultsCount={resultsCount}
  currentMatchIndex={currentMatchIndex} />
        <div onClick={() => { setShowEmojiPicker(false); setAttached(false); }} className="flex-1 px-4 sm:px-6 overflow-y-auto pt-2 pb-4">
          {isMessagesLoading ? (
            <MessagesLoadingSkeleton />
          ) : groupedMessages.length === 0 ? (
            <NoChatHistoryPlaceholder />
          ) : (
            <div
            onClick={() => setDropdownOpen(false)}
            className="max-w-3xl relative mx-auto mt-0">
              {groupedMessages.map((group) => (
                <div key={group.dateKey} className=" mt-0" >
                  <div
                    className="sticky top-0 w-fill z-10 flex justify-center"
                  >
                    <div
                      ref={(el) => (groupRefs.current[group.dateKey] = el)}
                     onClick={() => setShowCalendar(true)}
                    className="bg-[var(--color-primary-hover)] w-fit backdrop-blur-md mt-4 z-10 text-center p-2 rounded-md text-[var(--text-primary)] cursor-pointer text-sm"
                        >
                                      {
                                  ( getRelativeLabel(group.dateKey) !== "today" && getRelativeLabel(group.dateKey) !== "yesterday") && formatFullDate(group.dateKey)
                                      }
                                       {
                                  ( getRelativeLabel(group.dateKey) === "today" || getRelativeLabel(group.dateKey) === "yesterday") && getRelativeLabel(group.dateKey)
                                      }
                  </div>
                  </div>
                 
                  <div className="space-y-4 sm:space-y-6">
                    {group.messages.map((msg) => {
                      const senderId = typeof msg.senderId === "string" ? msg.senderId : (msg.senderId._id ? msg.senderId._id.toString() : '');
                      const senderName = typeof msg.senderId === "string" ? (selectedGroup?.members.find((m) => m._id === msg.senderId)?.fullName || "Unknown") : (msg.senderId.fullName || "Unknown");
                     const senderColor = typeof msg.senderId === "string" ? (selectedGroup?.members.find((m) => m._id === msg.senderId)?.color || "Unknown") : (msg.senderId.color || "Unknown");
                      const senderProfilePic = typeof msg.senderId === "string" ? (selectedGroup?.members.find((m) => m._id === msg.senderId)?.profilePic || "/avatar.png") : (msg.senderId.profilePic || "/avatar.png");
                      const isOwnMessage = senderId === authUser._id.toString();
                      const isSystemMessage = msg.isSystem;
                      //console.log
                      if (isSystemMessage && !msg.visibleTo.some((id) => id.toString() === authUser._id.toString())) {
                        return null;
                      }
                      return (
                        <div
                          key={msg._id}
                          ref={(el) => (messageRefs.current[msg._id] = el)}
                          data-msg-id={msg._id}
                          className={`chat ${isSystemMessage ? "chat-center w-full flex justify-center" : isOwnMessage ? "chat-end" : "chat-start"} ${(highlightedMsg === msg._id) ? 'bg-yellow-500/50 border-2 border-yellow-500 animate-pulse' : ''} ${multiSelectMode && selectedMessages.includes(msg._id) ? 'bg-[var(--color-primary-hover)] p-6' : ''}`}
                        >
                          {isSystemMessage ? (
                            <div className=" w-[65%] mx-10 flex items-center justify-center">
                              <div className=" bg-[var(--bg-secondary)] text-[var(--text-primary)] text-center text-sm py-3 rounded-md px-3">
                                <p>{msg.text}</p>
                              </div>
                            </div>
                          ) : (
                            <div className={`flex relative items-center space-x-2 mb-1 `} >
                              { multiSelectMode && selectedMessages.includes(msg._id) ? <>
                              {
                                !isOwnMessage && <input type="checkbox"
                                  onClick={() => { setSelectedMessages((prev) => prev.filter(id => id !== msg._id) );
 }}
                                checked className="w-5 cursor-pointer h-5" />
                              }
                         
                              </> :
                              <>
                              {selectedGroup && !isOwnMessage && (
                                <div className="">
                                  <div className="avatar">
                                    <div className="w-8 sm:w-8 rounded-full">
                                      <img src={senderProfilePic} alt={senderName} />
                                    </div>
                                  </div>
                                </div>
                              )}
                             
                              </>}
                             {!msg?.deletedBy?.includes(authUser._id) && <div
                              onDoubleClick={() => toggleMultiSelect(msg)}
                             onContextMenu={() => toggleMultiSelect(msg)}
                            
                             className={`chat-bubble cursor-pointer max-w-md md:max-w-md w-full rounded-xl p-2 relative ${isOwnMessage ? "bg-[var(--color-primary-hover)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"} ${tempHighlightMsgId === msg._id && (!msg.text.trim() || (msg.text.trim() && msg?.attachment?.length > 0)) ? "bg-yellow-400/70": ""} `} >
                                {selectedGroup && !isOwnMessage && (
                                  <p style={{color: senderColor}} className="text-sm text-cyan-600 mb-1 capitalize font-semibold">{senderName}</p>
                                )}
                                   {msg.isForwarded && msg.attachments && msg.attachments.length > 0 && msg.attachments[0].attachmentType !== 'share' && msg.attachments[0].attachmentType !== 'call' && <p className="flex items-center text-sm font-semibold mt-[-5px] text-[var(--text-secondary)]"><Forward /> Forwarded</p>}
                             
                                {msg.replyTo && msg.replyTo.senderId && (
                                  <div className={`${!isOwnMessage ? "bg-[var(--bg-main)]" : "bg-[var(--bg-secondary)]"} flex items-center gap-2 p-2 text-sm rounded cursor-pointer`} onClick={() => handleReplyClick(msg.replyTo._id)}>
                                
                                {
                                  selectedUser && msg.replyTo.senderId.toString() === selectedUser._id.toString() && <img src={selectedUser.profilePic || '/avatar.png'} alt={selectedUser.fullName} className="h-[50px] w-[50px] rounded mr-2 object-cover" />
                                }
                                 {
                                  selectedGroup && msg.replyTo && msg.replyTo.senderId.toString() !== authUser._id.toString() && selectedGroup?.members.find((m) => m._id.toString() === msg.replyTo.senderId.toString()) && <img src={selectedGroup?.members.find((m) => m._id.toString() === msg.replyTo.senderId.toString())?.profilePic || '/avatar.png'} alt={selectedGroup?.members.find((m) => m._id.toString() === msg.replyTo.senderId.toString())?.fullName} className="h-[50px] w-[50px] rounded mr-2 object-cover" />
                                }
                                
                                  <div>
                                   { selectedUser && <p
                                    style={{color: msg.replyTo.senderId.toString() === selectedUser._id.toString() && selectedUser.color || msg.replyTo.senderId.toString() !== selectedUser._id.toString() && authUser.color}}
                                    className={` capitalize `}>
                                      {
                                      selectedUser && msg.replyTo.senderId.toString() === selectedUser._id.toString() && selectedUser.fullName
                                      }
                                      {
                                      selectedUser && msg.replyTo.senderId.toString() !== selectedUser._id.toString() && "You"}
                                      </p>}
                                
                                  { selectedGroup && !msg.isSystem && <p
                                  style={{color: msg.replyTo.senderId.toString() !== authUser._id.toString() && selectedGroup?.members.find((m) => m._id.toString() === msg.replyTo.senderId.toString())?.color || msg.replyTo.senderId.toString() === authUser._id.toString() && authUser.color}}
                                    className={` capitalize `}>
                               
                                      {
                                     selectedGroup && msg.replyTo.senderId.toString() !== authUser._id.toString() && selectedGroup?.members.find((m) => m._id.toString() === msg.replyTo.senderId.toString())?.fullName
                                      }
                                      {
                                      selectedGroup && msg.replyTo.senderId.toString() === authUser._id.toString() && "You"}
                                      </p>}
                                    <p className={`text-sm truncate ${isOwnMessage ? "text-[var(--text-primary)]" : "text-white"}`} >{truncatePar(msg.replyTo?.text, 30)}</p>
                                  </div>
                                  </div>
                                )}
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <div className="space-y-2 ">
                                    {msg.attachments[0].attachmentType !== 'call' && msg.attachments.map((attachment, index) => (
                                      <div key={index} className="mb-2">
                                        {attachment.attachmentType === 'image' && <img src={attachment.attachmentUrl} alt="Shared" className="rounded-lg h-32 sm:h-48 object-cover" />}
                                        {attachment.attachmentType === 'video' && <VideoPlayer attachment={attachment} />}
                                        {attachment.attachmentType === 'audio' && <AudioPlayer attachment={attachment} />}
                                       {
                                          attachment.attachmentType === 'share' && (
                                            <div className="flex flex-col gap-2">
                                               <div className="flex items-center gap-2">
                                                 <img src={attachment?.attachmentUrl || '/avatar.png'} alt={selectedUser.fullName} className="h-[40px] w-[40px] rounded-full mr-2 object-cover" />
                                             <p style={{
                                              color: allContacts.find((contact) => contact.fullName === attachment.originalName && contact.profilePic === attachment?.attachmentUrl)?.color
                                             }} className={` capitalize ${!isOwnMessage ? "text-[var(--text-primary)]" : "text-white"}`} > {highlightQuery(attachment.originalName, searchQuery) }</p>
                                             </div>
                                             {
                                               allContacts.find((contact) => contact.fullName === attachment.originalName && contact.profilePic === attachment?.attachmentUrl)?.fullName && <button
                                                             type="button"
                                                             onClick={() => {
            if (socket && allContacts.find((contact) => contact.fullName === attachment.originalName && contact.profilePic === attachment?.attachmentUrl)?.roomId) {
              socket.emit("join_private_rooms", [allContacts.find((contact) => contact.fullName === attachment.originalName && contact.profilePic === attachment?.attachmentUrl)?.roomId]);
            }
         setSelectedUser(allContacts.find((contact) => contact.fullName === attachment.originalName && contact.profilePic === attachment?.attachmentUrl));
        // setSidebarContent('chats');
           }}
                                                             className={` ${!isOwnMessage ? "bg-[var(--bg-main)] hover:bg-[var(--color-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)]  hover:text-[var(--text-primary)]"} py-2 flex w-full justify-center items-center gap-2 rounded-sm cursor-pointer transition-colors  px-2  `}
                                                           >
                                                             <MdChatBubble size={16} /> Message
                                                           </button>
                                             }

                                             {
                                              allRequests.find((contact) => contact.type === "received" && contact.from.fullName === attachment.originalName && contact.from.profilePic === attachment?.attachmentUrl)?.from.fullName  && <div className="flex flex-col gap-1 ">
                                               <p>This user had sent you a friend request</p>
                                                      <button
                                                             type="button"
                                                              onClick={() => {
                        console.log("isOnline:", isOnline); // Debug
                        if (!isOnline) {
                         queueAction({ type: "acceptRequest", requestId: allRequests.find((contact) => contact.type === "received" && contact.from.fullName === attachment.originalName && contact.from.profilePic === attachment?.attachmentUrl)?._id });
                          return;
                        }
                       acceptRequest(allRequests.find((contact) => contact.type === "received" && contact.from.fullName === attachment.originalName && contact.from.profilePic === attachment?.attachmentUrl)?._id);
                      }}                                                             
                                                             className={` ${!isOwnMessage ? "bg-[var(--bg-main)] hover:bg-[var(--color-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)]  hover:text-[var(--text-primary)]"} py-2 flex w-full justify-center items-center gap-2 rounded-sm cursor-pointer transition-colors  px-2  `}
                                                           >
                                                             <FaThumbsUp size={16} />Accept
                                                           </button>

                                                           <button
                                                             type="button"     
                                                                  onClick={() => {
                        console.log("isOnline:", isOnline); // Debug
                        if (!isOnline) {
                         queueAction({ type: "declineRequest", requestId: allRequests.find((contact) => contact.type === "received" && contact.from.fullName === attachment.originalName && contact.from.profilePic === attachment?.attachmentUrl)?._id });
                          return;
                        }
                        declineRequest(allRequests.find((contact) => contact.type === "received" && contact.from.fullName === attachment.originalName && contact.from.profilePic === attachment?.attachmentUrl)?._id);
                      }}                                                             
                                                             className={` ${!isOwnMessage ? "bg-[var(--bg-main)] hover:bg-[var(--color-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)]  hover:text-[var(--text-primary)]"} py-2 flex w-full justify-center items-center gap-2 rounded-sm cursor-pointer transition-colors  px-2  `}
                                                           >
                                                             <FaThumbsDown size={16} /> Decline
                                                           </button>

                                                </div>
                                             }
                                             {
                                              usersForRequest.find((contact) => contact.fullName === attachment.originalName && contact.profilePic === attachment?.attachmentUrl)?.fullName && 
                                              !allRequests.find((contact) => contact.type === "sent" && contact.to.fullName === attachment.originalName && contact.to.profilePic === attachment?.attachmentUrl)?.to?.fullName &&
                                              !allRequests.find((contact) => contact.type === "received" && contact.from.fullName === attachment.originalName && contact.from.profilePic === attachment?.attachmentUrl)?.from.fullName  &&
                                               <>
                                              <p>To chat to this user, try sending them a friend request</p>
                                                      
                                               <button
                                                             type="button" 
                                                             onClick={() => {
                     handleSendRequest(usersForRequest.find((contact) => contact.fullName === attachment.originalName && contact.profilePic === attachment?.attachmentUrl)?._id);
                    }}                                                            
                                                             className={` ${!isOwnMessage ? "bg-[var(--color-primary-hover)] hover:bg-[var(--color-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)]  hover:text-[var(--text-primary)]"} py-2 flex w-full justify-center items-center gap-2 rounded-sm cursor-pointer transition-colors  px-2  `}
                                                           >
                                                             <Send size={16} />send
                                                           </button>
                                              </>
                                             }
                                             {
                                              allRequests.find((contact) => contact.type === "sent" && contact.to.fullName === attachment.originalName && contact.to.profilePic === attachment?.attachmentUrl)?.to?.fullName &&
                                              <>
                                              <p>Your friend request to this user is pending...</p>
                                                      
                                               <button
                                                             type="button" 
                                                             onClick={() => {
                      console.log("isOnline:", isOnline); // Debug
                      if (!isOnline) {
                       queueAction({ type: "cancelRequest", requestId: allRequests.find((contact) => contact.type === "sent" && contact.to.fullName === attachment.originalName && contact.to.profilePic === attachment?.attachmentUrl)?.to?._id });
                        return;
                      }
                     cancelRequest(allRequests.find((contact) => contact.type === "sent" && contact.to.fullName === attachment.originalName && contact.to.profilePic === attachment?.attachmentUrl)?.to?._id);
                    }}                                                            
                                                             className={` ${!isOwnMessage ? "bg-[var(--bg-main)] hover:bg-[var(--color-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)]  hover:text-[var(--text-primary)]"} py-2 flex w-full justify-center items-center gap-2 rounded-sm cursor-pointer transition-colors  px-2  `}
                                                           >
                                                             <MdCancel size={16} />Cancel
                                                           </button>
                                              </>
                                             }
                                            </div>
                                          )
                                      }
                                        {attachment.attachmentType === 'document' && (
                                          <div className="bg-[var(--bg-secondary)] p-2 rounded-lg flex items-center gap-2">
                                            <img src={attachment.preview} alt="preview" className="w-12 h-12 object-cover rounded" />
                                            <div>
                                              <a
                                                href={downloadedFiles[attachment.attachmentUrl] || attachment.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-cyan-400 hover:underline"
                                                onClick={(e) => {
                                                  if (!downloadedFiles[attachment.attachmentUrl]) {
                                                    e.preventDefault();
                                                    handleDownload(attachment.attachmentUrl, attachment.originalName);
                                                  }
                                                }}
                                              >
                                                {truncatePar(attachment.originalName, 25)}
                                              </a>
                                              <p className="text-xs">{attachment.size ? (attachment.size / 1024 / 1024).toFixed(2) + ' MB' : ''} • {attachment.attachmentExt}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {
                                      msg.attachments[0].attachmentType === 'call' &&  <CallMessage attachment={msg.attachments[msg.attachments.length - 1]} msg={msg} />
                                     
                                    }
                                  </div>
                                )}
                                {msg.text && msg?.attachments[0]?.attachmentType !== 'call' && <p className={`pt-1 ${!isOwnMessage ? "text-[var(--text-primary)]" : "text-white"}`} > {highlightQuery(msg.text, searchQuery) }</p>}
                                <p className={`text-xs mt-1 w-full relative opacity-75 flex ${!isOwnMessage ? "text-[var(--text-primary)]" : "text-white"} items-center ${isOwnMessage ? "justify-end text-right" : "justify-start text-left" } gap-1`}>
                                  {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", })}
                                  {isOwnMessage && !selectedGroup && (
                                    <span>
                                      {msg.readBy.length > 1 ? (
                                        <span className="text-cyan-300 ml-2">✓✓</span>
                                      ) : (
                                        <span className={`"text-gray-400 ml-2 ${!isOwnMessage ? "text-[var(--text-primary)]" : "text-white"}`}>✓</span>
                                      )}
                                    </span>
                                  )}
                                  {msg.isEdited && <p className={`text-xs ml-2 opacity-50 ${!isOwnMessage ? "text-[var(--text-primary)]" : "text-white"}`}>Edited</p>}
                                  {msg.pinnedUntil && <PinIcon size={16} />}
                                  {(msg.savedBy || []).includes(authUser._id) && <FaStar className=" ml-2 text-cyan-500" color="cyan" size={16} />}
                                </p>
                                {msg.reactions && msg.reactions.length > 0 &&
                                  <div className={`reactions mt-1 absolute rounded-full  z-20 flex gap-1 `}>
                                    {msg.reactions.map((r, i) => (
                                      <span className="cursor-pointer" key={i} onClick={() => handleShowReactors(msg._id)}>{r.emoji}</span>
                                    ))}
                                    <span className="cursor-pointer text-sm" >({msg.reactions.length})</span>
                                  </div>
                                  }
                              </div>
                              }
                              {
                             ((msg.deletedBy && msg.deletedBy.includes(authUser._id)) // || msg.deletedForEveryone
                            ) &&
  // FIX: Show placeholder for both "for me" (deletedBy) and "for everyone" (deletedForEveryone)
  <div
    onDoubleClick={() => setShowDel(msg._id)}
    className={`chat-bubble cursor-pointer max-w-[90%] sm:max-w-md rounded-xl p-2 relative ${isOwnMessage ? "bg-[var(--color-primary-hover)] text-[var(--text-primary)]" : "bg-[var(--bg-secondary)] text-[var(--text-primary)]"}`}
  >
    <p className={`pt-1 ${!isOwnMessage ? "text-[var(--text-primary)]" : "text-white"}`}>This message was deleted</p>
    <p className={`text-xs mt-1 w-full relative opacity-75 flex ${!isOwnMessage ? "text-[var(--text-primary)]" : "text-white"} items-center ${isOwnMessage ? "justify-end text-right" : "justify-start text-left"} gap-1`}>
      {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
      {msg.isEdited && <span className="text-xs ml-2 opacity-50">Edited</span>}
    </p>
  </div>
                              }
                              {msg?.deletedBy && !msg?.deletedBy?.includes(authUser._id) && selectedMessages.length === 0 && !selectedMessages.includes(msg._id) &&
                              //  <div onClick={() => handleMenuClick(msg._id)} className="inline-flex text-[var(--text-secondary)] hover:bg-slate-700/30 p-1 rounded-md cursor-pointer hover:text-[var(--text-primary)]">
                              //   <EllipsisVertical />
                              // </div>
                                <button
                                    onMouseEnter={() => handleMenuClick(msg._id)}
                                   className="relative  w-12 h-7 bg-[var(--bg-secondary)] rounded-full p-0.5 transition-all duration-300"
    >
      <div
        className={`absolute top-1.5 w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-xs
           ${menuOpenForMsg === msg._id ? 'translate-x-0 bg-[var(--bg-main)] text-yellow-400' : 'translate-x-5 text-yellow-400'}`}
                                    >
                                      {menuOpenForMsg === msg._id ? <></> : <MdEmojiEmotions className="size-full" />}
                                    </div>
                                  </button>
                              }
                               { multiSelectMode && selectedMessages.includes(msg._id) &&
                           
                                isOwnMessage && <input
                                 onClick={() => { setSelectedMessages((prev) => prev.filter(id => id !== msg._id) );}}
                                type="checkbox"checked className="w-5 h-5" />
                              }
                          
                              {selectedMessages && selectedMessages.length > 0 && (
                                <div className="fixed bottom-0 z-50 left-0 select-none right-0 bg-[var(--bg-secondary)] p-4 flex gap-2 justify-center">
                                  <button className="flex justify-center w-full items-center p-3 text-md font-medium bg-[var(--color-primary-hover)] text-center cursor-pointer rounded-md gap-2 text-[var(--text-primary)] hover:bg-[var(--color-primary)]" onClick={handleForward}><ForwardIcon /> Forward</button>
                                  <button className="flex justify-center w-full items-center p-3 text-md font-medium bg-red-600 text-center cursor-pointer rounded-md gap-2 text-[var(--text-primary)] hover:bg-red-800 " onClick={() => handleDelete(selectedMessages, false)}><Trash2Icon /> Delete</button>
                                  <button className="flex items-center p-3 text-md font-semibold bg-[var(--bg-main)] cursor-pointer rounded-md gap-2 text-[var(--text-secondary)] hover:bg-[var(--color-primary)] hover:text-[var(--text-primary)]" onClick={() => { setMultiSelectMode(false); setSelectedMessages([]); }}><FiX /> </button>
                                </div>
                              )}
                              {showReactionPicker === msg._id && (
                                <div 
                                onMouseLeave={() => setShowReactionPicker(null)}
                                 className="absolute z-50 top-0 left-0">

                                  <EmojiPicker theme={mode} onMouseLeave={() => setShowReactionPicker(null)} onEmojiClick={(emojiObject) => handleReact(msg, emojiObject)} />
                                </div>
                              )}
                              {menuOpenForMsg === msg._id && (
                                <ul onMouseLeave={() =>  handleMenuClick(null)
                                  } className={`absolute z-50 ${!isOwnMessage ? "bg-[var(--color-primary)]  top-[70%] left-[10%]" : "bg-[var(--bg-secondary)] text-[var(--text-primary)] top-[70%] right-[10%]"} p-1 rounded-md cursor-pointer hover:text-[var(--text-primary)]`}>
                                    <li
                                    // onClick={() => { setShowReactionPicker(msg._id); setMenuOpenForMsg(null); }}
                                      className={`flex min-w-[9rem] flex items-center justify-start z-20 w-full p-2 gap-1 text-sm border-b-2 ${isOwnMessage ? 'border-cyan-800/50' : 'border-[var(--border)]'}`}>
                                  {
                                    recentEmojis.map((emoji, index) => (<div key={index}
                                      onClick={() => {
                                        handleReactionClick(msg, emoji)
                                        setMenuOpenForMsg(null);
                                       }}
                                      className="p-1 bg-[var(--bg-main)] text-[18px] rounded-full hover:bg-slate-400/50">{emoji}</div>))
                                  }
                                  <div onClick={() => { setShowReactionPicker(msg._id); setMenuOpenForMsg(null); }}
                                   className="p-1.5 bg-[var(--bg-main)] text-[18px] rounded-full hover:bg-slate-400/50"><FaPlus/> </div>
                                  </li>
                                
                                  <li onClick={() => { setReplyTo(msg); setMenuOpenForMsg(null); }} className={`flex min-w-[9rem] z-20 w-full p-2 gap-1 items-center text-sm border-b-2 ${isOwnMessage ? 'border-cyan-800/50 hover:bg-[var(--color-primary)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                                    <Reply size={18} /> Reply
                                  </li>
                                 {
                                 msg?.attachments[0]?.attachmentType !== 'call' && <> <li onClick={() => { handleCopy(msg.text); setMenuOpenForMsg(null); }} className={`flex min-w-[9rem] z-20 w-full p-2 gap-1 items-center text-sm border-b-2 ${isOwnMessage ? 'border-cyan-800/50 hover:bg-[var(--color-primary)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                                    <CopyIcon size={18} /> Copy
                                  </li>
                                  <li onClick={() => { toggleMultiSelect(msg); setMenuOpenForMsg(null); }} className={`flex min-w-[9rem] z-20 w-full p-2 gap-1 items-center text-sm border-b-2 ${isOwnMessage ? 'border-cyan-800/50 hover:bg-[var(--color-primary)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                                    <ForwardIcon size={18} /> Forward
                                  </li>
                                  </>}
                                  <li onClick={() => { handleSave(msg); setMenuOpenForMsg(null); }} className={`flex min-w-[9rem] z-20 w-full p-2 gap-1 items-center text-sm border-b-2 ${isOwnMessage ? 'border-cyan-800/50 hover:bg-[var(--color-primary)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
               {
                (msg.savedBy || []).includes(authUser._id) ? <> <StarOff size={18} /> Unstar </> : <> <Star size={18} /> Star </>
               }
         
              </li>
                                  {isOwnMessage && (
                                    <li onClick={() => { handleEdit(msg); setMenuOpenForMsg(null); }} className={`flex min-w-[9rem] z-20 w-full p-2 gap-1 items-center text-sm border-b-2 border-cyan-800/50 hover:bg-[var(--color-primary)]`}>
                                      <Edit2Icon size={18} /> Edit
                                    </li>
                                  )}
                             
                                  <li onClick={() => { handlePin(msg._id); setMenuOpenForMsg(null); }} className={`flex min-w-[9rem] z-20 w-full p-2 gap-1 items-center text-sm border-b-2 ${isOwnMessage ? 'border-cyan-800/50 hover:bg-[var(--color-primary)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                                    <PinIcon size={18} /> Pin
                                  </li>
                                  <li onClick={() => { setShowDel(msg._id); setMenuOpenForMsg(null); }} className={`flex min-w-[9rem] z-20 w-full p-2 gap-1 items-center text-sm border-b-2 ${isOwnMessage ? 'border-cyan-800/50 hover:bg-[var(--color-primary)]' : 'border-[var(--border)] hover:bg-[var(--bg-secondary)]'}`}>
                                    <Trash2Icon size={18} /> Delete
                                  </li>
                              
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>
          )}
        </div>
        {((selectedUser  && (!selectedUser?.blockedUsers.find((b) => b.userId === authUser._id) && !blockedUsers.find((b) => b.userId === selectedUser._id))) || (!isUserBlockedInGroup && isUserGroupMember)) && <MessageInput />}
      
        {(selectedUser && !report && selectedUser._id && selectedUser?.blockedUsers.find((b) => b.userId === authUser._id)) && (
          <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
               className="flex cursor-not-allowed  items-center justify-center gap-2 bg-[var(--bg-main)] text-[var(--text-primary)] py-2 px-4 w-full rounded"
              >
             You have been blocked from this chat
            </button>
          </div>
        )}
        {(selectedUser && report && selectedUser._id && selectedUser?.blockedUsers.find((b) => b.userId === authUser._id)) && (
          <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
               className="flex cursor-not-allowed items-center justify-center gap-2 bg-[var(--bg-main)] text-[var(--text-primary)] py-2 px-4 w-full rounded"
              >
             This user reported this chat and now, its on review
            </button>
          </div>
        )}
         {(selectedUser && !report && blockedUsers.find((b) => b.userId === selectedUser._id)) && (
          <div className="p-4 flex items-center justify-center gap-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
              onClick={async () =>{
                 try {
                       await useChatStore.getState().unblockUser(selectedUser._id);
                         } catch (error) {
                        toast.error(error.response?.data?.message || "Failed to unblock user");
                        console.error("Unblock user error:", error);
                      }
              }}
              className=" bg-[var(--color-primary)] w-full text-[var(--text-primary)] py-2 px-4 rounded hover:bg-[var(--color-primary-hover)]"
            >
              Unblock User
            </button>
             <button
             onClick={async() => {
              try {
      // await deleteFriend(selectedUser._id);
      // setSelectedUser(null);
       // handleClose();
        toast.success("Friend deleted successfully");
      } catch (error) {
        toast.error("Failed to delete friend");
        console.error("Delete friend error:", error);
      }
             }}
            className="bg-red-600 w-full text-[var(--text-primary)] py-2 px-4 rounded hover:bg-red-700"
            >
             Delete Friend
            </button>
          </div>
        )}
        {(selectedUser && report && blockedUsers.find((b) => b.userId === selectedUser._id)) && (
          <div className="p-4 flex items-center justify-center gap-3 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
               className="flex items-center justify-center gap-2 bg-[var(--bg-main)] text-[var(--text-primary)] py-2 px-4 w-full rounded"
              >
           <LoaderIcon className="size-5 animate-spin" /> The report about this chat is being processed
            </button>
          </div>
        )}
         {isUserBlockedInGroup && !report && isUserGroupMember && (
          <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
              onClick={handleExitGroup}
              className="bg-red-600 w-full text-[var(--text-primary)] py-2 px-4 rounded hover:bg-red-700"
            >
              Delete Group
            </button>
          </div>
        )}
        {isUserBlockedInGroup && report && isUserGroupMember && (
          <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
               className="flex items-center justify-center gap-2 bg-[var(--bg-main)] text-[var(--text-primary)] py-2 px-4 w-full rounded"
              >
           <LoaderIcon className="size-5 animate-spin" /> The report about this chat is being processed
            </button>
          </div>
        )}
        {
         selectedGroup && selectedGroup.members.length >1 && !selectedGroup.members.find((memId) => memId._id === authUser._id) && selectedGroup.joinRequests.length >= 0 && !selectedGroup.joinRequests.find((memId) => memId.userId._id === authUser._id) && (
          <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
              onClick={() => handleJoinRequest(selectedGroup._id)}
              className="bg-green-600 text-[var(--text-primary)] py-2 px-4 w-full rounded hover:bg-green-700"
            >
              Join Group
            </button>
          </div>
        )}
        {
         selectedGroup && selectedGroup?.members.length >1 && selectedGroup?.joinRequests?.length >= 1 && !selectedGroup.members.find((memId) => memId._id === authUser._id) && selectedGroup.joinRequests.find((memId) => memId.userId._id === authUser._id) && (
          <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-center">
            <button
              onClick={() => handleJoinRequest(selectedGroup._id)}
              className="flex items-center justify-center gap-2 bg-[var(--bg-main)] text-[var(--text-primary)] py-2 px-4 w-full rounded"
            >
            <LoaderIcon className="size-5 animate-spin" /> Waiting Approval
            </button>
          </div>
        )}
         {showCalendar && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-[var(--bg-main)] p-4 sm:p-6 rounded-lg shadow-lg w-[90%] sm:w-auto">
                      <h3 className="text-[var(--text-primary)] mb-4 text-sm sm:text-base">Select a date to jump to</h3>
                      <select
                        className="w-full p-2 mb-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-sm sm:text-base"
                        onChange={(e) => {
                          const dateKey = e.target.value;
                          if (dateKey) {
                            groupRefs.current[dateKey]?.scrollIntoView({ behavior: 'smooth' });
                            setShowCalendar(false);
                          }
                        }}
                      >
                        <option className="p-2 bg-[var(--bg-main)] mb-3 text-[var(--text-primary)] hover:bg-[var(--color-primary-hover)] cursor-pointer rounded-sm" value="">Select date</option>
                        {availableDates.map((d) => (
                          <option key={d} value={d}>
                            {formatFullDate(d)} {getRelativeLabel(d)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="bg-[var(--color-primary)] text-[var(--text-primary)] px-4 py-2 rounded text-sm sm:text-base"
                        onClick={() => setShowCalendar(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
                {showReportModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-[var(--bg-secondary)] w-[90%] max-w-md p-6 rounded-lg shadow-lg">
        <h3 className="text-cyan-500 mb-4 font-bold text-lg flex items-center gap-2">
          <MdReport size={20} /> Report Chat
        </h3>
        <p className="text-[var(--text-secondary)] mb-4 text-sm">Why are you reporting this chat? Your report is anonymous.</p>
        <select
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
          className="w-full p-2 mb-4 bg-[var(--bg-main)] text-[var(--text-primary)] rounded text-sm outline-none"
        >
          <option value="">Select a reason</option>
          {reportReasons.map((reason, idx) => (
            <option key={idx} value={reason}>{reason}</option>
          ))}
        </select>
        <textarea
          value={reportDetails}
          onChange={(e) => setReportDetails(e.target.value)}
          placeholder="Provide more details (optional)"
          className="w-full p-2 mb-4 bg-[var(--bg-main)] text-[var(--text-primary)] rounded text-sm outline-none resize-none h-24"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              setShowReportModal(false);
              setSelectedReason("");
              setReportDetails("");
            }}
            className="bg-gray-500 text-[var(--text-primary)] py-2 px-4 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={submitReport}
            className="bg-red-600 text-[var(--text-primary)] py-2 px-4 rounded hover:bg-red-700"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  )}
                  {ShowPin && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-[var(--bg-secondary)] w-[50%] p-4 sm:p-6 rounded-lg shadow-lg w-[90%] ">
                      <h3 className="text-[var(--text-primary)] mb-4 text-sm sm:text-base flex items-center gap-2"><PinIcon/>How long should this message be pinned</h3>
                      <select
                        className="w-full p-2 mb-4 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-sm sm:text-base min-h-[38vh] overflow-hidden outline-0 outline-slate-200"
                       multiple
                        onChange={(e) => {
                          const dateKey = e.target.value;
                             // toast.success(`Message pinned for ${ShowPin} ${dateKey}`);
                               useChatStore.getState().pinMessage(ShowPin, dateKey);
                       setShowPin(null)
                        }}
                      >
                        <option className="p-2 bg-[var(--bg-main)] mb-3 text-[var(--text-primary)] hover:bg-[var(--color-primary-hover)] cursor-pointer rounded-sm" value="24h">24 Hours</option>
                         <option className="p-2 bg-[var(--bg-main)] mb-3 text-[var(--text-primary)] hover:bg-[var(--color-primary-hover)] cursor-pointer rounded-sm" value="7d">7 Days</option>
                          <option className="p-2 bg-[var(--bg-main)] mb-3 text-[var(--text-primary)] hover:bg-[var(--color-primary-hover)] cursor-pointer rounded-sm" value="14d">14 Days</option>
                           <option className="p-2 bg-[var(--bg-main)] mb-3 text-[var(--text-primary)] hover:bg-[var(--color-primary-hover)] cursor-pointer rounded-sm" value="30d">30 Days</option>
                       
                      </select>
                      <p className="text-[var(--text-secondary)] mb-1">Feel free to unpin anytime</p>
                      <button
                        className="bg-[var(--color-primary)] text-[var(--text-primary)] px-4 py-2 rounded text-sm sm:text-base"
                        onClick={() => setShowPin(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
                {ShowDel && (
                  <div className="fixed inset-0 w-full h-screen flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-[var(--bg-secondary)] w-[50%] mt-5 p-4 sm:p-6 rounded-lg shadow-lg w-[90%] ">
                      <h3 className="text-cyan-500 mb-4 font-bold text-sm sm:text-base flex items-center gap-2">Delete Message</h3>
                      <div
                        className="w-full p-2 mb-4 bg-[var(--bg-main)] text-[var(--text-primary)] rounded text-sm sm:text-base overflow-hidden outline-0 outline-slate-200 hover:bg-[var(--color-primary-hover)] cursor-pointer"
                        onClick={(e) => {
                             // toast.success(`Message pinned for ${ShowPin} ${dateKey}`);
                       handleDelete(ShowDel, false)
                      
                        }}
                      >
                        Delete For Me
                      </div>
                       <div
                        className="w-full p-2 mb-4 bg-[var(--bg-main)] text-[var(--text-primary)] rounded text-sm sm:text-base overflow-hidden outline-0 outline-slate-200 hover:bg-[var(--color-primary-hover)] cursor-pointer"
                        onClick={(e) => {
                          const dateKey = e.target.value;
                             // toast.success(`Message pinned for ${ShowPin} ${dateKey}`);
                             handleDelete(ShowDel, true)
                     
                        }}
                      >
                        Delete for everyone
                      </div>
                      <p className="text-[var(--text-secondary)] mb-1 flex items-center"><IoWarning/> This action can't be undone</p>
                      <button
                        className="bg-[var(--color-primary)] text-[var(--text-primary)] px-4 py-2 rounded text-sm sm:text-base"
                        onClick={() => setShowDel(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
               {forwardModalOpen && selectedMessages && selectedMessages.length > 0 && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[1000000]">
            <div className="bg-[var(--bg-main)] relative p-8 rounded-lg shadow-lg w-[90%] h-[90vh] flex flex-col">
              {/* Top Absolute Section */}
              <div className="absolute top-0 left-0 p-8 pb-2 pt-4 w-full bg-inherit z-20">
                <h2 className="flex items-center text-[20px] font-semibold mb-4 text-cyan-500">
                 <Forward size={25} /> Forward Message{selectedMessages.length > 1 ? "s" : ""} ({selectedMessages.length})
                </h2>
                <div className="relative mb-3">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchGroupName}
                    onChange={(e) => setSearchGroupName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Search Contacts"
                  />
                </div>
                {selectedChatsForForward.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap w-full">
                    {selectedChatsForForward.map((forUser, ind) => {
                      const user = allChatsForForward.find((forw) => forw._id.toString() === forUser._id.toString());
                      return user ? (
                        <div
                          key={ind}
                          onClick={() => setSelectedChatsForForward((prev) => prev.filter((id) => id._id !== forUser._id))}
                          className="p-2 cursor-pointer rounded-full bg-[var(--color-primary)] w-fit"
                        >
                          <p className="text-[var(--text-primary)] text-sm">{user.fullName || user.name}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                <h3 className="text-[var(--text-primary)] mt-2">Select chats to forward (max 5)</h3>
              </div>
       
              {/* Scrollable Middle Section */}
              <div className="flex-1 overflow-y-auto h-[50vh] pt-36 pb-20">
                {list && list.length > 0 ? (
                  list.map((chat) => (
                    <div
                      key={chat._id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                      onClick={() => {toggleForwardChat(chat)
                         if (socket && chat.roomId && !selectedChatsForForward.includes(chat) ) {
              // SOLUTION: When selecting a contact to start/open chat, ensure join the private room. This fixes the deviation where chat container doesn't open/load for new chats and enables real-time first-message receipt.
              socket.emit("join_private_rooms", [chat.roomId]);
            }
          
          
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="avatar relative">
                          <div className="w-10 rounded-full">
                            <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName || chat.name} />
                          </div>
                          {selectedChatsForForward.includes(chat) && (
                            <div className="bg-[var(--color-primary)] rounded-full p-0.5 absolute bottom-0 left-0 z-10">
                              <FaCheck size={12} className="font-semibold text-[var(--text-primary)]" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-start items-start">
                          <h4 style={{color: chat.color}} className="text-[var(--text-primary)] font-medium capitalize">{chat.fullName || chat.name}</h4>
                          <p className="text-[var(--text-secondary)] text-sm text-left">{truncatePar(chat.about, 50)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-[var(--text-secondary)]">No group or user found with such name</div>
                )}
              </div>
       
              {/* Bottom Absolute Section */}
              <div className="absolute bottom-0 left-0 p-4 w-full bg-inherit z-20 flex justify-between gap-2">
                <button onClick={handleForwardConfirm} className="bg-[var(--color-primary)] text-[var(--text-primary)] py-2 px-4 rounded hover:bg-[var(--color-primary-hover)]">
                  Forward
                </button>
                <button
                  onClick={() => setForwardModalOpen(false)}
                  className="bg-gray-500 text-[var(--text-primary)] py-2 px-4 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
           { selectedUser && shareModalOpen && <div 
                      // onMouseLeave={() => setShareModalOpen(null)}
                       className="fixed top-0 inset-0 hidden md:flex items-center justify-center bg-black/50 z-[1000000]">
                          <div className="bg-[var(--bg-main)] relative p-8 rounded-lg shadow-lg w-[90%] h-[90vh] flex flex-col">
                            {/* Top Absolute Section */}
                            <div className="absolute top-0 left-0 p-8 pb-2 pt-4 w-full bg-inherit z-20">
                              <h2 className="flex gap-2 items-center text-[20px] font-semibold mb-4 text-cyan-500">
                               <Share2Icon size={25} /> Send To
                              </h2>
                              <div className="relative mb-3">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                  type="text"
                                  value={searchGroupName}
                                  onChange={(e) => setSearchGroupName(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                  placeholder="Search Contacts"
                                />
                              </div>
                              {selectedChatsForForward.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap w-full">
                                  {selectedChatsForForward.map((forUser, ind) => {
                                    const user = allChatsForForward.find((forw) => forw._id.toString() === forUser._id.toString());
                                    return user ? (
                                      <div
                                        key={ind}
                                        onClick={() => setSelectedChatsForForward((prev) => prev.filter((id) => id._id !== forUser._id))}
                                        className="p-2 cursor-pointer rounded-full bg-[var(--color-primary)] w-fit"
                                      >
                                        <p className="text-[var(--text-primary)] text-sm">{user.fullName || user.name}</p>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              )}
                              <h3 className="text-[var(--text-primary)] mt-2">Select chats to send (max 5)</h3>
                            </div>
                     
                            {/* Scrollable Middle Section */}
                            <div className="flex-1 overflow-y-auto h-[50vh] pt-36 pb-20">
                              {list && list.length > 0 ? (
                                list.map((chat) => (
                                  <div
                                    key={chat._id}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                                    onClick={() => {
                                      toggleShareChat(chat)
                                       if (socket &&  chat.roomId && !selectedChatsForForward.includes(chat)  ) 
                                        {
                                          toast.success(chat.roomId)
                          // SOLUTION: When selecting a contact to start/open chat, ensure join the private room. This fixes the deviation where chat container doesn't open/load for new chats and enables real-time first-message receipt.
                       socket.emit("join_private_rooms", [chat.roomId]);
                          }
                        
                        
                                    }}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="avatar relative">
                                        <div className="w-10 rounded-full">
                                          <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName || chat.name} />
                                        </div>
                                        {selectedChatsForForward.includes(chat) && (
                                          <div className="bg-[var(--color-primary)] rounded-full p-0.5 absolute bottom-0 left-0 z-10">
                                            <FaCheck size={12} className="font-semibold text-[var(--text-primary)]" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex flex-col justify-start items-start">
                                        <h4 style={{color: chat.color}} className="text-[var(--text-primary)] font-medium capitalize">{chat.fullName || chat.name}</h4>
                                        <p className="text-[var(--text-secondary)] text-sm text-left">{truncatePar(chat.about, 50)}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-[var(--text-secondary)]">No group or user found with such name</div>
                              )}
                            </div>
                     
                            {/* Bottom Absolute Section */}
                            <div className="absolute bottom-0 left-0 p-4 w-full bg-inherit z-20 flex justify-between gap-2">
                              <button
                              onClick={handleShareConfirm}
                               className="bg-[var(--color-primary)] text-[var(--text-primary)] py-2 px-4 rounded hover:bg-[var(--color-primary-hover)]">
                                Send
                              </button>
                              <button
                                onClick={() =>{ setShareModalOpen(false)
                                  setSelectedChatsForForward([])
                                }}
                                className="bg-gray-500 text-[var(--text-primary)] py-2 px-4 rounded hover:bg-gray-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>}

            {
              activeCall && isMinimized && activeCall?.participants?.find((id)=> id === selectedUser._id) && <CallInterface isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
            }   
            {/* {
              incomingCall && isMinimized &&  <AnimatePresence>
      <motion.div className="fixed inset-0 bg-[var(--bg-main)] flex items-center justify-center flex-col gap-2 items-center justify-center z-[100000] p-4">
        <img src={incomingCall.caller.profilePic || '/avatar.png'} alt="Caller" className="w-32 h-32 rounded-full mb-4" />
        <h2 style={{color: incomingCall.caller.color}} className="text-2xl capitalize font-bold">{incomingCall.caller.fullName}</h2>
        <p className="text-[var(--text-secondary)] mb-6">Incoming {incomingCall.type} call</p>
        <div className="flex gap-6">
          <button onClick={() => { 
            acceptCall(incomingCall.callId, !!selectedGroup ? selectedGroup.roomId || selectedGroup._id  : selectedUser.roomId);  if(audioRef.current)
         {
          audioRef.current.pause();
          audioRef.current.currentTime = 0
         }
          }} className="bg-green-600 hover:bg-green-700 p-4 rounded-full flex items-center text-[var(--text-primary)] gap-2 text-xl capitalize">
            <PhoneIcon size={28} className="text-[var(--text-primary)]" />
            Accept
          </button>
          <button onClick={() => { 
           rejectCall(incomingCall.callId, !!selectedGroup ? selectedGroup.roomId || selectedGroup._id  : selectedUser.roomId);
          if(audioRef.current)
         {
          audioRef.current.pause();
          audioRef.current.currentTime = 0
         }

        // clearTimeout(timeoutRef.current) 
        }} className="bg-red-600 hover:bg-red-700 p-4 rounded-full flex items-center text-[var(--text-primary)] gap-2 text-xl capitalize">
            <PhoneOff size={28} className="text-[var(--text-primary)] rotate-135" />
         Decline
          </button>
        </div>
           <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-[var(--text-secondary)]">
                      <div className="flex items-center text-[var(--text-secondary)] gap-2">
                        <Lock size={16} />
                        <span className="text-sm">End-to-end encrypted</span>
                      </div>
                      <div className="flex items-center text-[var(--text-secondary)] bg-[var(--color-primary-hover)] p-2 rounded-md gap-4">
                        <button onClick={() => setIsMinimized(true)}>
                          <Minimize2 size={20} />
                        </button>
                      </div>
                    </div>
      </motion.div>
      </AnimatePresence>
            }    */}
        {isMinimized && incomingCall && (
  <motion.div
    initial={{ scale: 0, opacity: 0, y: 100 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0, opacity: 0, y: 100 }}
    whileHover={{ scale: 1.08 }}
    transition={{ type: "spring", stiffness: 300 }}
    className="fixed bottom-6 right-6 w-64 h-44 bg-gradient-to-br from-green-900/80 to-black/60 backdrop-blur-xl rounded-2xl overflow-hidden cursor-pointer z-[100000] shadow-2xl border border-green-500/30"
    onClick={() => setIsMinimized(false)}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
    
    {/* Pulsing Ring */}
    <motion.div
      animate={{ scale: [1, 1.4, 1.8], opacity: [1, 0.5, 0] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className="absolute inset-0 rounded-2xl ring-4 ring-green-500 pointer-events-none"
    />

    <div className="flex flex-col items-center justify-center h-full gap-2">
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-green-400 shadow-xl"
      >
        <img src={incomingCall.caller?.profilePic} className="w-full h-full object-cover" />
      </motion.div>
      <p style={{ color: incomingCall.caller?.color }} className="font-bold text-sm">
        {incomingCall.caller?.fullName}
      </p>
      <p className="text-xs text-green-300 animate-pulse">Incoming {incomingCall.type} call...</p>
    </div>
  </motion.div>
)}
      </div>
      {showmedia && <InforArea forwardModalOpen={shareModalOpen} setForwardModalOpen={setShareModalOpen} />}
    </div>
  );
}
export default ChatContainer;