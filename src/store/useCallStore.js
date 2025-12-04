import { create } from 'zustand';
import { axiosInstance } from "../lib/axios";
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';
import { useNavigate } from 'react-router-dom';

// GLOBAL NAVIGATE FOR REDIRECTS
//const navigate = useNavigate(); // SOLVES: redirect to /call on join

export const useCallStore = create((set, get) => ({
  activeCall: null,           // Current call object
  incomingCall: null,         // Incoming call data
  callStates: {},             // { callId: { userId: "You started a call" } } → DYNAMIC MESSAGE
  isRinging: false,           // Ringer UI control
  isInCall: false,            // In-call UI state
  localStream: null,          // Your mic/camera
  remoteStreams: {},          // { userId: MediaStream }
  isMuted: false,             // Mute toggle
  isVideoOn: true,            // Video toggle
  callMessage: "",            // LIVE CALL MESSAGE (changes per state)

  // ==================== SOCKET INITIALIZATION ====================
  initSocket: () => {
    const socket = useAuthStore.getState().socket;
    const { authUser } = useAuthStore.getState();
    if (!socket || !authUser) return;

    // SOLVES: INCOMING CALLS NOT RECEIVED
    // socket.on('initiateCall', (data) => {
    //   const { callId, caller } = data;
    //   const isCaller = caller._id === authUser._id;

    //   set({
    //     incomingCall: isCaller ? null : data,
    //     isRinging: !isCaller,
    //     activeCall: isCaller ? data : null,
    //     callMessage: isCaller ? "You started a call" : `${caller.fullName} is calling`
    //   });

    //   // AUTO NAVIGATE CALLER
    //   if (isCaller) navigate('/call');
    //   else toast(`Incoming ${data.type} call...`, { icon: '📞' });
    // });

    // SOLVES: USER JOINS → MESSAGE UPDATES LIVE
    socket.on('callJoined', ({ userId }) => {
      const name = userId === authUser._id ? "You" : "User";
      set({ isInCall: true, isRinging: false, callMessage: `${name} joined the call` });
      navigate('/call');
    });

    // SOLVES: CALL MESSAGE CONSTANTLY UPDATES PER USER
    socket.on('callStateUpdate', ({ callId, userId, text, stage }) => {
      set((state) => ({
        callStates: {
          ...state.callStates,
          [callId]: { ...state.callStates[callId], [userId]: text }
        },
        callMessage: text // LIVE UPDATE RECENT MESSAGE
      }));
    });

    // SOLVES: CALL ENDED → CLEANUP + MESSAGE
    socket.on('callEnded', ({ duration }) => {
      set({
        activeCall: null,
        incomingCall: null,
        isInCall: false,
        isRinging: false,
        callMessage: `Call ended • ${formatDuration(duration)}`,
        localStream: null,
        remoteStreams: {},
        isMuted: false,
        isVideoOn: true
      });
      toast("Call ended");
      navigate(-1);
    });

    // SOLVES: MISSED CALL → MESSAGE + NOTIFY
    socket.on('callMissed', () => {
      set({ isRinging: false, incomingCall: null, callMessage: "Missed call" });
      toast.error("Call missed");
    });

    // SOLVES: USER KICKED
    socket.on('participantKicked', ({ userId }) => {
      if (userId === authUser._id) {
        set({ activeCall: null, isInCall: false, callMessage: "You were removed" });
        toast("Removed from call");
        navigate(-1);
      } else {
        set({ callMessage: "User removed" });
        get().removeRemoteStream(userId);
      }
    });

    // SOLVES: USER LEFT
    socket.on('participantLeft', ({ userId, newCaller }) => {
      set({ callMessage: "User left the call" });
      get().removeRemoteStream(userId);
      if (newCaller) set((state) => ({ activeCall: { ...state.activeCall, caller: newCaller } }));
    });

    // SOLVES: INCOMING CALL DURING ACTIVE CALL
    socket.on('incomingDuringCall', (data) => {
      toast(`Incoming call from ${data.caller.fullName}`, {
        action: { label: "Answer", onClick: () => get().acceptCall(data.callId) }
      });
    });
  },

  // ==================== MEDIA CONTROLS ====================
  setLocalStream: (stream) => set({ localStream: stream }),
  addRemoteStream: (userId, stream) => set((state) => ({
    remoteStreams: { ...state.remoteStreams, [userId]: stream }
  })),
  removeRemoteStream: (userId) => set((state) => {
    const newStreams = { ...state.remoteStreams };
    delete newStreams[userId];
    return { remoteStreams: newStreams };
  }),

  // SOLVES: MUTE SELF
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = isMuted);
      set({ isMuted: !isMuted, callMessage: isMuted ? "Unmuted" : "Muted" });
    }
  },

  // SOLVES: TOGGLE VIDEO (ONE-SIDED)
  toggleVideo: () => {
    const { localStream, isVideoOn } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
      set({ isVideoOn: !isVideoOn, callMessage: isVideoOn ? "Camera off" : "Camera on" });
    }
  },

  // SOLVES: SWITCH CALL TYPE (VOICE ↔ VIDEO)
  switchCallType: async (newType) => {
    const { activeCall } = get();
    if (!activeCall) return;
    await axiosInstance.post(`/calls/switch/${activeCall._id}`, { type: newType });
    set({ callMessage: `Switched to ${newType}` });
  },

  // ==================== CALL ACTIONS ====================
  initiateCall: async (type, targetId, isGroup) => {
    try {
      const res = await axiosInstance.post('/calls/initiate', { type, targetId, isGroup });
      set({
        activeCall: res.data,
        isInCall: true,
        isRinging: false,
        callMessage: "You started a call"
      });
      navigate('/call');
      return res.data;
    } catch (err) {
      toast.error("Failed to start call");
    }
  },

  acceptCall: async (callId) => {
    try {
      await axiosInstance.post(`/calls/accept/${callId}`);
      set({ isInCall: true, isRinging: false, incomingCall: null, callMessage: "You joined the call" });
      navigate('/call');
    } catch (err) {
      toast.error("Failed to accept");
    }
  },

  rejectCall: async (callId) => {
    try {
      await axiosInstance.post(`/calls/reject/${callId}`);
      set({ isRinging: false, incomingCall: null, activeCall:null, callMessage: "Call rejected" });
    } catch (err) {
      toast.error("Failed to reject");
    }
  },

  // SOLVES: CALLER KICKS USER
  kickUser: async (userId) => {
    const { activeCall } = get();
    if (!activeCall || activeCall.caller._id !== useAuthStore.getState().authUser._id) {
      toast.error("Only caller can remove");
      return;
    }
    await axiosInstance.post(`/calls/kick/${activeCall._id}/${userId}`);
    set({ callMessage: "User removed" });
  },

  endCall: async (callId) => {
    try {
      await axiosInstance.post(`/calls/end/${callId}`);
      set({
        activeCall: null,
        isInCall: false,
        isRinging: false,
        localStream: null,
        remoteStreams: {},
        callMessage: "Call ended"
      });
      navigate(-1);
    } catch (err) {
      toast.error("Failed to end call");
    }
  },

  leaveCall: async (callId) => {
    await get().endCall(callId);
  },

  reset: () => set({
    activeCall: null,
    incomingCall: null,
    isRinging: false,
    isInCall: false,
    callStates: {},
    callMessage: ""
  })
}));

