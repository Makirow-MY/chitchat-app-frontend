// src/store/useStatusStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useStatusStore = create((set, get) => ({
  myStatus: [],
  statusUpdates: [],
  isLoading: false,
  selectedStatusUser: null,
  currentStatusIndex: 0,
  showAddModal:false,
  setShowAddModal: (user) => set({ showAddModal: user, currentStatusIndex: 0 }),
 
  setSelectedStatusUser: (user) => set({ selectedStatusUser: user, currentStatusIndex: 0 }),
  nextStatus: () => set((state) => ({
    currentStatusIndex: Math.min(state.currentStatusIndex + 1, state.selectedStatusUser.statuses.length - 1)
  })),
  prevStatus: () => set((state) => ({
    currentStatusIndex: Math.max(state.currentStatusIndex - 1, 0)
  })),

// src/store/useStatusStore.js
createStatus: async (formData) => {
  set({ isLoading: true });
  try {
    const res = await axiosInstance.post("/status/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    set((state) => ({ myStatus: [res.data, ...state.myStatus] }));
    toast.success("Status posted!");
  } catch (error) {
    toast.error(error.response?.data?.message || "Upload failed");
  } finally {
    set({ isLoading: false });
  }
},

  getMyStatus: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/status/my");
      set({ myStatus: res.data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },

  getStatusUpdates: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/status/updates");
      set({ statusUpdates: res.data });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },

  viewStatus: async (statusId) => {
    try {
      await axiosInstance.post(`/status/view/${statusId}`);
      set((state) => ({
        statusUpdates: state.statusUpdates.map(group =>
          group.user._id === state.selectedStatusUser?.user._id
            ? {
                ...group,
                hasNew: group.statuses.some(s => s._id === statusId && !s.viewedBy.some(v => v.userId.toString() === useAuthStore.getState().authUser._id)),
                statuses: group.statuses.map(s =>
                  s._id === statusId
                    ? { ...s, viewedBy: [...s.viewedBy, { userId: useAuthStore.getState().authUser._id }] }
                    : s
                )
              }
            : group
        )
      }));
    } catch (error) {
      console.log(error);
    }
  },

  reactToStatus: async (statusId, emoji) => {
    try {
      const res = await axiosInstance.post(`/status/react/${statusId}`, { emoji });
      set((state) => ({
        statusUpdates: state.statusUpdates.map(group =>
          group.statuses.some(s => s._id === statusId)
            ? {
                ...group,
                statuses: group.statuses.map(s =>
                  s._id === statusId ? res.data : s
                )
              }
            : group
        )
      }));
    } catch (error) {
      toast.error("Failed to react");
    }
  },

  replyToStatus: async (statusId, text) => {
    try {
      const res = await axiosInstance.post(`/status/reply/${statusId}`, { text });
      set((state) => ({
        statusUpdates: state.statusUpdates.map(group =>
          group.statuses.some(s => s._id === statusId)
            ? {
                ...group,
                statuses: group.statuses.map(s =>
                  s._id === statusId ? res.data : s
                )
              }
            : group
        )
      }));
      toast.success("Reply sent!");
    } catch (error) {
      toast.error("Failed to reply");
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await axiosInstance.delete(`/status/delete/${statusId}`);
      set((state) => ({
        myStatus: state.myStatus.filter(s => s._id !== statusId),
        statusUpdates: state.statusUpdates.map(group => ({
          ...group,
          statuses: group.statuses.filter(s => s._id !== statusId)
        })).filter(group => group.statuses.length > 0)
      }));
      toast.success("Status deleted");
    } catch (error) {
      toast.error("Failed to delete");
    }
  },

  muteStatus: async (statusId) => {
    try {
      await axiosInstance.post(`/status/mute/${statusId}`);
      toast.success("Muted");
    } catch (error) {
      toast.error("Failed to mute");
    }
  },
forwardStatus: async (statusId, chatId) => {
  try {
    const res = await axiosInstance.post("/status/forward", { statusId, chatId });
    toast.success("Status forwarded!");
    return res.data;
  } catch (error) {
    toast.error("Failed");
  }
},
  initializeSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newStatus", (status) => {
      set((state) => {
        const existing = state.statusUpdates.find(g => g.user._id === status.userId._id);
        if (existing) {
          return {
            statusUpdates: state.statusUpdates.map(g =>
              g.user._id === status.userId._id
                ? { ...g, hasNew: true, statuses: [status, ...g.statuses] }
                : g
            )
          };
        }
        return {
          statusUpdates: [{
            user: status.userId,
            statuses: [status],
            hasNew: true
          }, ...state.statusUpdates]
        };
      });
    });

    socket.on("statusDeleted", ({ statusId, userId }) => {
      set((state) => ({
        statusUpdates: state.statusUpdates
          .map(g => g.user._id === userId ? { ...g, statuses: g.statuses.filter(s => s._id !== statusId) } : g)
          .filter(g => g.statuses.length > 0)
      }));
    });

    socket.on("statusViewed", ({ statusId, viewer }) => {
      set((state) => ({
        myStatus: state.myStatus.map(s =>
          s._id === statusId
            ? { ...s, viewedBy: [...s.viewedBy, viewer] }
            : s
        )
      }));
    });
  },
}));