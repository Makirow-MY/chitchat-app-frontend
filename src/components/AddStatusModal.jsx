// src/components/AddStatusModal.jsx
import { useState, useRef, useEffect } from "react";
import { FiCamera, FiVideo, FiMic, FiType, FiX, FiSend, FiSmile, FiCameraOff, FiRepeat } from "react-icons/fi";
import { MdOutlineColorLens } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";
import { useStatusStore } from "../store/useStatusStore";
import toast from "react-hot-toast";
import { FiMicOff } from "react-icons/fi";

const COLORS = ["#000000", "#1a1a1a", "#2d3748", "#1e40af", "#7c3aed", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2"];
const FONT_STYLES = [
  { name: "Sans", value: "font-sans" },
  { name: "Serif", value: "font-serif" },
  { name: "Mono", value: "font-mono" },
  { name: "Hand", value: "font-hand" },
];

export default function AddStatusModal({ onClose }) {
  const [step, setStep] = useState("type"); // type | camera | voice | edit | text
  const [media, setMedia] = useState(null); // { url, type, file, duration? }
  const [caption, setCaption] = useState("");
  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontStyle, setFontStyle] = useState("font-sans");
  const [showEmoji, setShowEmoji] = useState(false);
  const [privacy, setPrivacy] = useState("all");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState("user"); // user | environment
  const [flashOn, setFlashOn] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);

  const { createStatus, isLoading } = useStatusStore();

  // ─────────────────────────────────────
  // CAMERA
  // ─────────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStep("camera");
    } catch (err) {
      toast.error("Camera access denied");
    }
  };

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    stopCamera();
    startCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setMedia({ url, type: "image", file: blob });
      setStep("edit");
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  // ─────────────────────────────────────
  // VIDEO RECORDING (inside camera)
  // ─────────────────────────────────────
  const startVideoRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true,
    });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const duration = Math.round(videoRef.current?.duration || 30);
      setMedia({ url, type: "video", file: blob, duration });
      setStep("edit");
      stopCamera();
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecordingVideo(true);
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const stopVideoRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecordingVideo(false);
  };

  // ─────────────────────────────────────
  // VOICE RECORDING
  // ─────────────────────────────────────
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      let seconds = 0;

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMedia({ url, type: "voice", file: blob, duration: seconds });
        setStep("edit");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        if (seconds >= 60) stopVoiceRecording(); // max 60s
      }, 1000);

      setStep("voice");
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopVoiceRecording = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  // ─────────────────────────────────────
  // FILE PICKER
  // ─────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    const duration = type === "video" ? null : undefined; // will extract later
    setMedia({ url, type, file, duration });
    setStep("edit");
  };

  // ─────────────────────────────────────
  // UPLOAD
  // ─────────────────────────────────────
  const uploadStatus = async () => {
    if (!media && !caption.trim()) return toast.error("Add media or text");

const mediaType = media?.type || "text";
toast.loading(`Uploading ${mediaType} status...`);

    const formData = new FormData();
    formData.append("type", media?.type || "text");
    formData.append("caption", caption);
    formData.append("privacy", privacy);

    if (mediaType === "text" ) {
      formData.append("backgroundColor", bgColor);
      formData.append("textColor", textColor);
      formData.append("fontStyle", fontStyle.replace("font-", ""));
    } else {
      formData.append("content", media.file);
      if (media.duration) formData.append("duration", media.duration);
    }

    try {
      await createStatus(formData);
      onClose();
      toast.dismiss();
      toast.success("Status uploaded");
    } catch (err) {
       toast.dismiss();
     // toast.error("Upload failed");
    }
  };

  // ─────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
    };
  }, []);

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-main)] rounded-2xl w-full max-w-md overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <button onClick={onClose} className="text-xl text-[var(--text-primary)]"><FiX /></button>
          <h3 className="font-bold text-[var(--text-primary)]">Add Status</h3>
          <div className="w-8" />
        </div>

        {/* TYPE SELECTION */}
        {step === "type" && (
          <div className="p-6 space-y-4">
            <button onClick={startCamera} className="w-full flex items-center gap-4 p-4 bg-[var(--color-primary-hover)] rounded-xl hover:bg-[var(--color-primary)] transition">
              <FiCamera size={28} className="text-cyan-500" />
              <div className="text-left text-[var(--text-primary)]">
                <p className="font-medium">Camera</p>
                <p className="text-xs opacity-70">Take photo or record video</p>
              </div>
            </button>

            <label className="w-full flex items-center gap-4 p-4 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 cursor-pointer transition">
              <FiVideo size={28} className="text-purple-500" />
              <div className="text-left text-[var(--text-primary)]">
                <p className="font-medium">Gallery</p>
                <p className="text-xs opacity-70">Choose photo or video</p>
              </div>
              <input type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
            </label>

            <button onClick={() => setStep("text")} className="w-full flex items-center gap-4 p-4 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition">
              <FiType size={28} className="text-green-500" />
              <div className="text-left text-[var(--text-primary)]">
                <p className="font-medium">Text</p>
                <p className="text-xs opacity-70">Type a status</p>
              </div>
            </button>

            <button onClick={startVoiceRecording} className="w-full flex items-center gap-4 p-4 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition">
              <FiMic size={28} className="text-red-500" />
              <div className="text-left text-[var(--text-primary)]">
                <p className="font-medium">Voice Note</p>
                <p className="text-xs opacity-70">Record up to 60 seconds</p>
              </div>
            </button>
          </div>
        )}

        {/* CAMERA */}
        {step === "camera" && (
          <div className="relative h-96 bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            <canvas ref={canvasRef} className="hidden" />

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
              <button onClick={() => setStep("type")} className="btn btn-circle btn-ghost text-[var(--text-primary)]">
                <FiX />
              </button>

              {isRecordingVideo ? (
                <button onClick={stopVideoRecording} className="btn btn-circle btn-error btn-lg">
                  <div className="w-6 h-6 bg-white rounded-full animate-pulse" />
                </button>
              ) : (
                <>
                  <button onClick={capturePhoto} className="btn btn-circle btn-primary btn-lg">
                    <div className="w-8 h-8 bg-white rounded-full" />
                  </button>
                  <button onClick={startVideoRecording} className="btn btn-circle btn-ghost text-[var(--text-primary)]">
                    <FiVideo size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between text-[var(--text-primary)]">
              <button onClick={flipCamera} className="btn btn-circle btn-ghost">
                <FiRepeat />
              </button>
              <button onClick={() => setFlashOn(!flashOn)} className="btn btn-circle btn-ghost">
                {flashOn ? <FiCamera /> : <FiCameraOff />}
              </button>
            </div>
          </div>
        )}

        {/* VOICE RECORDING */}
        {step === "voice" && (
          <div className="h-96 flex flex-col items-center justify-center gap-6 p-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                <FiMic size={48} className="text-red-500" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{recordingTime}s</p>
            <p className="text-sm text-[var(--text-primary)]/70">Recording... Slide to cancel</p>
            <button onClick={stopVoiceRecording} className="btn btn-circle btn-error">
              <FiX />
            </button>
          </div>
        )}

        {/* EDIT MEDIA */}
        {step === "edit" && media && (
          <div className="relative h-96 bg-black">
            {media.type === "image" ? (
              <img src={media.url} className="w-full h-full object-contain" alt="preview" />
            ) : media.type === "video" || media.type === "voice" ? (
              <video src={media.url} controls className="w-full h-full object-contain" />
            ) : null}

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="flex-1 bg-white/20 backdrop-blur text-[var(--text-primary)] placeholder-white/60 px-4 py-2 rounded-full"
                />
                <button onClick={() => setShowEmoji(!showEmoji)}>
                  <FiSmile className="text-[var(--text-primary)] text-xl" />
                </button>
                <button onClick={uploadStatus} disabled={isLoading} className="btn btn-circle btn-success">
                  <FiSend />
                </button>
              </div>

              {/* Privacy */}
              <div className="flex justify-center gap-4 text-xs text-[var(--text-primary)]">
                {["all", "selected", "exclude"].map((p) => (
                  <label key={p} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="privacy"
                      value={p}
                      checked={privacy === p}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="radio radio-xs"
                    />
                    <span className="capitalize">{p === "all" ? "My Contacts" : p === "selected" ? "Only Share With..." : "Exclude..."}</span>
                  </label>
                ))}
              </div>

              {showEmoji && (
                <div className="absolute bottom-16 left-4">
                  <EmojiPicker onEmojiClick={(e) => setCaption((c) => c + e.emoji)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TEXT STATUS */}
        {step === "text" && (
          <div className="h-96 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: bgColor }}>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Type something..."
                className={`w-full h-full bg-transparent outline-none resize-none text-center ${fontStyle} text-3xl`}
                style={{ color: textColor }}
              />
            </div>
            <div className="p-4 space-y-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2">
                <MdOutlineColorLens className="text-xl text-[var(--text-primary)]" />
                <div className="flex gap-2 flex-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${bgColor === c ? "ring-2 ring-offset-2 ring-white" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {FONT_STYLES.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFontStyle(f.value)}
                    className={`flex-1 py-2 rounded-lg text-sm ${fontStyle === f.value ? "bg-primary text-[var(--text-primary)]" : "bg-base-200"}`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
              <button onClick={uploadStatus} className="btn btn-success w-full">
                <FiSend /> Post Text Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}