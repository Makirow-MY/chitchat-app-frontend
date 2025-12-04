// src/components/CallUI.js (New component for call interface, styled like WhatsApp)
import React, { useEffect, useRef, useState } from "react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { PhoneOffIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, UsersIcon } from "lucide-react";
import toast from "react-hot-toast";

const CallUI = () => {
  const {
    activeCall,
    incomingCall,
    isCalling,
    isRinging,
    isInCall,
    callType,
    isGroupCall,
    participants,
    mediaStreams,
    peerConnections,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    addMediaStream,
    addPeerConnection
  } = useCallStore();
  const { authUser, socket } = useAuthStore();
  const localVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (isInCall || isCalling || isRinging) {
      setupMedia();
    }
  }, [isInCall, isCalling, isRinging]);

  const setupMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video"
      });
      addMediaStream(authUser._id, stream);
      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error("Failed to access media devices");
    }
  };

  const handleAccept = () => acceptCall(incomingCall._id);
  const handleReject = () => rejectCall(incomingCall._id);
  const handleEnd = () => endCall(activeCall._id);
  const toggleMute = () => {
    const stream = mediaStreams[authUser._id];
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  const toggleVideo = () => {
    const stream = mediaStreams[authUser._id];
    if (stream && callType === "video") {
      stream.getVideoTracks()[0].enabled = !isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  if (isRinging) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-50">
        <img src={incomingCall.caller.profilePic} alt="Caller" className="w-24 h-24 rounded-full mb-4" />
        <h2 className="text-white text-xl mb-2">{incomingCall.caller.fullName} is calling...</h2>
        <p className="text-slate-300 mb-6">{callType === "voice" ? "Voice Call" : "Video Call"}</p>
        <div className="flex gap-4">
          <button onClick={handleAccept} className="bg-green-500 p-4 rounded-full">
            <PhoneIcon className="text-white" />
          </button>
          <button onClick={handleReject} className="bg-red-500 p-4 rounded-full">
            <PhoneOffIcon className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  if (isCalling) {
    return (
      <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-50">
        <h2 className="text-white text-xl mb-4">Calling {activeCall?.target?.fullName || activeCall?.group?.name}...</h2>
        <button onClick={handleEnd} className="bg-red-500 p-4 rounded-full">
          <PhoneOffIcon className="text-white" />
        </button>
      </div>
    );
  }

  if (isInCall) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col z-50">
        <div className="flex-1 relative">
          {callType === "video" && (
            <>
              <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-4 right-4 w-32 h-32 rounded-lg object-cover" />
              {Object.entries(mediaStreams).map(([id, stream]) => id !== authUser._id && (
                <video key={id} srcObject={stream} autoPlay playsInline className="w-full h-full object-cover" />
              ))}
            </>
          )}
        </div>
        <div className="bg-[var(--bg-secondary)] p-4 flex justify-around">
          <button onClick={toggleMute} className="text-white">
            {isMuted ? <MicOffIcon /> : <MicIcon />}
          </button>
          {callType === "video" && (
            <button onClick={toggleVideo} className="text-white">
              {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
            </button>
          )}
          <button onClick={handleEnd} className="text-red-500">
            <PhoneOffIcon />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default CallUI;