import { useCallback, useRef, useState, useEffect } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, MicIcon, VideoIcon, FileIcon, SmileIcon, FileAudioIcon, FileAudio } from "lucide-react";
import Cropper from "react-easy-crop";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import EmojiPicker from "emoji-picker-react";
import { MdAttachFile } from "react-icons/md";
import { IoDocument, IoImage, IoMicOff, IoMicSharp, IoVideocam } from "react-icons/io5";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showTrimModal, setShowTrimModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 90 });
  const [isRecording, setIsRecording] = useState(false);
  const [cropIndex, setCropIndex] = useState(-1);
  const [trimQueue, setTrimQueue] = useState([]);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const ffmpegRef = useRef(new FFmpeg());
  const textAreaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { authUser, socket, isOnline } = useAuthStore();
  const {
    sendMessage,
    editMessage,
    isSoundEnabled,
    attached,
    setAttached,
    selectedUser,
    selectedGroup,
    showEmojiPicker,
    setShowEmojiPicker,
    replyTo,
    setReplyTo,
    editingMessage,
    setEditingMessage,
    checkIsChatArchived,
  } = useChatStore();

  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text)
       textAreaRef.current?.focus();
    } else {
      setText("");
    }
  }, [editingMessage]);

  useEffect(() => {
    const loadFFmpeg = async () => {
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      try {
        await ffmpegRef.current.load({
          coreURL: await fetch(`${baseURL}/ffmpeg-core.js`).then((res) => res.blob()).then((blob) => URL.createObjectURL(blob)),
          wasmURL: await fetch(`${baseURL}/ffmpeg-core.wasm`).then((res) => res.blob()).then((blob) => URL.createObjectURL(blob)),
        });
      } catch (error) {
        console.error("FFmpeg load error:", error);
       // toast.error("Failed to load video processing module");
      }
    };
    loadFFmpeg();
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      attachments.forEach((attachment) => {
        if (attachment?.localUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.localUrl);
        }
      });
    };
  }, [isRecording, attachments]);

  useEffect(() => {
    if (!socket || (!selectedUser && !selectedGroup)) return;

    const chatId = selectedGroup ? selectedGroup._id : selectedUser?._id;
    const roomId = selectedGroup ? selectedGroup._id : (selectedUser?.roomId || chatId);
    const isGroup = !!selectedGroup;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim()) {
      socket.emit("typing", {
        chatId,
        userId: authUser._id,
        userName: authUser.fullName,
        isGroup,
        roomId,
      });

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { chatId, userId: authUser._id, isGroup, roomId });
      }, 2000);
    } else {
      socket.emit("stopTyping", { chatId, userId: authUser._id, isGroup, roomId });
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit("stopTyping", { chatId, userId: authUser._id, isGroup, roomId });
    };
  }, [text, socket, selectedUser, selectedGroup, authUser]);

  const getVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
     //   toast.error("Failed to load video metadata");
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const truncatePar = (word, maxword) => {
    if (!word) return "";
    return word.length <= maxword ? word : word.slice(0, maxword) + "...";
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
      mp3: 'https://img.icons8.com/?size=100&id=CWZOl3WNER6r&format=png&color=000000',
      mp4: 'https://img.icons8.com/?size=100&id=CWZOl3WNER6r&format=png&color=000000'

    };
    return fileTypeIcons[ext] || 'https://img.icons8.com/?size=100&id=CWZOl3WNER6r&format=png&color=000000';
  };

  const handleAttachmentChange = async (e, type) => {
    setAttached(false);
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (type === "document" && files.length > 10) {
      toast.error("Cannot attach more than 10 documents at once");
      return;
    }
    const supportedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "zip"];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2 GB
    const needTrim = [];
    const processFile = async (file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      const mimeType =
        file.type ||
        {
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ppt: "application/vnd.ms-powerpoint",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          txt: "text/plain",
          rtf: "application/rtf",
          zip: "application/zip",
          mp3: "audio/mpeg",
          mp4: "video/mp4",
          webm: "audio/webm",
        }[ext] ||
        "application/octet-stream";
      const localUrl = URL.createObjectURL(file); // Create blob URL for UI
      if (type === "document") {
        if (!supportedExtensions.includes(ext)) {
          toast.error(`Unsupported file type: .${ext}`);
          return null;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 2 GB limit`);
          return null;
        }
        setIsLoadingThumbnail(true);
        const preview = generateDocumentThumbnail(file, ext);
        let base64;
        try {
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch (err) {
          toast.error(`Failed to read file: ${file.name}`);
          return null;
        } finally {
          setIsLoadingThumbnail(false);
        }
        return {
          type,
          file, // Store raw File object
          localUrl, // For optimistic UI
          data:  base64,
          name: file.name,
          size: file.size,
          ext,
          mimeType,
          preview,
        };
      } else if (type === "video") {
        const duration = await getVideoDuration(file);
        if (duration === 0) return null;
                 
        let base64;
        try {
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch (err) {
          toast.error(`Failed to read video: ${file.name}`);
          return null;
        }

        return { type, file, data:base64, localUrl, name: file.name, duration, mimeType };
      } else if (type === "audio") {
           const preview = generateDocumentThumbnail(file, ext);
      
         let base64;
        try {
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch (err) {
          toast.error(`Failed to read audio file: ${file.name}`);
          return null;
        }
        const attachmentData = { type, preview,  data:base64, file, localUrl, name: file.name, mimeType, duration: 0 };
        const audio = document.createElement("audio");
        audio.src = localUrl || base64;
        await new Promise((resolve) => {
          audio.onloadedmetadata = () => {
            attachmentData.duration = audio.duration;
            resolve();
          };
          audio.onerror = () => {
            toast.error(`Failed to load audio metadata: ${file.name}`);
            resolve();
          };
        });
        return attachmentData;
      } else {
        let base64;
        try {
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        } catch (err) {
          toast.error(`Failed to read file: ${file.name}`);
          return null;
        }
         const attachmentData = { type, preview:null, data: base64, localUrl, name: file.name, mimeType };
        if (type === "audio") {
             const preview = generateDocumentThumbnail(file, ext);
      
          const audio = document.createElement("audio");
          audio.src = localUrl || base64;
          await new Promise((resolve) => {
            audio.onloadedmetadata = () => {
              attachmentData.duration = audio.duration;
              resolve();
            };
            audio.onerror = () => {
              toast.error(`Failed to load audio metadata: ${file.name}`);
              resolve();
            };
          });
        }

        return attachmentData ;
      }
    };
    const processed = await Promise.all(files.map(processFile));
    const validAttachments = processed.filter((a) => a !== null);
    const prevLength = attachments.length;
    setAttachments((prev) => [...prev, ...validAttachments]);
    if (type === "document" && validAttachments.length > 0) {
      setShowDocumentModal(true);
    } else if (type === "image" && validAttachments.length > 0) {
      setCropIndex(prevLength);
      setShowCropModal(true);
    }
    if (needTrim.length > 0) {
      setTrimQueue(needTrim);
      const first = needTrim[0];
      setVideoSrc(first.localUrl);
      setVideoDuration(first.duration);
      setTrimRange({ start: 0, end: Math.min(first.duration, 90) });
      setShowTrimModal(true);
    }
  };

  const handleTrim = async () => {
    if (!ffmpegRef.current || !videoSrc) {
      toast.error("Video processing module not loaded");
      return;
    }
    const { start, end } = trimRange;
    if (end - start > 90) {
      toast.error("Trimmed video cannot exceed 1:30");
      return;
    }
    try {
      const file = trimQueue[0].file;
      await ffmpegRef.current.writeFile("input.mp4", new Uint8Array(await file.arrayBuffer()));
      await ffmpegRef.current.exec(["-i", "input.mp4", "-ss", start.toString(), "-t", (end - start).toString(), "-c", "copy", "output.mp4"]);
      const data = await ffmpegRef.current.readFile("output.mp4");
      const blobOutput = new Blob([data.buffer], { type: "video/mp4" });
      const localUrl = URL.createObjectURL(blobOutput);
      setAttachments((prev) => [...prev, {
        type: "video",
        file: blobOutput, // Store Blob for upload
        localUrl,
        name: trimQueue[0].name,
        duration: end - start,
        mimeType: trimQueue[0].mimeType,
      }]);
      URL.revokeObjectURL(videoSrc);
      setTrimQueue((prev) => prev.slice(1));
      if (trimQueue.length > 1) {
        const next = trimQueue[1];
        setVideoSrc(next.localUrl);
        setVideoDuration(next.duration);
        setTrimRange({ start: 0, end: Math.min(next.duration, 90) });
      } else {
        setShowTrimModal(false);
        setVideoSrc(null);
      }
    } catch (error) {
      console.error("Trimming error:", error);
      toast.error("Failed to trim video");
    }
  };
console.log(replyTo)
  const skipTrim = () => {
    URL.revokeObjectURL(videoSrc);
    setTrimQueue((prev) => prev.slice(1));
    if (trimQueue.length > 1) {
      const next = trimQueue[1];
      setVideoSrc(next.localUrl);
      setVideoDuration(next.duration);
      setTrimRange({ start: 0, end: Math.min(next.duration, 90) });
    } else {
      setShowTrimModal(false);
      setVideoSrc(null);
    }
  };

  const handleCrop = useCallback(() => {
    if (!croppedAreaPixels || cropIndex < 0 || cropIndex >= attachments.length || !attachments[cropIndex].localUrl) {
      toast.error("Invalid image data for cropping");
      setShowCropModal(false);
      setCropIndex(-1);
      return;
    }
    try {
      const image = new Image();
      image.src = attachments[cropIndex].localUrl;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          image,
          croppedAreaPixels.x * scaleX,
          croppedAreaPixels.y * scaleY,
          croppedAreaPixels.width * scaleX,
          croppedAreaPixels.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        );
        canvas.toBlob((blob) => {
          const localUrl = URL.createObjectURL(blob);
          setAttachments((prev) => prev.map((a, i) => (i === cropIndex ? { ...a, file: blob, localUrl, mimeType: "image/jpeg" } : a)));
          const nextIndex = cropIndex + 1;
          if (nextIndex < attachments.length && attachments[nextIndex].type === "image") {
            setCropIndex(nextIndex);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
          } else {
            setShowCropModal(false);
            setCropIndex(-1);
          }
        }, "image/jpeg");
      };
      image.onerror = () => {
        toast.error("Failed to load image for cropping");
        setShowCropModal(false);
        setCropIndex(-1);
      };
    } catch (e) {
      console.error("Crop error:", e);
      toast.error("Failed to crop image");
      setShowCropModal(false);
      setCropIndex(-1);
    }
  }, [croppedAreaPixels, attachments, cropIndex]);

  const skipCrop = () => {
    const nextIndex = cropIndex + 1;
    if (nextIndex < attachments.length && attachments[nextIndex].type === "image") {
      setCropIndex(nextIndex);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } else {
      setShowCropModal(false);
      setCropIndex(-1);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const localUrl = URL.createObjectURL(blob);
        setAttachments((prev) => [...prev, {
          type: "audio",
          file: blob, // Store Blob for upload
          localUrl,
          name: `recording-${Date.now()}.webm`,
          mimeType: "audio/webm",
          duration: 0,
        }]);
        const audio = document.createElement("audio");
        audio.src = localUrl;
        audio.onloadedmetadata = () => {
          setAttachments((prev) => prev.map((a) => (a.localUrl === localUrl ? { ...a, duration: audio.duration } : a)));
        };
        audio.onerror = () => {
          toast.error("Failed to load recorded audio metadata");
        };
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      toast.error("Failed to start recording: Microphone access denied or unavailable");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const onEmojiClick = (emojiObject) => {
    setText((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    textAreaRef.current?.focus();
  };

  const removeAttachment = (index) => {
    const attachment = attachments[index];
    if (attachment?.localUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(attachment.localUrl);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    if (attachments.length === 1) {
      setShowDocumentModal(false);
    }
    if (showCropModal && cropIndex === index) {
      const nextIndex = attachments.findIndex((a, i) => i > index && a.type === "image");
      if (nextIndex !== -1) {
        setCropIndex(nextIndex);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } else {
        setShowCropModal(false);
        setCropIndex(-1);
      }
    }
  };

const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!text.trim() && !attachments.length) {
        toast.error("Message or attachment is required");
        return;
      }
      if (!selectedUser && !selectedGroup) {
        toast.error("No recipient selected");
        return;
      }
      if (isSoundEnabled) playRandomKeyStrokeSound();
      try {
        const preparedAttachments = await Promise.all(
          attachments.map(async (attachment) => {
            let attachData = { ...attachment };
            console.log(attachment)
            if (attachment.data.startsWith("blob:")) {
              const response = await fetch(attachment.data);
              const blob = await response.blob();
              const reader = new FileReader();
              await new Promise((res) => {
                reader.onloadend = res;
                reader.readAsDataURL(blob);
              });
              attachData = { ...attachment, data: reader.result };
            }
            return attachData;
          })
        );
        const tempText = text.trim();
        const tempAttachments = preparedAttachments;
        const tempReplyTo = replyTo;
        
        console.log(tempAttachments,"tempAttachments")
        setText("");
        setAttachments([]);
        setVideoSrc(null);
        setTrimQueue([]);
        setShowDocumentModal(false);
        setShowCropModal(false);
        setCropIndex(-1);
        setReplyTo(null);
        if (editingMessage) {
        const isGroup = !!selectedGroup;
        const tempEditingMessage = editingMessage
    const chatId = isGroup ? selectedGroup._id : editingMessage.receiverId._id
 // editingMessage.senderId._id === authUser._id ? editingMessage.receiverId._id : editingMessage.senderId._id;
   //   console.log(editingMessage, chatId, tempText)
   setEditingMessage(null);
       
       await editMessage(
tempEditingMessage._id,
tempText,
isGroup ? selectedGroup._id: undefined,
isGroup ? undefined : editingMessage.receiverId._id
);
       
        } else {
          const receiverId = selectedGroup ? undefined : selectedUser?._id;
         sendMessage({
            text: tempText,
            attachments: tempAttachments,
            groupId: selectedGroup?._id,
            receiverId: selectedUser?._id,
            replyTo: tempReplyTo,
          })
          
          //   text: tempText,
          //   attachments: tempAttachments,
          //   groupId: selectedGroup?._id,
          //   receiverId: selectedUser?._id,
          //   replyTo: tempReplyTo,
          // });
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";
        if (docInputRef.current) docInputRef.current.value = "";
        if (audioInputRef.current) audioInputRef.current.value = "";
     } catch (error) {
        toast.error("Failed to send message");
        console.error("Send message error:", error);
      }
    },
    [text, attachments, isSoundEnabled, playRandomKeyStrokeSound, sendMessage, selectedUser, selectedGroup, socket, authUser, replyTo, editingMessage, editMessage]
  );

  return (
    <>
      {isLoadingThumbnail && (
        <div className="text-slate-400 p-2">Generating thumbnail...</div>
      )}
      {/* {typingUsers.length > 0 && (
        <div className="text-slate-400 p-2">
          {typingUsers.length === 1
            ? `${typingUsers[0].userName} is typing...`
            : typingUsers.length === 2
            ? `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`
            : `${typingUsers.map((u) => u.userName).join(", ")} are typing...`}
        </div>
      )} */}
      <div className="flex p-4 bg-slate-800 border-t border-slate-700/50 items-center gap-2">
        {showEmojiPicker && (
          <div className="absolute bottom-[4rem] left-4 z-20">
            <EmojiPicker theme="system" onEmojiClick={onEmojiClick} />
          </div>
        )}
        {attached && (
          <div className="absolute p-3 gap-2 flex flex-col bg-slate-800 rounded-md bottom-[4rem] left-4 z-20">
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="py-2 flex items-center gap-2 text-slate-300 rounded-sm cursor-pointer transition-colors justify-start px-2 bg-slate-900 hover:bg-cyan-600/50"
            >
              <FileIcon size={16} /> Documents
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="py-2 flex items-center gap-2 text-slate-300 rounded-sm cursor-pointer transition-colors justify-start px-2 bg-slate-900 hover:bg-cyan-600/50"
            >
              <VideoIcon size={16} /> Videos
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2 flex items-center gap-2 text-slate-300 rounded-sm cursor-pointer transition-colors justify-start px-2 bg-slate-900 hover:bg-cyan-600/50"
            >
              <ImageIcon size={16} /> Images
            </button>
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="py-2 flex items-center gap-2 text-slate-300 rounded-sm cursor-pointer transition-colors justify-start px-2 bg-slate-900 hover:bg-cyan-600/50"
            >
              <MicIcon size={16} /> Audio File
            </button>
          </div>
        )}
        {replyTo && (
          <div className="absolute  p-3  gap-2 flex justify-start bg-slate-800 rounded-md bottom-[5rem] max-w-[100%] left-4 z-20 overflow-x-auto">
            <div className="flex p-3 flex-shrink-0 bg-slate-900 items-center relative">
            {
              replyTo.attachments?.length === 1 && <>
              {
                replyTo.attachments?.[0].attachmentType !== "video" &&
                <img src={replyTo.attachments?.[0].preview || replyTo.attachments?.[0].attachmentUrl} alt={replyTo.attachments[0].fullName} className="h-[50px] w-[50px] rounded mr-2 object-cover" />

              }
               { replyTo.attachments?.[0].attachmentType === "video" &&
                <img src="https://img.icons8.com/?size=100&id=Qiospk1eWgAj&format=png&color=000000" alt={replyTo.attachments[0].fullName} className="h-[50px] w-[50px] rounded mr-2 object-cover" />

              }
              </>
            }
            {
              replyTo.attachments?.length === 0 && replyTo.senderId._id.toString() !== authUser._id.toString() && <img src={replyTo.senderId.profilePic} alt={replyTo.senderId.fullName}className="h-[40px] w-[40px] rounded-full mr-2 object-cover" />
            }
             <div >
                {
                 replyTo.senderId._id.toString() === authUser._id.toString() && <p style={{color: replyTo.senderId.color}} className="font-semibold text-sm truncate">You</p>
              }
               {
               selectedUser &&  replyTo.senderId._id.toString() !== authUser._id.toString() && <p style={{color: replyTo.senderId.color}} className="font-semibold text-sm truncate">{replyTo.senderId.fullName}</p>
              }
              {
                   replyTo.attachments?.length > 0 && replyTo.text.trim() === "" && 
                   replyTo.attachments.slice(0, 3).map(attach => (
                  <div className="flex items-center gap-2" key={attach._id}>
                    <span className="text-slate-100">{attach.attachmentType == "audio" &&
                      <FileAudio size={19} />
                      }
                      {attach.attachmentType == "document" &&
                      <IoDocument size={19} />
                      }
                      {attach.attachmentType == "image" &&
                      <IoImage size={19} />
                      }
                      {attach.attachmentType == "video" &&
                      <IoVideocam size={19} />
                      }
                      </span>
                      <span key={attach._id} className="text-md text-slate-400" >{truncatePar(attach.originalName, 50)}</span>
                    </div>
                   ))
                   
              }

               {
                   replyTo.attachments?.length > 0 && replyTo.text.trim() !== "" && 
                  
                  <> 
                     <span className="text-md text-slate-400" >{truncatePar(replyTo.text, 50)}</span>
                   
                  {replyTo.attachments.slice(0, 2).map(attach => (
                  <div className="flex items-center gap-2" key={attach._id}>
                    <span className="text-slate-100">{attach.attachmentType == "audio" &&
                      <FileAudio size={19} />
                      }
                      {attach.attachmentType == "document" &&
                      <IoDocument size={19} />
                      }
                      {attach.attachmentType == "image" &&
                      <IoImage size={19} />
                      }
                      {attach.attachmentType == "video" &&
                      <IoVideocam size={19} />
                      }
                      </span>
                      <span key={attach._id} className="text-md text-slate-400" >{truncatePar(attach.originalName, 50)}</span>
                    </div>
                   ))}
                   </>
               }

               {
                  replyTo.attachments?.length === 0 &&
                  <span className="text-md text-slate-400" >{truncatePar(replyTo.text, 50)}</span>
               }
                       
             </div>
               <button className=" absolute right-0 top-0 text-xs mb-9 text-slate-400" onClick={() => setReplyTo(null)}><XIcon size={16} /></button>
            </div>
          </div>
        )}
        {editingMessage && (
        //  <div className="absolute  p-3  gap-2 flex justify-start bg-slate-800 rounded-md bottom-[4rem] left-4 z-20 overflow-x-auto">
        //     <div className="flex pt-5 items-center relative">
        //       <span  className="text-md text-slate-400"  >Editing:
        //         <br/> {truncatePar(editingMessage.text, 30)}</span>
        //       <button className=" absolute right-0 top-0 text-xs mb-9 text-slate-400" onClick={() => { setEditingMessage(null); setText(""); }}><XIcon size={16} /></button>
        //     </div>
        //   </div>

        <div className="absolute  p-3  gap-2 flex justify-start bg-slate-800 rounded-md bottom-[5rem] max-w-[100%] left-4 z-20 overflow-x-auto">
            <div className="flex p-3 flex-shrink-0 bg-slate-900 items-center relative">
            
             <div >
               
              {
                   editingMessage.attachments?.length > 0 && editingMessage.text.trim() === "" && 
                 <> <p className="font-semibold text-sm text-cyan-600 truncate">Add Message Text</p>
                    { editingMessage.attachments.slice(0, 3).map(attach => (
                  <div className="flex items-center gap-2" key={attach._id}>
                    <span className="text-slate-100">{attach.attachmentType == "audio" &&
                      <FileAudio size={19} />
                      }
                      {attach.attachmentType == "document" &&
                      <IoDocument size={19} />
                      }
                      {attach.attachmentType == "image" &&
                      <IoImage size={19} />
                      }
                      {attach.attachmentType == "video" &&
                      <IoVideocam size={19} />
                      }
                      </span>
                      <span key={attach._id} className="text-md text-slate-400" >{truncatePar(attach.originalName, 50)}</span>
                    </div>
                   ))}
               </>    
              }

               {
                   editingMessage.attachments?.length > 0 && editingMessage.text.trim() !== "" && 
                  
                  <> 
                    <p className="font-semibold text-sm text-cyan-600 truncate">Add Message Text</p>
                  
                  {replyTo.attachments.slice(0, 2).map(attach => (
                  <div className="flex items-center gap-2" key={attach._id}>
                    <span className="text-slate-100">{attach.attachmentType == "audio" &&
                      <FileAudio size={19} />
                      }
                      {attach.attachmentType == "document" &&
                      <IoDocument size={19} />
                      }
                      {attach.attachmentType == "image" &&
                      <IoImage size={19} />
                      }
                      {attach.attachmentType == "video" &&
                      <IoVideocam size={19} />
                      }
                      </span>
                      <span key={attach._id} className="text-md text-slate-400" >{truncatePar(attach.originalName, 50)}</span>
                    </div>
                   ))}
                   </>
               }
               
               {
                  editingMessage.attachments?.length === 0 &&
                  <> <p className="font-semibold text-sm text-cyan-600 truncate">Edit Message Text</p>
                   <span className="text-md text-slate-400" >{truncatePar(editingMessage.text, 50)}</span>
                 </>
               }
                       
             </div>
               <button className=" absolute right-0 top-0 text-xs mb-9 text-slate-400" onClick={() => { setEditingMessage(null); setText(""); }}><XIcon size={16} /></button>
            </div>
          </div>
        
        )}
        {attachments.length > 0 && (
          <div className="absolute p-3 gap-2 flex justify-start bg-slate-800 rounded-md bottom-[4rem] left-4 z-20 overflow-x-auto">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative min-w-[100px]">
                {attachment.type === "image" && attachment.data && (
                  <img src={attachment.data} alt="attachment" className="h-40 w-40 rounded" />
                )}
                {attachment.type === "video" && attachment.data && (
                  <video src={attachment.data} controls className="max-w-xs rounded" />
                )}
                {attachment.type === "audio" && attachment.data && (
                  <audio src={attachment.data} controls />
                )}
                {attachment.type === "document" && (
                  <div className="flex items-center gap-2">
                    <img src={attachment.preview} alt="doc preview" className="w-8 h-8" />
                    <div>
                      <span className="text-xs font-medium text-slate-100">{truncatePar(attachment.name, 20)}</span>
                      <span className="text-xs text-slate-400">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.ext.toUpperCase()})
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute top-0 right-0 text-slate-400 hover:text-slate-200"
                >
                  <XIcon size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center justify-start gap-2 flex-1">
          <div className="flex py-2 px-3 rounded-md items-center bg-slate-900 w-full gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowEmojiPicker(false);
                setAttached(!attached);
              }}
              className="text-slate-400 hover:text-slate-200"
            >
              <MdAttachFile size={24} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowEmojiPicker(!showEmojiPicker);
                setAttached(false);
              }}
              className="text-slate-400 hover:text-slate-200"
            >
              <SmileIcon size={24} />
            </button>
            <input
              value={text}
              onFocus={() => {
                setShowEmojiPicker(false);
                setAttached(false);
              }}
              onChange={(e) => setText(e.target.value)}
              className="bg-transparent border-none outline-none border-slate-700/50 rounded-lg px-2 text-slate-200 w-full text-sm sm:text-base"
              placeholder={editingMessage ? "Edit your message..." : replyTo ? "Reply message..." : "Type your message..."}
            />
            {!isRecording && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  startRecording();
                  setAttached(false);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <IoMicSharp size={24} />
              </button>
            )}
            {isRecording && (
              <button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700"
              >
                <IoMicOff size={24} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon size={24} />
          </button>
        </form>
            {/* <form onSubmit={handleSendMessage} className="flex items-center justify-start gap-2 flex-1">
           <div className="flex py-2 px-3 rounded-lg items-center bg-slate-800 w-full gap-2">
         <button
              onClick={(e) => {
                e.preventDefault();
                setShowEmojiPicker(false);
                setAttached(!attached);
              }}
              className="text-slate-400 hover:text-slate-200"
            >
              <MdAttachFile size={24} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowEmojiPicker(!showEmojiPicker);
                setAttached(false);
              }}
              className="text-slate-400 hover:text-slate-200"
            >
              <SmileIcon size={24} />
            </button>
            <textarea
              ref={textAreaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 bg-transparent border-none outline-none text-slate-200 rounded-lg p-2 resize-none text-sm sm:text-base"
              placeholder={editingMessage ? "Edit your message..." : replyTo ? "Reply message..." : "Type your message..."}
              rows={2}
            />
            {!isRecording && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  startRecording();
                  setAttached(false);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <IoMicSharp size={24} />
              </button>
            )}
            {isRecording && (
              <button
                onClick={stopRecording}
                className="text-red-600 hover:text-red-700"
              >
                <IoMicOff size={24} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-cyan-600 text-white rounded-lg px-4 py-2 hover:bg-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!text.trim() && !attachments.length}
          >
            <SendIcon size={24} />
          </button>
        </form> */}
      </div>
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={(e) => handleAttachmentChange(e, "image")}
        style={{ display: "none" }}
      />
      <input
        type="file"
        multiple
        accept="video/*"
        ref={videoInputRef}
        onChange={(e) => handleAttachmentChange(e, "video")}
        style={{ display: "none" }}
      />
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.zip"
        ref={docInputRef}
        onChange={(e) => handleAttachmentChange(e, "document")}
        style={{ display: "none" }}
      />
      <input
        type="file"
        multiple
        accept="audio/*"
        ref={audioInputRef}
        onChange={(e) => handleAttachmentChange(e, "audio")}
        style={{ display: "none" }}
      />
      {showCropModal && cropIndex >= 0 && cropIndex < attachments.length && attachments[cropIndex].data && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-4 rounded-lg max-w-lg w-full">
            <h3 className="text-white mb-4">Crop Image</h3>
            <div className="relative h-64">
              <Cropper
                image={attachments[cropIndex].data}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                style={{ containerStyle: { height: "100%", width: "100%" } }}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCrop}
                className="flex-1 bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700"
              >
                Crop
              </button>
              <button
                onClick={skipCrop}
                className="flex-1 bg-slate-900 text-white py-2 rounded hover:bg-cyan-600/50"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropIndex(-1);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showTrimModal && trimQueue.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-4 rounded-lg max-w-lg w-full">
            <h3 className="text-white mb-4">Trim Video (Max 1:30)</h3>
            <video
              ref={videoRef}
              src={videoSrc}
              onLoadedMetadata={(e) => setVideoDuration(e.target.duration)}
              controls
              className="w-full mb-4"
            />
            <div className="text-white mb-2">
              Start: {trimRange.start.toFixed(2)}s
              <input
                type="range"
                min={0}
                max={videoDuration - (trimRange.end - trimRange.start)}
                value={trimRange.start}
                onChange={(e) => setTrimRange({ ...trimRange, start: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="text-white mb-4">
              End: {trimRange.end.toFixed(2)}s (Max {Math.min(trimRange.start + 90, videoDuration).toFixed(2)}s)
              <input
                type="range"
                min={trimRange.start}
                max={Math.min(trimRange.start + 90, videoDuration)}
                value={trimRange.end}
                onChange={(e) => setTrimRange({ ...trimRange, end: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTrim}
                className="flex-1 bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700"
              >
                Trim
              </button>
              <button
                onClick={skipTrim}
                className="flex-1 bg-slate-900 text-white py-2 rounded hover:bg-cyan-600/50"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setShowTrimModal(false);
                  setVideoSrc(null);
                  setTrimQueue([]);
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showDocumentModal && attachments.some((a) => a.type === "document") && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-4 rounded-lg max-w-lg w-full">
            <h3 className="text-white mb-4">Preview Documents</h3>
            {attachments
              .filter((a) => a.type === "document")
              .map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <img src={attachment.preview} alt="doc preview" className="w-8 h-8" />
                  <span className="text-white">{truncatePar(attachment.name, 35)}</span>
                  <span className="text-xs text-slate-400">
                    {(attachment.size / 1024 / 1024).toFixed(2)} MB • {attachment.ext.toUpperCase()}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              ))}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                }}
                className="flex-1 bg-cyan-600 text-white py-2 rounded hover:bg-cyan-700"
              >
                Ok
              </button>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setAttachments(attachments.filter((a) => a.type !== "document"));
                }}
                className="flex-1 bg-slate-900 text-white py-2 rounded hover:bg-cyan-600/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MessageInput;