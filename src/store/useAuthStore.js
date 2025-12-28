import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  showmedia: false,
  socket: null,
  isOnline: false, // Tracks socket connection status
  onlineUsers: [],
  reconnectionAttempts: 0, // Track reconnection attempts for backoff
setTheme: (content) => set({ theme: content }), 
theme: window.localStorage.getItem("theme") || "dark"  ,
  setShowMedia: (value) => set({ showmedia: value }),

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
     // Inside checkAuth, login, signup → after set({ authUser })
get().connectSocket();
get().setupConnectionRecovery(); // ← ADD THIS LINE
    //  useAuthStore.getState().getMyChatPartners()
    } catch (error) {
      console.error("Error in checkAuth:", error);
      set({ authUser: null });
    // get().logout()
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully!");
// Inside checkAuth, login, signup → after set({ authUser })
get().connectSocket();
get().setupConnectionRecovery(); // ← ADD THIS LINE
    } catch (error) {
      console.log("Error in signup:", error);
      
      toast.error(error.response?.data?.message || "Error signing up");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      // Inside checkAuth, login, signup → after set({ authUser })
get().connectSocket();
get().setupConnectionRecovery(); // ← ADD THIS LINE
    } catch (error) {
      console.error("Error in login:", error);
      toast.error(error.response?.data?.message || "Error logging in");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, onlineUsers: [], socket: null, isOnline: false, reconnectionAttempts: 0 });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.response?.data?.message || "Error logging out");
    }
  },

  updateProfile: async (data) => {
     const { socket } = get();
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      if (!data.groupId) {
        set({ authUser: res.data.user });
        toast.success("Profile updated successfully");
      } else {
         socket.emit("groupUpdated", res.data.group);
         useChatStore.getState().getMessagesByGroupId(data.groupId);
        useChatStore.getState().getGroupChats()
        toast.success("Group profile updated successfully");
      }
    } catch (error) {
      console.error("Error in update profile:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    }
  },
// === ADD THIS: FORCE RECONNECT ON VISIBILITY / NETWORK ===
setupConnectionRecovery: () => {
  const handleOnline = () => {
    const { socket } = get();
    if (!socket?.connected) {
      console.log("[SOCKET] Network back → forcing reconnect");
      socket?.connect();
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      handleOnline();
    }
  };

  window.addEventListener("online", handleOnline);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    window.removeEventListener("online", handleOnline);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
},
  // connectSocket: () => {
  //   const { authUser, socket, reconnectionAttempts } = get();
  //   if (!authUser || socket?.connected) return;

  //   // Clean up any existing socket
  //   if (socket) {
  //     socket.disconnect();
  //   }

  //   const newSocket = io(BASE_URL, {
  //     withCredentials: true,
  //     query: { userId: authUser._id },
  //     reconnection: true, // Enable automatic reconnection
  //     reconnectionAttempts: Infinity, // Keep trying until logout
  //     reconnectionDelay: Math.min(1000 * 2 ** reconnectionAttempts, 10000), // Exponential backoff, max 10s
  //     transports: ["websocket", "polling"], // Fallback to polling if websocket fails
  //   });

  //   newSocket.on("connect", () => {
  //     console.log(`Socket connected for user ${authUser._id}`);
  //     set({ socket: newSocket, isOnline: true, reconnectionAttempts: 0 });
  //     toast.dismiss();
  //     toast.success("Connected online");
  //     // Sync offline actions
  //     useChatStore.getState().syncOfflineActions();
  //     // Rejoin rooms
  //     useChatStore.getState().initializeSocketListeners(newSocket);
  //   });

  //   newSocket.on("connect_error", (error) => {
  //     console.error("Socket connection error:", error);
  //     set({ isOnline: false });
  //     set((state) => ({ reconnectionAttempts: state.reconnectionAttempts + 1 }));
  //     toast.error("Connection failed, retrying...");
  //     // Token invalid, force logout
  //     if (error.message.includes("Unauthorized")) {
  //       get().logout();
  //     }
  //   });

  //   newSocket.on("disconnect", (reason) => {
  //     console.log(`Socket disconnected for user ${authUser._id}: ${reason}`);
  //     set({ isOnline: false });
  //     if (reason !== "io client disconnect") {
  //       // Auto-reconnect unless explicit logout
  //       toast.loading("Disconnected, attempting to reconnect...");
  //     }
  //   });

  //   newSocket.on("getOnlineUsers", (userIds) => {
  //     set({ onlineUsers: userIds });
  //   });
  // },

  // === REPLACE THE ENTIRE connectSocket FUNCTION WITH THIS ===
connectSocket: () => {
  const { authUser, socket } = get();
  if (!authUser || socket?.connected) return;

  // Clean up old socket
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const BASE_URL = import.meta.env.MODE === "development" 
    ? "http://localhost:5000" 
    : "/";

  const newSocket = io(BASE_URL, {
    withCredentials: true,
    query: { userId: authUser._id },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5, // Add jitter
    timeout: 20000,
    forceNew: true,
    upgrade: true,
    // Heartbeat
    pingInterval: 10000,   // Server must support
    pingTimeout: 5000,
  });

  // === CONNECTION SUCCESS ===
  newSocket.on("connect", () => {
    console.log(`[SOCKET] Connected: ${authUser._id}`);
    set({ 
      socket: newSocket, 
      isOnline: true, 
      reconnectionAttempts: 0 
    });
    toast.dismiss();
    toast.success("Connected", { duration: 2000 });

    // Critical: Rejoin all rooms
    useChatStore.getState().rejoinAllRooms(newSocket);

    // Sync offline
    useChatStore.getState().syncOfflineActions();
    useChatStore.getState().initializeSocketListeners(newSocket);
  });

  // === CONNECTION ERROR ===
  newSocket.on("connect_error", (err) => {
    console.error("[SOCKET] Connect error:", err.message);
    set({ isOnline: false });
    set((s) => ({ reconnectionAttempts: s.reconnectionAttempts + 1 }));

    const attempts = get().reconnectionAttempts;
    if (err.message.includes("Unauthorized")) {
      toast.error("Session expired. Logging out...");
      setTimeout(() => get().logout(), 1500);
    } else if (attempts > 5) {
      toast.error("Connection unstable. Check network.");
    }
  });

  // === DISCONNECT ===
  newSocket.on("disconnect", (reason) => {
    console.warn(`[SOCKET] Disconnected: ${reason}`);
    set({ isOnline: false });

    if (reason === "io client disconnect") return;

    if (reason === "transport close" || reason === "ping timeout") {
      toast.loading("Reconnecting...", { id: "reconnect" });
    }
  });

  // === SERVER PING/PONG (HEARTBEAT) ===
  newSocket.io.on("ping", () => {
    // Optional: log for debugging
  });

  newSocket.io.on("pong", (latency) => {
    // Optional: monitor latency
 console.log("Ping latency:", latency);
  });

  set({ socket: newSocket });
},
  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null, isOnline: false, onlineUsers: [], reconnectionAttempts: 0 });
    }
  },
}));