// HELPER
const formatDuration = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
};


// // frontend/stores/useCallStore.js
// import { create } from 'zustand';
// import { axiosInstance } from "../lib/axios";
// import toast from 'react-hot-toast';
// import { useAuthStore } from './useAuthStore';

// export const useCallStore = create((set, get) => ({
//   activeCall: null,
//   incomingCall: null,
//   callStates: {}, // { callId: { userId: "You started a call" } }
//   isRinging: false,
//   isInCall: false,
//   localStream: null,
//   remoteStreams: {},

//   // CALL THIS FROM YOUR MAIN APP (e.g. App.jsx)
//   initSocket: () => {
//      const socket = useAuthStore.getState().socket;
//      const { authUser } = useAuthStore.getState();
           
//      if (!socket) {
//           console.error("Socket not available. Listeners not initialized.");
//           return;
//         }
//     if (!socket || !authUser) return;

//     socket.on('initiateCall', (data) => {
//       const { callId, caller } = data;
//       const isCaller = caller === authUser._id;

//       set({
//         activeCall: { ...data, status: 'ringing', caller },
//         isRinging: !isCaller,
//         incomingCall: isCaller ? null : data
//       });

//       if (isCaller) navigate('/call');
//     });

//     socket.on('callJoined', () => {
//       set({ isInCall: true, isRinging: false });
//       navigate('/call');
//     });

//     socket.on('callStateUpdate', ({ callId, userId, text }) => {
//       set((state) => ({
//         callStates: {
//           ...state.callStates,
//           [callId]: {
//             ...state.callStates[callId],
//             [userId]: text
//           }
//         }
//       }));
//     });

//     socket.on('callEnded', () => {
//       set({
//         activeCall: null,
//         incomingCall: null,
//         isInCall: false,
//         isRinging: false,
//         callStates: {}
//       });
//       navigate(-1);
//     });

//     socket.on('callMissed', () => {
//       set({ isRinging: false, incomingCall: null });
//       toast.error("Call missed");
//     });
//   },

//   setLocalStream: (stream) => set({ localStream: stream }),
//   addRemoteStream: (userId, stream) => set((state) => ({
//     remoteStreams: { ...state.remoteStreams, [userId]: stream }
//   })),
//   removeRemoteStream: (userId) => set((state) => {
//     const newStreams = { ...state.remoteStreams };
//     delete newStreams[userId];
//     return { remoteStreams: newStreams };
//   }),

//   initiateCall: async (type, targetId, isGroup) => {
//     try {
//       const res = await axiosInstance.post('/calls/initiate', { type, targetId, isGroup });
//       set({ activeCall: res.data, isInCall: true, isRinging: false });
//       return res.data;
//     } catch (err) {
//       toast.error("Failed to start call");
//     }
//   },

//   acceptCall: async (callId) => {
//     try {
//       await axiosInstance.post(`/calls/accept/${callId}`);
//       set({ isInCall: true, isRinging: false, incomingCall: null });
//     } catch (err) {
//       toast.error("Failed to accept");
//     }
//   },

//   rejectCall: async (callId) => {
//     try {
//       await axiosInstance.post(`/calls/reject/${callId}`);
//       set({ isRinging: false, incomingCall: null });
//     } catch (err) {
//       toast.error("Failed to reject");
//     }
//   },

//   endCall: async (callId) => {
//     try {
//       await axiosInstance.post(`/calls/end/${callId}`);
//       set({
//         activeCall: null,
//         isInCall: false,
//         isRinging: false,
//         localStream: null,
//         remoteStreams: {}
//       });
//     } catch (err) {
//       toast.error("Failed to end call");
//     }
//   },

//   leaveCall: async (callId) => {
//     await get().endCall(callId);
//   },

//   reset: () => set({
//     activeCall: null,
//     incomingCall: null,
//     isRinging: false,
//     isInCall: false,
//     callStates: {}
//   })
// }));