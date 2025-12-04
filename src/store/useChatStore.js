import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { Youtube } from "lucide-react";
export const useChatStore = create((set, get) => ({
  sidebarContent: "chats",
  recentEmojis: JSON.parse(localStorage.getItem('recentEmojis')) || ['👍', '❤️', '😂', '😢', '😡', '😮'],
  setSidebarContent: (content) => set({ sidebarContent: content }),
  searchQuery: "",
  selectedMessageId: null,
   setSelectedMessageId: (msgs) => set({ selectedMessageId: msgs }),

  queuedActions: JSON.parse(localStorage.getItem('queuedActions')) || [], // New state for queued actions
  multiSelectedMessages: [],
  setMultiSelectedMessages: (msgs) => set({ multiSelectedMessages: msgs }),
  option: "",
  setOption: (content) => set({ option: content }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedUser: null,
  //ocalStorage.getItem('selectedUser') || null,
  selectedGroup: null,
  //localStorage.getItem('selectedGroup') || null,
  setSelectedUser: (user) => {
    const socket = useAuthStore.getState().socket;
    if (socket && user.roomId) {
      socket.emit("join_private_rooms", [user.roomId]);
   localStorage.setItem('selectedUser', JSON.stringify(user))
   localStorage.setItem('selectedGroup', null)
       set({ selectedUser: user, selectedGroup: null });
    }
    else{
       set({ selectedUser: null, selectedGroup: null });
    }

  },
  setSelectedGroup: (group) => {
    const socket = useAuthStore.getState().socket;
    if (socket && group.roomId) {
      socket.emit("join_groups", [group.roomId]);
    localStorage.setItem('selectedUser', null)
    localStorage.setItem('selectedGroup', JSON.stringify(group))
      set({ selectedUser: null, selectedGroup: group });
    }
    else{
       set({ selectedUser: null, selectedGroup: null });
    }
  },
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) || true,
  toggleSound: () => {
    const newSoundState = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", newSoundState);
    set({ isSoundEnabled: newSoundState });
  },
  chats: [],
  groupChats: [],
  archivedChats: [],
  filteredChats: [],
  processedMessageIds: new Set(), // New state to track processed message IDs
  // Clear processed message IDs (e.g., on chat change)
  clearProcessedMessageIds: () => set({ processedMessageIds: new Set() }),
  messages: [],
  savedMessages: [],
  allContacts: [],
  allGroups: [],
  searchResults: [],  // To hold deep search results from backend
setSearchResults: (results) => set({ searchResults: results }),
targetHighlightMsgId: null,  // To scroll/highlight specific message on click
setTargetHighlightMsgId: (id) => set({ targetHighlightMsgId: id }),
  receivedRequests: [],
  sentRequests: [],
  blockedUsers: [],
  setBlockedUsers:(results) => set({ blockedUsers: results }),
  isInitialDataLoading: true,          // ← NEW
  hasInitialDataLoaded: false,
  usersForRequest: [],
  groupJoinRequests: [],
  notifications: [],
  typingUsers: [],
  attached: false,
  report: localStorage.getItem("reportChat") || false,
  setAttached: (attached) => set({ attached }),
  showEmojiPicker: false,
  setShowEmojiPicker: (show) => set({ showEmojiPicker: show }),
  showPopup: false,
  setShowPopup: (show) => set({ showPopup: show }),
  isUsersLoading: false,
  isMessagesLoading: false,
  replyTo: null,
  setReplyTo: (msg) => set({ replyTo: msg }),
  editingMessage: null,
  setEditingMessage: (msg) => set({ editingMessage: msg }),


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
  setLocalStream: (stream) => set({ localStream: stream }),
  addRemoteStream: (userId, stream) => set((state) => ({
    remoteStreams: { ...state.remoteStreams, [userId]: stream }
  })),
  removeRemoteStream: (userId) => set((state) => {
    const newStreams = { ...state.remoteStreams };
    delete newStreams[userId];
    return { remoteStreams: newStreams };
  }),

  initializeSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.error("Socket not available. Listeners not initialized.");
      return;
    }
//     socket.on("pendingMessages", (messages) => {
//   messages.forEach(msg => storeMessage(msg));
//   socket.emit("ack", { type: "message", ids: messages.map(m => m._id) });
// });

// socket.on("pendingReads", (ids) => {
//   ids.forEach(id => markAsRead(id));
//   socket.emit("ack", { type: "read", ids });
// });
   socket.on("newMessage", async ({ message, sender, replyTo }) => {
      const state = get();
      const { messages, chats, groupChats, selectedUser, selectedGroup, isSoundEnabled, archivedChats } = state;
      const { authUser } = useAuthStore.getState();
      const isGroup = !!message.groupId;
      const isMyMessage = message.senderId._id.toString() === authUser._id.toString();
      const chatId = isGroup ? message.groupId.toString() : (isMyMessage ? message.receiverId.toString() : message.senderId._id.toString());
      const roomId = message.roomId;
     const isVisible = !message.visibleTo.length || message.visibleTo.some((id) => id.toString() === authUser._id.toString());
      if (!isVisible || messages.some((m) => m._id === message._id) || !chatId || !roomId) return;
      let isArchived = await state.checkIsChatArchived(chatId, isGroup);
      if (isArchived) {
        await axiosInstance.post(`/messages/archive-chat/${chatId}`, { unarchive: true });
        isArchived = false;
      }
      get().getMyChatPartners()
      get().getGroupChats()
      const isSelected = isGroup ? (selectedGroup && selectedGroup._id === chatId) : (selectedUser && selectedUser._id === chatId);
      
      let targetListKey = isGroup ? "groupChats" : "chats";
      let targetList = isGroup ? groupChats : chats;
      let updatedChats = chats.filter((c) => c._id !== chatId);
      let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
      let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
      let updatedList = [...targetList];
      const listIndex = updatedList.findIndex((c) => c._id === chatId);
      let chat;
      console.log(message, chatId, listIndex)
      let isNewChat = false; // SOLUTION: Track if this is a new chat to trigger join
      if (listIndex === -1) {
        isNewChat = true; // SOLUTION: Detect first message (new chat), so we can join the room below
        chat = {
          _id: chatId,
          roomId,
          name: isGroup ? message?.groupName : undefined,
          fullName: isGroup ? undefined : sender.fullName,
          profilePic: isGroup ? (message.groupProfilePic || "/avatar.png") : (sender.profilePic || "/avatar.png"),
          recentMessage: {
            text: message?.text,
            senderId: message?.senderId?._id || message?.senderId || "You",
            attachmentType: message.attachments?.[message.attachments?.length - 1]?.attachmentType,
            originalName: message.attachments?.[message.attachments?.length - 1]?.originalName,
            createdAt: message.createdAt,
            isEdited: message.isEdited,
            isForwarded: message.isForwarded,
            reactions: message.reactions.map((r) => ({
              userId: r.userId?._id,
              name: r.userId.fullName,
              emoji: r.emoji,
            })),
          },
          unreadCount: (isMyMessage || isSelected) ? 0 : 1,
        };
        if (!chat.name && !chat.fullName) return;
        updatedList.unshift(chat);
     
     

     
      } else {
        chat = { ...updatedList[listIndex], roomId };
        chat.recentMessage = {
          text: message.text,
           senderId: message.senderId?._id || message.senderId || "You",
           attachmentType: message.attachments?.[message.attachments?.length - 1]?.attachmentType,
          originalName: message.attachments?.[message.attachments?.length - 1]?.originalName,
          createdAt: message.createdAt,
          isEdited: message.isEdited,
          isForwarded: message.isForwarded,
          reactions: message.reactions.map((r) => ({
            userId: r.userId._id,
            name: r.userId.fullName,
            emoji: r.emoji,
          })),
        };
        chat.unreadCount = (isMyMessage || isSelected) ? 0 : (chat.unreadCount || 0) + 1;
        updatedList.splice(listIndex, 1);
        updatedList.unshift(chat);
      }
      set({
        chats: updatedChats,
        groupChats: updatedGroupChats,
        archivedChats: updatedArchivedChats,
        [targetListKey]: updatedList,
      });
      if (isNewChat && socket) {
        // SOLUTION: For first message (new chat), immediately join the room to receive future real-time broadcasts. This fixes missing updates for first messages and ensures simultaneous broadcasting.
        socket.emit(isGroup ? "join_groups" : "join_private_rooms", [roomId]);
      }
      if (isMyMessage && isSelected) return;
      if (isSelected) {
        set({ messages: [...messages, { ...message, roomId, replyTo }] });
        if (!isMyMessage) {
          state.markMessageAsRead([message._id], isGroup ? chatId : null, roomId);
        }
      }
      if (!isMyMessage && isSoundEnabled && !message.pendingFor?.length) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
      if (message.pendingFor?.includes(authUser._id.toString())) {
        socket.emit("messageDelivered", { msgId: message._id, userId: authUser._id, roomId });
      }
       get().getAllContacts()
       get().getUserGroups()
       get().getMyChatPartners()
       get().getGroupChats()
    });
    socket.on("messageDelivered", ({ msgId, userId }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id.toString() === msgId.toString()
            ? { ...msg, pendingFor: msg.pendingFor.filter((id) => id !== userId) }
            : msg
        ),
      }));
    });
    socket.on("messageRead", ({ msgId, readerId, readAt }) => {
      const { authUser } = useAuthStore.getState();
      set((state) => {
        const updatedMessages = state.messages.map((msg) =>
          msg?._id.toString() === msgId?.toString() && !msg.readBy.some((rb) => rb.userId.toString() === readerId.toString())
            ? { ...msg, readBy: [...msg.readBy, { userId: readerId, readAt }], pendingFor: msg.pendingFor.filter((id) => id !== readerId) }
            : msg
        );
        const isGroup = state.selectedGroup?._id;
        return {
          messages: updatedMessages,
          chats: state.chats.map((chat) =>
            !isGroup && state.selectedUser?._id === chat._id ? {
              ...chat,
              unreadCount: updatedMessages.filter(
                (m) =>
                  m.receiverId?.toString() === authUser._id.toString() &&
                  !m.readBy.some((rb) => rb.userId.toString() === authUser._id.toString())
              ).length,
            } : chat
          ),
          groupChats: state.groupChats.map((g) =>
            isGroup && g._id === isGroup ? {
              ...g,
              unreadCount: updatedMessages.filter(
                (m) =>
                  m.groupId?.toString() === isGroup &&
                  !m.readBy.some((rb) => rb.userId.toString() === authUser._id.toString())
              ).length,
            } : g
          ),
          archivedChats: state.archivedChats.map((chat) =>
            (isGroup ? chat._id === isGroup : state.selectedUser?._id === chat._id) ? {
              ...chat,
              unreadCount: updatedMessages.filter(
                (m) =>
                  (isGroup ? m.groupId?.toString() === isGroup : m.receiverId?.toString() === authUser._id.toString()) &&
                  !m.readBy.some((rb) => rb.userId.toString() === authUser._id.toString())
              ).length,
            } : chat
          ),
        };
      });
    });
socket.on("messageEdited", async ({ msgId, text, editedAt, isGroup, isRecent, roomId }) => {
  const state = get();

 // const chatId = isGroup ? msgId.groupId : msgId?.receiverId._id === authUser._id ? msgId.senderId._id : msgId.receiverId._id

  const { messages, chats, groupChats, selectedUser, selectedGroup, archivedChats } = state;
  const { authUser } = useAuthStore.getState();
  // Update messages if the chat is currently selected
 let chatMesaage = messages.find(c => c._id.toString() === msgId.toString());
const chatId = isGroup ? chatMesaage.groupId : chatMesaage?.receiverId._id === authUser._id ? chatMesaage.senderId._id : chatMesaage.receiverId._id

  const tempMessages = messages.map(m =>
    m._id.toString() === msgId.toString()
      ? { ...m, text, isEdited: true, updatedAt: new Date(editedAt), roomId }
      : m
  );
  set({ messages: tempMessages });
  // If not a recent message edit, no need to update chat lists
  if (!isRecent) return;
  // Check if the chat is archived and unarchive if necessary
  let isArchived = state.archivedChats.some(c => c._id.toString() === chatId);
  if (isArchived) {
    try {
      await axiosInstance.post(`/messages/archive-chat/${chatId}`, { unarchive: true });
      isArchived = false; // Now treated as active
    } catch (error) {
      console.error("Failed to unarchive chat:", error);
      return;
    }
  }
  // Determine the target list
  const targetListKey = isGroup ? "groupChats" : "chats";
  const targetList = isGroup ? [...groupChats] : [...chats];
  // Remove the chat from all lists to prevent duplication
  let updatedChats = chats.filter(c => c._id.toString() !== chatId);
  let updatedGroupChats = groupChats.filter(c => c._id.toString() !== chatId);
  let updatedArchivedChats = archivedChats.filter(c => c._id.toString() !== chatId);
  // Find the chat in the current list (active or archived)
  let chat = (isArchived ? archivedChats : targetList).find(c => c._id.toString() === chatId);
  if (!chat) {
    // Chat not found; create a new chat entry
    const targetUserOrGroup = isGroup
      ? { name: selectedGroup?.name, profilePic: selectedGroup?.profilePic }
      : { fullName: selectedUser?.fullName, profilePic: selectedUser?.profilePic };
    if ((isGroup && !targetUserOrGroup.name) || (!isGroup && !targetUserOrGroup.fullName)) {
      console.error("Invalid chat data: missing name or fullName");
      return;
    }
    chat = {
      _id: chatId,
      roomId,
      name: isGroup ? targetUserOrGroup.name : undefined,
      fullName: isGroup ? undefined : targetUserOrGroup.fullName,
      profilePic: targetUserOrGroup.profilePic || "/avatar.png",
      recentMessage: {
        text,
        isEdited: true,
        createdAt: new Date(editedAt), // Use editedAt as a fallback for new chats
        senderId: authUser._id,
        reactions: [],
      },
      unreadCount: 0,
    };
  } else {
    // Update existing chat's recentMessage, preserving original createdAt
    chat = {
      ...chat,
      roomId,
      recentMessage: {
        ...chat.recentMessage,
        text,
        isEdited: true,
        createdAt: chat.recentMessage.createdAt || new Date(editedAt), // Preserve original date or use editedAt
      },
    };
  }
  // Add the updated chat to the top of the target list
  const updatedList = [chat, ...targetList.filter(c => c._id.toString() !== chatId)];
  // Update the state with the modified lists
  set({
    chats: isGroup ? updatedChats : updatedList,
    groupChats: isGroup ? updatedList : updatedGroupChats,
    archivedChats: updatedArchivedChats,
  });
});
    socket.on("messageReacted", ({ msgId, emoji, userId, isRecent, reactions, roomId }) => {
      const state = get();
  const { messages, chats, groupChats, selectedUser, selectedGroup, archivedChats } = state;
  const { authUser } = useAuthStore.getState();
  // Update messages if the chat is currently selected
  let tempMessages = messages.map((msg) => {
  if (msg._id.toString() === msgId._id.toString()) {
              let reactionsUpdated = msg.reactions.filter((r) => r.userId.toString() !== userId.toString());
              if (emoji) reactionsUpdated.push({ userId, emoji});
              return { ...msg, reactions: reactionsUpdated, roomId: msgId.roomId || roomId };
            }
            return msg;
             });

  set({ messages: tempMessages });
  const isGroup  = msgId?.groupId
 // const chatSource = !isGroup &&
  const chatId = isGroup ? msgId.groupId : msgId?.receiverId._id === authUser._id ? msgId.senderId._id : msgId.receiverId._id
   const targetListKey = isGroup ? "groupChats" : "chats";
  const targetList = isGroup ? [...groupChats] : [...chats];
  //console.log(msgId, chatId, targetListKey, targetList)
 const tempMessagesChat =   messages.find((c) => c._id === msgId._id)

  // Remove the chat from all lists to prevent duplication
  let updatedChats = chats.filter(c => c._id.toString() !== chatId);
  let updatedGroupChats = groupChats.filter(c => c._id.toString() !== chatId);
  let updatedArchivedChats = archivedChats.filter(c => c._id.toString() !== chatId);
  // Find the chat in the current list (active or archived)
 // let chat = targetList.find(c => c._id.toString() === chatId);
      let updatedList = [...targetList];
      const listIndex = updatedList.findIndex((c) => c._id === chatId);
      let chat;
      let isNewChat = false; // SOLUTION: Track if this is a new chat to trigger join

     // console.log(tempMessagesChat, msgId, emoji, userId)
    //  console.log("chat", chat ,tempMessagesChat?.reactions, msgId?.reactions, "yuyuyuyuy",tempMessages[messages.length - 1]?.reactions)
 if (tempMessages && messages && tempMessages[messages.length - 1]?._id === msgId?._id) {

        chat = { ...updatedList[listIndex], roomId: roomId || msgId?.roomId };
        chat.recentMessage = {
          text: tempMessages[messages.length - 1]?.text,
          attachmentType:tempMessages[messages.length - 1]?.attachments?.[tempMessages[messages.length - 1]?.attachments?.length - 1]?.attachmentType,
          originalName: tempMessages[messages.length - 1]?.attachments?.[tempMessages[messages.length - 1]?.attachments?.length - 1]?.originalName,
          createdAt: tempMessages[messages.length - 1]?.createdAt,
          senderId: tempMessages[messages.length - 1]?.senderId._id,
          isEdited: false,
          reactions: tempMessages[messages.length - 1]?.reactions.map((r) => ({
            userId: r.userId || r.userId._id,
            name:  r.name || r.userId.fullName,
            emoji: r.emoji,
          })),
        };
        updatedList.splice(listIndex, 1);
        updatedList.unshift(chat);
  set({
        chats: updatedChats,
        groupChats: updatedGroupChats,
        archivedChats: updatedArchivedChats,
        [targetListKey]: updatedList,
      });

    }
 //get().getFilteredChats()
 //get().getGroupChats()
 //get().getMyChatPartners()
      // set((state) => {
      //   let updatedMessages = state.messages;
      //   if ((isGroup ? state.selectedGroup?._id : state.selectedUser?._id) === chatId) {
      //     updatedMessages = state.messages.map((msg) => {
      //       if (msg._id.toString() === msgId.toString()) {
      //         let reactionsUpdated = msg.reactions.filter((r) => r.userId.toString() !== userId.toString());
      //         if (emoji) reactionsUpdated.push({ userId, emoji });
      //         return { ...msg, reactions: reactionsUpdated, roomId };
      //       }
      //       return msg;
      //     });
      //   }
      //   let updatedChats = state.chats;
      //   let updatedGroupChats = state.groupChats;
      //   let updatedArchivedChats = state.archivedChats;
      //   if (isRecent) {
      //     const lists = [isGroup ? updatedGroupChats : updatedChats, updatedArchivedChats];
      //     lists.forEach((list, idx) => {
      //       list = list.map((c) => {
      //         if (c._id.toString() === chatId) {
      //           return {
      //             ...c,
      //             roomId,
      //             recentMessage: {
      //               ...c.recentMessage,
      //               reactions,
      //             },
      //           };
      //         }
      //         return c;
      //       });
      //       if (idx === 0) {
      //         if (isGroup) updatedGroupChats = list;
      //         else updatedChats = list;
      //       } else {
      //         updatedArchivedChats = list;
      //       }
      //     });
      //   }
      //   return {
      //     messages: updatedMessages,
      //     chats: updatedChats,
      //     groupChats: updatedGroupChats,
      //     archivedChats: updatedArchivedChats,
      //   };
      // });
    });

    socket.on("messagePinned", ({ msgId, pinnedUntil, pinnedBy, roomId }) => {
    console.log({ msgId, pinnedUntil, pinnedBy, roomId })
      set((state) => ({
        messages: state.messages
          .map((msg) => msg._id.toString() === msgId.toString() ? { ...msg, pinnedBy, pinnedUntil, roomId } : msg)
          .sort((a, b) => (b.pinnedUntil ? 1 : -1)),
      }));
    });

    socket.on("messageUnpinned", ({ msgId, roomId }) => {
      set((state) => ({
        messages: state.messages.map((msg) => msg._id.toString() === msgId.toString() ? { ...msg, pinnedBy: null, pinnedUntil: null, roomId } : msg),
      }));
    });
    socket.on("messageSaved", ({ msgId, starredBy, roomId }) => {
       get().fetchSavedMessages()

    });
    socket.on("messageUnsaved", ({ msgId, userId, roomId }) => {
     get().fetchSavedMessages()

    });
    socket.on("messageDeleted", async ({ msgId, forEveryone, deletedBy, roomId }) => {
      const { authUser } = useAuthStore.getState();
      const state = get();
      const deletedMessage = state.messages.find((msg) => msg._id.toString() === msgId.toString());
      if (!deletedMessage) return;
      console.log(deletedMessage)
      const chatId = deletedMessage.groupId || (deletedMessage.receiverId._id.toString() === authUser._id.toString() ? deletedMessage.senderId._id.toString().toString() : deletedMessage.receiverId._id.toString());
      const isGroup = !!deletedMessage.groupId;
      const isArchived = await state.checkIsChatArchived(chatId, isGroup);
      set((state) => ({
        // messages: state.messages.filter((msg) => {
        //   if (msg._id.toString() === msgId.toString()) {
        //     if (forEveryone || deletedBy.toString() === authUser._id.toString()) return false;
        //   }
        //   return true;
        // }),
       messages: state.messages.map(m =>
      m._id === msgId
        ? {
            ...m,
            text: "This message was deleted",
            deletedForEveryone: forEveryone,
            deletedBy: forEveryone && selectedUser._id ? [authUser._id, selectedUser._id] : selectedGroup.members,
            attachments: [],
          }
        : m
    ),
        chats: state.chats.map((chat) =>
          !isGroup && chat._id === chatId
            ? {
                ...chat,
                recentMessage: state.messages.find(
                  (m) =>
                    m._id !== msgId &&
                    (m.senderId._id.toString() === chatId || m.receiverId._id.toString() === chatId) &&
                    (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                )?.text
                  ? {
                      text: state.messages.find(
                        (m) =>
                          m._id !== msgId &&
                          (m.senderId._id.toString() === chatId || m.receiverId._id.toString() === chatId) &&
                          (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                      ).text,
                      createdAt: state.messages.find(
                        (m) =>
                          m._id !== msgId &&
                          (m.senderId._id.toString() === chatId || m.receiverId._id.toString() === chatId) &&
                          (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                      ).createdAt,
                      roomId,
                    }
                  : null
              }
            : chat
        ),
        groupChats: state.groupChats.map((g) =>
          isGroup && g._id === chatId
            ? {
                ...g,
                recentMessage: state.messages.find(
                  (m) =>
                    m._id !== msgId &&
                    m.groupId === chatId &&
                    (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                )?.text
                  ? {
                      text: state.messages.find(
                        (m) =>
                          m._id !== msgId &&
                          m.groupId === chatId &&
                          (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                      ).text,
                      createdAt: state.messages.find(
                        (m) =>
                          m._id !== msgId &&
                          m.groupId === chatId &&
                          (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                      ).createdAt,
                      roomId,
                    }
                  : null
              }
            : g
        ),
        archivedChats: state.archivedChats.map((chat) =>
          chat._id === chatId
            ? {
                ...chat,
                recentMessage: state.messages.find(
                  (m) =>
                    m._id !== msgId &&
                    (isGroup ? m.groupId === chatId : m.senderId.toString() === chatId || m.receiverId.toString() === chatId) &&
                    (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                )?.text
                  ? {
                      text: state.messages.find(
                        (m) =>
                          m._id !== msgId &&
                          (isGroup ? m.groupId === chatId : m.senderId.toString() === chatId || m.receiverId.toString() === chatId) &&
                          (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                      ).text,
                      createdAt: state.messages.find(
                        (m) =>
                          m._id !== msgId &&
                          (isGroup ? m.groupId === chatId : m.senderId.toString() === chatId || m.receiverId.toString() === chatId) &&
                          (!m.visibleTo.length || m.visibleTo.some((id) => id.toString() === authUser._id.toString()))
                      ).createdAt,
                      roomId,
                    }
                  : null
              }
            : chat
        ),
      }));
    });
    socket.on("typing", ({ chatId, userId, userName, isGroup, roomId }) => {
      const { selectedUser, selectedGroup } = get();
      const currentChatId = selectedGroup ? selectedGroup._id : selectedUser?._id;
      if (chatId === currentChatId && userId !== useAuthStore.getState().authUser._id) {
        set((state) => ({
          typingUsers: state.typingUsers.some((u) => u.userId === userId)
            ? state.typingUsers
            : [...state.typingUsers, { userId, userName, roomId }].slice(0, 3),
        }));
      }
    });
    socket.on("stopTyping", ({ chatId, userId, roomId }) => {
      const { selectedUser, selectedGroup } = get();
      const currentChatId = selectedGroup ? selectedGroup._id : selectedUser?._id;
      if (chatId === currentChatId) {
        set((state) => ({
          typingUsers: state.typingUsers.filter((u) => u.userId !== userId),
        }));
      }
    });
    socket.on("groupUpdated", (updatedGroup) => {
      set((state) => {
        const exists = state.groupChats.some((g) => g._id === updatedGroup._id);
        const groupChats = exists
          ? state.groupChats.map((group) =>
              group._id === updatedGroup._id ? { ...updatedGroup, roomId: group.roomId } : group
            )
          : [{ ...updatedGroup, roomId: updatedGroup._id }, ...state.groupChats];
        const archivedChats = state.archivedChats.map((chat) =>
          chat._id === updatedGroup._id
            ? { ...chat, name: updatedGroup.name, profilePic: updatedGroup.profilePic, roomId: chat.roomId }
            : chat
        );
        const selectedGroup =
          state.selectedGroup?._id === updatedGroup._id ? { ...updatedGroup, roomId: state.selectedGroup.roomId } : state.selectedGroup;
        return { groupChats, archivedChats, selectedGroup };
      });
      const { groupChats } = get();
      if (!groupChats.some((g) => g._id === updatedGroup._id)) {
        socket.emit("join_groups", [updatedGroup._id]);
      }
      get().getMyChatPartners()
      get().getUserGroups()
      get().getGroupChats()
    });
    socket.on("groupJoined", ({ group, groupId, groupName, roomId }) => {
      get().getUserGroups();
      set((state) => ({
        allGroups: [...state.allGroups],

      }));
      get().getGroupJoinRequests(groupId);
      toast.success(`Joined group: ${groupName}`);
      socket.emit("join_groups", [roomId]);
    });
    socket.on("groupCreated", (group) => {
      set((state) => ({
        groupChats: [{ ...group, roomId: group._id }, ...state.groupChats],
      }));
      socket.emit("join_groups", [group._id]);
      toast.success(`Group ${group.name} created`);
    });
    socket.on("newFriendRequest", (request) => {
      toast.success("New friend request received");
      get().addReceivedRequest(request);
      get().updateUserRequestStatus(request.from._id, true, request._id, "pending", request.updatedAt); // Modified: Update usersForRequest for received pending
      if (get().sidebarContent === "requests") {
        get().getReceivedRequests();
        get().getSentRequests();
      }
      if (get().sidebarContent === "send") {
        get().getUsersForRequest();
      }
    });
    socket.on("newGroupRequest", ({user, group}) => {
       toast.dismiss()

      toast.success(`${user.fullName} has sent you  a request to join ${group.name}`);
     // get().addReceivedRequest(request);
     // get().updateUserRequestStatus(request.from._id, true, request._id, "pending", request.updatedAt); // Modified: Update usersForRequest for received pending
       get().getGroupJoinRequests(group._id);
       toast.success(group._id)
     if (get().sidebarContent === "chats") {
        get().getGroupChats();

      }
      if (get().sidebarContent === "groups") {
        get().getUserGroups()
       // get().getGroupJoinRequests(group._id);
      //  set((state) => ({
      // groupJoinRequests: state.groupJoinRequests.map((req) =>
      //   req
      // ),
      // allGroups: state.allGroups.map((group) =>
      //   group
      // ),
    }
  //))
    //  get().getGroupJoinRequests(request);
    //  get().getUserGroups(); // Modified: Update usersForRequest for received pending

    });
    socket.on("friendRequestSent", (request) => {
      get().updateUserRequestStatus(request.to._id, true, request._id, "pending", request.updatedAt); // Modified: Pass requestAt
      if (get().sidebarContent === "send") {
        get().getUsersForRequest();
      }
      if (get().sidebarContent === "requests") {
        get().getSentRequests();
      }
    });
    socket.on("newNotification", (notif) => {
      toast.success(notif.message);
      if (get().sidebarContent === "notifications") {
        get().getNotifications();
      }
    });
    socket.on("friendRequestAccepted", ({ requestId, acceptor }) => {
      toast.success(`${acceptor.fullName} accepted your friend request`);
      get().updateUserRequestStatus(acceptor._id, false, requestId, "accepted"); // Modified: Handles removal from usersForRequest
      get().updateSentRequestStatus(requestId, "accepted");
      if (["contacts", "requests", "send"].includes(get().sidebarContent)) {
        get().getAllContacts();
        get().getReceivedRequests();
        get().getSentRequests();
        get().getUsersForRequest();
      }
    });
    socket.on("groupRequestAccepted", ({ requestId, acceptor }) => {
    toast.success(`Admin of ${acceptor.name} accepted your request`);
    if (["chats", "groups",].includes(get().sidebarContent)) {
  //  get().updateGroupSentRequestStatus(); // Modified: Handles removal from usersForRequest
    get().getGroupJoinRequests(requestId)
    get().getUserGroups();
    get().getGroupChats()
      }


    });
    socket.on("friendRequestDeclined", ({ requestId, decliner }) => {
      toast.success(`${decliner.fullName} declined your friend request`);
      get().updateUserRequestStatus(decliner._id, false, requestId, "declined"); // Modified: Sets isDeclinedCooldown
      get().updateSentRequestStatus(requestId, "declined");
      if (["requests", "send"].includes(get().sidebarContent)) {
        get().getReceivedRequests();
        get().getSentRequests();
        get().getUsersForRequest();
      }
    });
    socket.on("GroupRequestDeclined", ({ requestId, decliner }) => {
      toast.success(`${decliner.fullName} declined your request`);
     // get().updateUserRequestStatus(decliner._id, false, requestId, "declined"); // Modified: Sets isDeclinedCooldown
    //  get().updateSentRequestStatus(requestId, "declined");
      if (["chats", "groups"].includes(get().sidebarContent)) {
        get().getGroupJoinRequests(requestId);
        get().getUserGroups();
        get().getGroupChats();
      }
    });
    // New: Socket listener for cancelled requests
    socket.on("friendRequestCancelled", ({ requestId, canceller }) => {
      toast.success(`${canceller.fullName} cancelled the friend request`);
      get().updateUserRequestStatus(canceller._id, false, requestId, null);
      if (["requests", "send"].includes(get().sidebarContent)) {
        get().getReceivedRequests();
        get().getSentRequests();
        get().getUsersForRequest();
      }
    });
    socket.on("group_exit", ({ groupId, userId, message, roomId }) => {
      const { authUser } = useAuthStore.getState();
      if (userId === authUser._id.toString()) {
        set((state) => ({
          groupChats: state.groupChats.filter((group) => group._id !== groupId),
          archivedChats: state.archivedChats.filter((chat) => chat._id !== groupId),
          selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        }));
        toast.success("You have exited the group");
        socket.emit("leave_groups", [roomId]);
      } else {
        set((state) => ({
          groupChats: state.groupChats.map((group) =>
            group._id === groupId
              ? { ...group, members: group.members.filter((m) => m._id !== userId) }
              : group
          ),
          messages: state.selectedGroup?._id === groupId ? [...state.messages, { ...message, roomId }] : state.messages,
        }));
        toast.success(message.text);
      }
    });
    socket.on("user_blocked", ({ userId, blockedBy, roomId,  report, }) => {
     const state = get();

 // const chatId = isGroup ? msgId.groupId : msgId?.receiverId._id === authUser._id ? msgId.senderId._id : msgId.receiverId._id

  const {chats, groupChats, selectedUser, selectedGroup, archivedChats } = state;
  const { authUser } = useAuthStore.getState();

      set((state) => ({
        selectedUser:  state.selectedUser,
        report: report || false,
        blockedUsers: [...state.blockedUsers, userId],
      }));
    //   if(report)
    //   {
    //         let targetListKey = isGroup ? "groupChats" : "chats";
    // let targetList = isGroup ? groupChats : chats;
    // let updatedChats = chats.filter((c) => c._id !== userId);
    // let updatedGroupChats = groupChats.filter((c) => c._id !== userId);
    // let updatedArchivedChats = archivedChats.filter((c) => c._id !== userId);
    // let updatedList = [...targetList];

    // const chatIndex = updatedList.findIndex((c) => c._id === userId);
    // let chat;

    //   chat = { ...updatedList[chatIndex], roomId };
    //   chat.recentMessage = {
    //      text: `We have received your report about your chat with this ${isGroup ? "group" : "user"} "${isGroup ? selectedGroup.name : selectedUser.fullName}". Our team will review your report, and within a day, you will get a response. For the meantime, you will be blocked from this chat`,
    //     attachmentType:[],
    //     originalName: null,
    //     createdAt: new Date(),
    //     isEdited: false,
    //     reactions: [],
    //     isPinned: false,
    //     isStarred: false,
    //     replyTo: null,
    //     isSystem:true,
    //   };
    //   chat.unreadCount = 0;
    //   updatedList.splice(chatIndex, 1);
    //   updatedList.unshift(chat);

    // set({
    //   chats: updatedChats,
    //   groupChats: updatedGroupChats,
    //   archivedChats: updatedArchivedChats,
    //   [targetListKey]: updatedList,
    // });
    //   }
    get().getMyChatPartners();
        get().getGroupChats();

      socket.emit("leave_private_rooms", [roomId]);

    });
      socket.on("user_unblocked", ({ userId, unblockedBy, roomId }) => {

     set((state) => ({
         selectedUser:  state.selectedUser,
        // blockedUsers: state.blockedUsers.filter((id) => id.userId !== userId),
        }));
     const authUser = useAuthStore.getState().authUser;

          toast.success( "User unblocked You have been unblocked");

    //  toast.success(authUser._id.toString() === blockedBy ? "User unblocked" : "You have been unblocked");
        socket.emit("join_private_rooms", [roomId]);

       if (["chats", "groups", "contacts", "status"].includes(useAuthStore.getState().sidebarContent)) {
        get().getMyChatPartners();
        get().getGroupChats();
       // get().getSentRequests();
       // get().getUsersForRequest();
      }

    });
    socket.on("friend_deleted", ({ userId, deletedBy, roomId }) => {
      const { authUser } = useAuthStore.getState();
      set((state) => ({
        allContacts: state.allContacts.filter((contact) => contact._id !== userId),
        chats: state.chats.filter((chat) => chat._id !== userId),
        archivedChats: state.archivedChats.filter((chat) => chat._id !== userId),
        selectedUser: state.selectedUser?._id === userId ? null : state.selectedUser,
      }));
      toast.success(authUser._id.toString() === deletedBy ? "Friend deleted" : "You have been removed from a friend's list");
      socket.emit("leave_private_rooms", [roomId]);
    });
    socket.on("friendAdded", ({ friend, privateRoomId }) => {
      set((state) => ({
        allContacts: [...state.allContacts, { ...friend, roomId: privateRoomId }],
      }));
      if (socket) {
        // SOLUTION: When a new friend is added, immediately join the private room to receive future real-time broadcasts. This fixes the deviation where first messages aren't broadcasted in real-time.
        socket.emit("join_private_rooms", [privateRoomId]);
      }
    });
    socket.on("groupAdded", ({ group, groupRoomId }) => {
      set((state) => ({
        groupChats: [...state.groupChats, { ...group, roomId: groupRoomId || group._id}],

      }));
      if (socket) {
        // SOLUTION: When a new friend is added, immediately join the private room. This ensures both users are in the room before the first message, fixing the deviation where first messages aren't broadcasted in real-time.
       socket.emit("join_groups", [roomId])
      }
    });
    socket.on("connect", async () => {
      await get().getUserGroups();
      const { groupChats } = get();
      const groupIds = groupChats.map((group) => group._id);
      socket.emit("join_groups", groupIds);
      const { chats } = get();
      const privateRoomIds = chats.map((chat) => chat.roomId).filter(Boolean);
      socket.emit("join_private_rooms", privateRoomIds);
      get().syncOfflineActions();
      get().getReceivedRequests();
      get().getSentRequests();
      get().getUsersForRequest();
      get().getNotifications();
      get().getAllContacts();
    });
        socket.on('initiateCall', (data) => {
           const { authUser } = useAuthStore.getState();
          const state = get();
      const { messages, chats, groupChats, selectedUser, selectedGroup, isSoundEnabled, archivedChats } = state;
 console.log("reciver is here")
           const { caller, roomId } = data;
          const isCaller = caller._id === authUser._id;
   //        set({ messages: [...messages, { ...message, roomId, replyTo:null }] });

console.log("datatata", data)
          set({
            incomingCall: isCaller ? null : data,
            isRinging: !isCaller,
            activeCall: isCaller ? data : null,
          });
      });
          socket.on('callJoined', ({ userId }) => {
              const state = get();
      const { messages, chats, groupChats, selectedUser, selectedGroup, isSoundEnabled, archivedChats } = state;

            set({
              messages:messages,
               isInCall: true, isRinging: false, callMessage: `${name} joined the call` });
          });
         socket.on('callRejected', async ({ userId, call, roomId }) => {
          const state = get();
         const { authUser } = useAuthStore.getState();
      const { messages, chats, groupChats, selectedUser, selectedGroup, isSoundEnabled, archivedChats } = state;
    const isGroup = !!selectedGroup
   const chatId = isGroup ? selectedGroup._id : selectedUser._id 
  
      const isCaller = call.caller === authUser._id;
    get().getIncomingCallHistory(chatId, 'rejected')
         if (isGroup) {
          await  get().getMessagesByGroupId(chatId)
          } else {
           await get().getMessagesByUserId(chatId)
            }    
      set({
        messages: messages
          .filter(msg => msg.visibleTo.length === 0 || msg.visibleTo.some(id => id.toString() === useAuthStore.getState().authUser._id.toString()))
          .map(msg => ({ ...msg, roomId })),
          activeCall: isCaller ? call : null,
           isRinging: false,
           incomingCall: null,
         callMessage: "Call rejected"   
      });
       
    
     toast.success("call rejected")
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

    socket.on("room_terminated", ({ roomId, isGroup }) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg.roomId !== roomId),
        chats: isGroup ? state.chats : state.chats.filter((chat) => chat.roomId !== roomId),
        groupChats: isGroup ? state.groupChats.filter((group) => group.roomId !== roomId) : state.groupChats,
        archivedChats: state.archivedChats.filter((chat) => chat.roomId !== roomId),
        selectedUser: !isGroup && state.selectedUser?.roomId === roomId ? null : state.selectedUser,
        selectedGroup: isGroup && state.selectedGroup?.roomId === roomId ? null : state.selectedGroup,
      }));
      toast.loading(`Room ${roomId} has been terminated`);
    });
  },
  initInitialData: async () => {
      const { authUser } = useAuthStore.getState();

    if (get().hasInitialDataLoaded) {
      setTimeout(() => {
        set({ isInitialDataLoading: false });
      }, 2000);

      return;
    }

    set({ isInitialDataLoading: true });

    try {
      await Promise.all([
        get().getMyChatPartners(),
        get().getGroupChats(),
        get().getUserGroups(),
        get().getAllContacts(),
        get().getArchivedChats(),
    //    get().fetchSavedMessages?.(),        // if you have it
      //  get().getGroupJoinRequests?.(),     // if global
        // add ANY other global fetch you have here
      ]);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load initial data");
    } finally {
      toast.remove()
      setTimeout(() => {
            toast.success(`Welcome back ${authUser.fullName} `);

         set({
        isInitialDataLoading: false,
        hasInitialDataLoaded: true
      });
      }, 3000);

    }
  },
  editMessage: async (msgId, text, groupId, receiverId) => {
    const socket = useAuthStore.getState().socket;
    const { messages, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
    const { authUser } = useAuthStore.getState();
    const isGroup = !!groupId;
    const chatId = groupId || receiverId;
    const roomId = isGroup ? groupId : (selectedUser?.roomId || chats.find((c) => c._id === receiverId)?.roomId);
    if (!chatId || !roomId) return console.log("Invalid chat or room");
    let isArchived = await get().checkIsChatArchived(chatId, isGroup);
    if (isArchived) {
      await axiosInstance.post(`/messages/archive-chat/${chatId}`, { unarchive: true });
      isArchived = false;
    }
    const tempMessages = messages.map(m => m._id === msgId ? { ...m, text, isEdited: true, updatedAt: new Date(), roomId } : m);
    const tempMessagelength = tempMessages.length
    const isRecent = tempMessages[tempMessages.length - 1]._id.toString() === msgId.toString() ? true : false
    set({ messages: tempMessages });
    let targetListKey = isGroup ? "groupChats" : "chats";
    let targetList = isGroup ? groupChats : chats;
    let updatedChats = chats.filter((c) => c._id !== chatId);
    let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
    let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
    let updatedList = [...targetList];
    const chatIndex = updatedList.findIndex((c) => c._id === chatId);
    let chat;
    if (chatIndex === -1) {
      const targetUserOrGroup = isGroup ? { name: selectedGroup?.name, profilePic: selectedGroup?.profilePic } : { fullName: selectedUser?.fullName, profilePic: selectedUser?.profilePic };
      chat = {
        _id: chatId,
        roomId,
        name: isGroup ? targetUserOrGroup?.name : undefined,
        fullName: isGroup ? undefined : targetUserOrGroup?.fullName,
        profilePic: isGroup
          ? targetUserOrGroup?.profilePic || "/avatar.png"
          : targetUserOrGroup?.profilePic || "/avatar.png",
        recentMessage: {
          text,
          attachmentType: null,
          originalName: null,
          createdAt: new Date(),
          senderId: authUser._id,
          isEdited: true,
          reactions: [],
        },
        unreadCount: 0,
      };

      if (!chat.name && !chat.fullName) return;
      updatedList.unshift(chat);
    } else {
      chat = { ...updatedList[chatIndex], roomId };
      chat.recentMessage = {
        ...chat.recentMessage,
        text,
        isEdited: true,
      };
      updatedList.splice(chatIndex, 1);
      updatedList.unshift(chat);
    }
    set({
      chats: updatedChats,
      groupChats: updatedGroupChats,
      archivedChats: updatedArchivedChats,
      [targetListKey]: updatedList,
    });
      const res = await axiosInstance.put(`/messages/edit/${msgId}`, { text });

    try {
      if (socket) {

           console.log("funct",{ msgId, text, editedAt: new Date(), chatId, isGroup, roomId })
        socket.emit("messageEdited", { msgId, text, editedAt: new Date(), chatId, isGroup, isRecent, roomId });
      } else {
        console.error("Socket not available for messageEdited");
      }

    // return res.data;
    } catch (error) {
      set({ messages });
      console.log(error.response?.data?.message || "Failed to edit message");
      throw error;
    }
  },
   forwardMessages: async (msgIds, targetChatIds) => {
    const { messages,groupChats, chats, sendMessage, markMessageAsRead , selectedGroup} = get();
    const selectedMsgs = messages.filter(m => msgIds.includes(m._id));
    const socket = useAuthStore.getState().socket;

    for (const targetId of targetChatIds) {
      const isGroup = groupChats.some(g => g._id === targetId._id);
      const roomId = isGroup ? targetId._id : targetId.roomId || (chats.find(c => c._id === targetId._id)?.roomId);
      for (const msg of selectedMsgs) {
         socket.emit("join_private_rooms", [targetId.roomId]);
    // const newMsg = {...msg, replyTo:null}
    console.log("hello vello",{

          text: ` ${msg.text}`,
          attachments: msg.attachments.map(att => ({ type: att.attachmentType, data: att.attachmentUrl, name: att.originalName.toLowerCase(), mimeType: att.mimeType, duration: att.duration, preview: att.preview, ext: att.originalName.split(".").pop().toLowerCase(), size:att.size })),
          groupId: isGroup ? targetId._id : null,
          receiverId: isGroup ? null : targetId._id,
          isForwarded: "true",
          roomId,
          oeigi: msg.attachments,
          ForwardUser: targetId
        })

   try {
     await sendMessage({
          text: ` ${msg.text}`,
          attachments: msg.attachments.map(att => ({ type: att.attachmentType, data: att.attachmentUrl, name: att.originalName.toLowerCase(), mimeType: att.mimeType, duration: att.duration, preview: att.preview, ext: att.originalName.split(".").pop().toLowerCase(), size:att.size })),
          groupId: isGroup ? targetId._id : null,
          receiverId: isGroup ? null : targetId._id,
          isForwarded: "true",
          roomId,
          replyTo: null,
          ForwardUser: targetId
        });
      //   markMessageAsRead(msg._id, selectedGroup?._id || null);

   } catch (error) {
    console.error(error)
   }

    //

  }
    }
    // Professional: Mark originals as read after forwarding
  //  markMessageAsRead(msgIds, selectedGroup?._id || null);
  },
   shareMessages: async (user, targetChatIds) => {
    const { messages,groupChats, chats, sendMessage, markMessageAsRead , selectedGroup} = get();
    const socket = useAuthStore.getState().socket;

    for (const targetId of targetChatIds) {
      const isGroup = groupChats.some(g => g._id === targetId._id);
      const roomId = isGroup ? targetId._id : targetId.roomId || (chats.find(c => c._id === targetId._id)?.roomId);
            socket.emit("join_private_rooms", [targetId.roomId]);
    // const newMsg = {...msg, replyTo:null}
    console.log("hello vello",{

          text: ``,
          attachments: { type: 'share',
             data:'',
             name: '',
             mimeType: '',
             duration: '',
             preview: '',
             ext: '',
             size:'' },
          groupId: isGroup ? targetId._id : null,
          receiverId: isGroup ? null : targetId._id,
          isForwarded: "true",
          roomId,
          ForwardUser: user
        })

   try {
     await sendMessage({
           text: ``,
          attachments: [{ type: 'share',
             data: user.profilePic,
             name: user.fullName,
             mimeType: '',
             duration: '',
             preview: '',
             ext: '',
             size:'' }],
          groupId: isGroup ? targetId._id : null,
          receiverId: isGroup ? null : targetId._id,
          isForwarded: "true",
          replyTo:null,
          roomId,
          ForwardUser: user
        });

   } catch (error) {
    console.error(error.message)
   }

    }
    // Professional: Mark originals as read after forwarding
  //  markMessageAsRead(msgIds, selectedGroup?._id || null);
  },
    sendMessage: async ({ text, attachments, groupId, receiverId, replyTo, isForwarded = null, roomId, ForwardUser }) => {
    const { messages, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
    console.log({ggjh:"ertyuio[plkjhghfghjklmntyui",  text, attachments, groupId, receiverId, replyTo, isForwarded, roomId, ForwardUser })
    const { authUser } = useAuthStore.getState();
    const socket = useAuthStore.getState().socket;
    const chatId = groupId || receiverId;
    const isGroup = !!groupId;
     roomId = roomId || (isGroup ? groupId : (selectedUser?.roomId || chats.find((c) => c._id === receiverId)?.roomId));
    if (!chatId || !roomId) return console.log("Invalid chat or room");
    let isArchived = await get().checkIsChatArchived(chatId, isGroup);
    if (isArchived) {
      await axiosInstance.post(`/messages/archive-chat/${chatId}`, { unarchive: true });
      isArchived = false;
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage = {
      _id: tempId,
      text,
      senderId: authUser,
      receiverId: isGroup ? null : receiverId,
      groupId: isGroup ? groupId : null,
      roomId,
      attachments: attachments.map((att) => ({
        attachmentType: att.type,
        attachmentUrl: att.data,
        attachmentExt: att.ext ? att.ext.toLowerCase() : att.name.split(".").pop().toLowerCase(),
        size: att?.size || att?.file?.size,
        originalName: att.name.toLowerCase(),
        mimeType: att.mimeType,
        preview: att.preview || null,
        duration: att.duration || 0,
      })),
      createdAt: new Date(),
      readBy: isGroup ? [] : [{ userId: authUser._id, readAt: new Date() }],
      pendingFor: isGroup ? groupChats.find(g => g._id === groupId)?.members.map(m => m._id.toString()).filter(id => id !== authUser._id.toString()) || [] : [receiverId],
      isEdited: false,
      reactions: [],
      isPinned: false,      
      isForwarded:false,
      isStarred: false,
      replyTo: replyTo ? !isGroup ? {...replyTo, senderId: replyTo.senderId._id, receiverId: replyTo.receiverId._id, groupId: null } : {...replyTo, senderId: replyTo.senderId._id, receiverId: null, groupId: replyTo.groupId }: null,
      visibleTo: [],
    };
  console.log({groupId, receiverId, replyTo,  selectedUser, authUser, })

    if ((selectedGroup && groupId === selectedGroup._id) || (selectedUser && receiverId === selectedUser._id)) {
      set({ messages: [...messages, tempMessage] });
    }

    let targetListKey = isGroup ? "groupChats" : "chats";
    let targetList = isGroup ? groupChats : chats;
    let updatedChats = chats.filter((c) => c._id !== chatId);
    let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
    let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
    let updatedList = [...targetList];

    const chatIndex = updatedList.findIndex((c) => c._id === chatId);
    let chat;
    if (chatIndex === -1) {
      chat = {
        _id: chatId,
        roomId,
        senderId: authUser._id,
        members:isGroup ? selectedGroup.members : [],
        name: isGroup ? selectedGroup?.name : undefined,
        fullName: isGroup ? undefined : (isForwarded === 'true' && !selectedUser?.fullName) ? ForwardUser.fullName : selectedUser?.fullName,
        profilePic: isGroup
          ? selectedGroup?.profilePic || "/avatar.png"
          : (isForwarded === 'true' && !selectedUser?.profilePic) ? ForwardUser.profilePic : selectedUser?.profilePic || "/avatar.png",
        recentMessage: {
          text,
          attachmentType: attachments[attachments?.length - 1]?.type,
          originalName: attachments[attachments?.length - 1]?.name.toLowerCase(),
          createdAt: new Date(),
          isEdited: false,
          reactions: [],
          isPinned: false,
          isStarred: false,
          replyTo,
        },
        unreadCount: 0,
      };
      //   console.log(chat, "chat",isGroup,"isGroup",selectedGroup)

      if (!chat.name && !chat.fullName) return;
      updatedList.unshift(chat);
    } else {
      chat = { ...updatedList[chatIndex], roomId };
      chat.recentMessage = {
        text,
        senderId: authUser._id,
        attachmentType: attachments[attachments?.length - 1]?.type,
        originalName: attachments[attachments?.length - 1]?.name.toLowerCase(),
        createdAt: new Date(),
        isEdited: false,
        reactions: [],
        isPinned: false,
        isStarred: false,
        replyTo,
      };
      chat.unreadCount = 0;
      updatedList.splice(chatIndex, 1);
      updatedList.unshift(chat);
    }
    set({
      chats: updatedChats,
      groupChats: updatedGroupChats,
      archivedChats: updatedArchivedChats,
      [targetListKey]: updatedList,
    });

      const formData = new FormData();
      formData.append("text", text.trim());
      if (selectedGroup || (isForwarded && groupId)) formData.append("myGroupId", groupId);
      if (selectedUser || (isForwarded && receiverId)) formData.append("receiverId", receiverId);
      if (replyTo) formData.append("replyTo", replyTo._id);
      formData.append("isForwarded", isForwarded);
      formData.append("roomId",roomId);

      attachments.forEach((attachment, index) => {
      if (!isForwarded)  formData.append(`files[${index}]`, attachment.file, attachment.name.toLowerCase());
        formData.append(`durations[${index}]`, attachment.duration || 0);
        formData.append(`types[${index}]`, attachment.type);
        formData.append(`durations[${index}]`, attachment.duration || 0);
        formData.append(`originalName[${index}]`, attachment.name.toLowerCase());
      formData.append(`dataURL[${index}]`, attachment.data);

        formData.append(`names[${index}]`, attachment.name);
        formData.append(`mimeTypes[${index}]`, attachment.mimeType);
        formData.append(`preview[${index}]`, attachment.preview || null);
        if (attachment.ext) formData.append(`attachmentExt[${index}]`, attachment.ext || "mp3");
        if (attachment.size) formData.append(`size[${index}]`, attachment.size);
      });
 //console.log(formData ,"formData ")
    try {
      // const res = await axiosInstance.post("/messages/send", {
      // text,
      // attachments,
      // groupId,
      // receiverId,
      // replyTo,
      // isForwarded,
      // roomId,
      // });

      const res = await axiosInstance.post("/messages/send", formData, {
      headers: {
      "Content-Type": "multipart/form-data",
      },
      });

      console.log("Message sent response:", res.data);
      const newMessage = { ...res.data, roomId };
      set((state) => ({
      messages: state.messages.map((msg) =>
      msg._id === tempId ? { ...newMessage, senderId: authUser, roomId, replyTo:newMessage.replyTo } : msg
      ),
      [targetListKey]: state[targetListKey].map((c) =>
      c._id === chatId
      ? {
      ...c,
      roomId,
      recentMessage: {
      text: newMessage.text,
      attachmentType: newMessage.attachments?.[newMessage.attachments?.length - 1]?.attachmentType,
      originalName: newMessage.attachments?.[newMessage.attachments?.length - 1]?.originalName,
      createdAt: newMessage.createdAt,
      isEdited: newMessage.isEdited,
      isForwarded: newMessage.isForwarded,
      reactions: newMessage.reactions,
      replyTo: newMessage.replyTo,
      },
      }
      : c
      ),
      }));
      if (socket) {
      socket.emit("sendMessage", {
      message: newMessage,
      sender: authUser,
      chatId,
      isGroup,
      roomId,
      });
      } else {
      console.error("Socket not available for sendMessage");
      }
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
        chats: updatedChats,
        groupChats: updatedGroupChats,
        archivedChats: updatedArchivedChats,
      }));
      console.log(error.response?.data?.message || "Error sending message");
      throw error;
    }
  },
  getGroupChats: async () => {
  try {
    const res = await axiosInstance.get("/groups/group-chats"); // New endpoint
    set({ groupChats: res.data.map(group => ({ ...group, roomId: group.roomId || group._id })) });
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.emit("join_groups", res.data.map((group) => group.roomId || group._id));
    } else {
      console.error("Socket not available for join_groups");
    }

  } catch (error) {
    console.log("Error fetching group chats");
  } finally {

  }
},
  getMyChatPartners: async () => {
    try {
       const [friendsRes, userRes] = await Promise.all([
        axiosInstance.get("/friends"),
        axiosInstance.get("/auth/check"),
      ]);
      set({
        allContacts: friendsRes.data.map(contact => ({ ...contact, roomId: contact.roomId || contact._id })),
        blockedUsers: userRes.data.blockedUsers || [],
      });
     const res = await axiosInstance.get("/messages/chats");

      set({ chats: res.data.map(chat => ({ ...chat, roomId: chat.roomId || chat._id })) });
      const socket = useAuthStore.getState().socket;
      if (socket) {
        // SOLUTION: After fetching private chats, join all private rooms. This ensures the user is in all rooms, even unopened ones, to receive real-time "newMessage" broadcasts for list updates when online but not in chat.
        socket.emit("join_private_rooms", res.data.map(chat => chat.roomId || chat._id));
      }
    } catch (error) {
      console.log("Error fetching chats");
    } finally {

    }
  },
  reactToMessage: async (msgId, emoji) => {
    const socket = useAuthStore.getState().socket;
     const { messages, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();

    const { authUser } = useAuthStore.getState();
    const tempMessage = messages.find((m) => m._id === msgId._id);

    if (!tempMessage) return;
    const roomId = tempMessage.roomId || (selectedGroup ? selectedGroup._id : selectedUser?._id);
    const existingReaction = tempMessage.reactions.find((r) => r.userId.toString() === authUser._id.toString());
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === msgId._id
          ? {
              ...msg,
              reactions: existingReaction
                ? msg.reactions.map((r) => (r.userId.toString() === authUser._id.toString() ? { userId: authUser._id, emoji } : r))
                : [...msg.reactions, { userId: authUser._id, emoji }],
              roomId: tempMessage.roomId || (selectedGroup ? selectedGroup._id : msg?.roomId),
            }
          : msg
      ),
    }));

    const isGroup = !!selectedGroup;
    const chatId = isGroup ?  selectedGroup._id : selectedUser._id;
    let targetListKey = isGroup ? "groupChats" : "chats";
    let targetList = isGroup ? groupChats : chats;
    let updatedChats = chats.filter((c) => c._id !== chatId);
    let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
    let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
    let updatedList = [...targetList];

    const chatIndex = updatedList.findIndex((c) => c._id === chatId);
   console.log(chatIndex, updatedList, msgId)
    let chat;
    if (chatIndex === -1) {
      const targetUserOrGroup = isGroup ? { name: selectedGroup?.name, profilePic: selectedGroup?.profilePic } : { fullName: selectedUser?.fullName, profilePic: selectedUser?.profilePic };
      chat = {
        _id: chatId,
        roomId,
        name: isGroup ? targetUserOrGroup?.name : undefined,
        fullName: isGroup ? undefined : targetUserOrGroup?.fullName,
        profilePic: isGroup
          ? targetUserOrGroup?.profilePic || "/avatar.png"
          : targetUserOrGroup?.profilePic || "/avatar.png",
        recentMessage: {
          text,
          attachmentType: null,
          originalName: null,
          createdAt: new Date(),
          senderId: authUser._id,
          isEdited: false,
          reactions: [],
        },
        unreadCount: 0,
      };

      if (!chat.name && !chat.fullName) return;
      updatedList.unshift(chat);
    } else {
      chat = { ...updatedList[chatIndex], roomId };
      chat.recentMessage = {
        ...chat.recentMessage,
        reactions: [
          {
            userId: authUser._id,
            name: authUser.fullName,
            emoji: emoji
        }],
      };
      updatedList.splice(chatIndex, 1);
      updatedList.unshift(chat);
    }
    set({
      chats: updatedChats,
      groupChats: updatedGroupChats,
      archivedChats: updatedArchivedChats,
      [targetListKey]: updatedList,
    });

   // return
    try {
       const res = await axiosInstance.post(`/messages/react/${msgId._id}`, { emoji });
 // const chatId = selectedGroup ? selectedGroup._id : selectedUser?._id;

       if (socket) {
        socket.emit("messageReacted", { msgId, isRecent:false, emoji,  userId: authUser._id, chatId, isGroup: !!selectedGroup, roomId });
   return res.data;
      } else {
        console.error("Socket not available for messageReacted");
      }

    } catch (error) {
      set((state) => ({
        messages: state.messages.map((msg) => (msg._id === msgId ? tempMessage : msg)),
      }));
      console.log(error.response?.data?.message || "Failed to add reaction");
      throw error;
    }
  },
  pinMessage: async (msgId, duration) => {
    const socket = useAuthStore.getState().socket;
    const { messages,archivedChats, selectedUser,groupChats, chats, selectedGroup } = get();
    const userId = useAuthStore.getState().authUser._id;
    const authUser = useAuthStore.getState().authUser;

    const roomId = selectedGroup ? selectedGroup._id : (selectedUser?.roomId || messages.find((m) => m._id === msgId)?.roomId);
    let pinnedUntil;
    switch (duration) {
      case "24h": pinnedUntil = new Date(Date.now() + 86400000); break;
      case "7d": pinnedUntil = new Date(Date.now() + 604800000); break;
      case "14d": pinnedUntil = new Date(Date.now() + 1209600000); break;
      case "30d": pinnedUntil = new Date(Date.now() + 2592000000); break;
    }
    const tempMessages = messages.map(m => m._id === msgId ? { ...m, pinnedBy: userId, pinnedUntil, roomId } : m).sort((a, b) => b.pinnedUntil ? 1 : -1);
    set({ messages: tempMessages });
   const isGroup = !!selectedGroup;
    const chatId = isGroup ?  selectedGroup._id : selectedUser._id;
    let targetListKey = isGroup ? "groupChats" : "chats";
    let targetList = isGroup ? groupChats : chats;
    let updatedChats = chats.filter((c) => c._id !== chatId);
    let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
    let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
    let updatedList = [...targetList];

    const chatIndex = updatedList.findIndex((c) => c._id === chatId);
    let chat;
    if (chatIndex === -1) {
      const targetUserOrGroup = isGroup ? { name: selectedGroup?.name, profilePic: selectedGroup?.profilePic } : { fullName: selectedUser?.fullName, profilePic: selectedUser?.profilePic };
      chat = {
        _id: chatId,
        roomId,
        name: isGroup ? targetUserOrGroup?.name : undefined,
        fullName: isGroup ? undefined : targetUserOrGroup?.fullName,
        profilePic: isGroup
          ? targetUserOrGroup?.profilePic || "/avatar.png"
          : targetUserOrGroup?.profilePic || "/avatar.png",
        recentMessage: {
          text:"You have just pinned a message",
          attachmentType: null,
          originalName: null,
          createdAt: new Date(),
          senderId: authUser._id,
          isEdited: false,
          pinnedBy:[authUser._id],
          reactions: [],
        },
        unreadCount: 0,
      };

      if (!chat.name && !chat.fullName) return;
      updatedList.unshift(chat);
    } else {
      chat = { ...updatedList[chatIndex], roomId };
      chat.recentMessage = {
        ...chat.recentMessage,
        text:"You pinned a message",
        createdAt: new Date(),
       pinnedBy:[authUser._id],
      };
      updatedList.splice(chatIndex, 1);
      updatedList.unshift(chat);
    }
    set({
      chats: updatedChats,
      groupChats: updatedGroupChats,
      archivedChats: updatedArchivedChats,
      [targetListKey]: updatedList,
    });



    try {
      if (socket) {
        socket.emit("messagePinned", { msgId, pinnedUntil, pinnedBy: userId, chatId, isGroup: !!selectedGroup, roomId });
      console.log({ msgId, pinnedUntil, pinnedBy: userId, chatId, isGroup: !!selectedGroup, roomId })
      } else {
        console.error("Socket not available for messagePinned");
      }
     const res = await axiosInstance.post(`/messages/pin/${msgId}`, { duration });
      //const chatId = selectedGroup ? selectedGroup._id : selectedUser?._id;

    return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin message");
      throw error;
    }
  },
  unpinMessage: async (msgId) => {
    const socket = useAuthStore.getState().socket;
    const { messages, selectedUser, selectedGroup } = get();
    const roomId = selectedGroup ? selectedGroup._id : (selectedUser?.roomId || messages.find((m) => m._id === msgId)?.roomId);
    const tempMessages = messages.map(m => m._id === msgId ? { ...m, pinnedBy: null, pinnedUntil: null, roomId } : m);
    set({ messages: tempMessages });
    try {
      await axiosInstance.post(`/messages/unpin/${msgId}`);
      const chatId = selectedGroup ? selectedGroup._id : selectedUser?._id;
      if (socket) {
        socket.emit("messageUnpinned", { msgId, chatId, isGroup: !!selectedGroup, roomId });
      } else {
        console.error("Socket not available for messageUnpinned");
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Failed to unpin message");
      throw error;
    }
  },
  starMessage: async (msgId) => {
    const socket = useAuthStore.getState().socket;
    const { messages, selectedUser, selectedGroup } = get();
    const userId = useAuthStore.getState().authUser._id;
    const roomId = selectedGroup ? selectedGroup._id : (selectedUser?.roomId || messages.find((m) => m._id === msgId)?.roomId);
    const tempMessage = messages.find((m) => m._id === msgId);
    if (!tempMessage) return;
    const starredBy = tempMessage.starredBy.includes(userId) ? tempMessage.starredBy.filter(id => id !== userId) : [...tempMessage.starredBy, userId];
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === msgId ? { ...msg, starredBy, roomId } : msg
      ),
    }));
    try {
      await axiosInstance.post(`/messages/star/${msgId}`);
      const chatId = selectedGroup ? selectedGroup._id : selectedUser?._id;
      if (socket) {
        socket.emit("messageStarred", { msgId, starredBy, chatId, isGroup: !!selectedGroup, roomId });
      } else {
        console.error("Socket not available for messageStarred");
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Failed to star/unstar message");
      throw error;
    }
  },
  rejoinAllRooms: (socket) => {
  const { selectedUser, selectedGroup, chats, groupChats } = get();

  const roomIds = new Set();

  // Private rooms
  chats.forEach(chat => {
    if (chat.roomId) roomIds.add(chat.roomId);
  });

  // Group rooms
  groupChats.forEach(group => {
    roomIds.add(group._id.toString());
  });

  // Current open chat
  if (selectedUser?.roomId) roomIds.add(selectedUser.roomId);
  if (selectedGroup?._id) roomIds.add(selectedGroup._id.toString());

  roomIds.forEach(roomId => {
    socket.emit("join_groups", [roomId]);
    socket.emit("join_private_rooms", [roomId]);
  });
},
  saveMessage: async (messageId) => {
    const socket = useAuthStore.getState().socket;
    const { messages, selectedUser, selectedGroup } = get();
    const userId = useAuthStore.getState().authUser._id;
    const roomId = selectedGroup ? selectedGroup._id : (selectedUser?.roomId || messages.find((m) => m._id === messageId._id)?.roomId);
    const tempMessages = messages.map(m => m._id === messageId._id ? {...m, savedBy: m?.savedBy.length > 0 ? [] : [userId], updatedAt: new Date(), roomId  } : m);
  //   console.log("isSaved tempMessages",tempMessages)
       set({ messages: tempMessages });

    try {
      const response = await axiosInstance.post(`/messages/toggle-save/${messageId._id}`);
      const { updatedMessage } = response.data;
      set((state) => {
        const updatedMessages = state.messages.map((msg) =>
          msg._id === messageId._id ? { ...msg, savedBy: updatedMessage.savedBy, roomId } : msg
        );
        const isSaved = updatedMessage.savedBy.includes(userId);
        const updatedSavedMessages = isSaved
          ? [...state.savedMessages, { ...updatedMessage, roomId }].filter(
              (msg, index, self) => msg && self.findIndex((m) => m._id === msg._id) === index
            )
          : state.savedMessages.filter((msg) => msg._id !== messageId._id);
        return {
          messages: updatedMessages,
          savedMessages: updatedSavedMessages,
        };
      });
      if (socket) {
        socket.emit(isSaved ? "messageSaved" : "messageUnsaved", { msgId: messageId, userId, roomId });
      }
    } catch (error) {
      console.error("Error saving message:", error);
      if (error.response?.status === 400) {
        console.log("Cannot save system messages");
      } else {
        console.log("Failed to save message");
      }
    }
  },
  fetchSavedMessages: async () => {
      const { messages, selectedUser, selectedGroup } = get();
      const isGroup = !!selectedGroup;
      const chatId = isGroup ? selectedGroup._id : selectedUser._id
     console.log(chatId,"chatId")
      try {
      const response = await axiosInstance.get(`/messages/saved-messages/${chatId}`);
      set({ savedMessages: response.data.map(msg => ({ ...msg, roomId: msg.groupId || msg.roomId })) });
    } catch (error) {
      console.error("Error fetching saved messages:", error);
      console.log("Failed to fetch saved messages");
    }
  },
  // deleteMessage: async (msgIds, forEveryone) => {
  //   const socket = useAuthStore.getState().socket;
  //   const { messages,chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
  //      const authUser = useAuthStore.getState().authUser;
  //  const tempMessages =  messages.map(m => m._id === msgIds ? { ...m, text:"This message was deleted" , deletedForEveryone: forEveryone, deletedBy: [authUser._id], attachments:[] } : m);
  //   const tempMessage = messages.find((m) => m._id === msgIds);

  //   if (!tempMessage) return;
  //   const roomId = tempMessage.roomId || (selectedGroup ? selectedGroup._id : selectedUser?._id);
  //  const isGroup = !!selectedGroup;
  //   const chatId = isGroup ?  selectedGroup._id : selectedUser._id;
  //   let targetListKey = isGroup ? "groupChats" : "chats";
  //   let targetList = isGroup ? groupChats : chats;
  //   let updatedChats = chats.filter((c) => c._id !== chatId);
  //   let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
  //   let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
  //   let updatedList = [...targetList];

  //   const chatIndex = updatedList.findIndex((c) => c._id === chatId);
  //   let chat;

  //     chat = { ...updatedList[chatIndex], roomId };
  //     chat.recentMessage = {
  //       ...chat.recentMessage,
  //       text:"This message was deleted",
  //       createdAt: new Date(),
  //      deletedBy:[authUser._id],
  //      deletedForEveryone: forEveryone,
  //     };
  //     updatedList.splice(chatIndex, 1);
  //     updatedList.unshift(chat);

  //   //  set({ messages: tempMessages });

  //   set({
  //   // chats: updatedChats,
  //    //groupChats: updatedGroupChats,
  //     //archivedChats: updatedArchivedChats,
  //     messages: tempMessages,
  //     [targetListKey]: updatedList,
  //   });
  //  try {
  //       await axiosInstance.post("/messages/delete", { msgId: msgIds, forEveryone });

  //     for (const msgId of msgIds) {
  //       const msg = messages.find(m => m._id === msgId);

  //           console.log(msgId,"msg",msg, "tempMessage._ud",messages)
  //  const chatId = msg.groupId || (msg.receiverId._id === authUser._id ? msg.senderId._id : msg.receiverId_id);
  //       const isGroup = !!msg.groupId;
  //       const roomId = msg.roomId || (isGroup ? chatId : (selectedUser?.roomId || chatId));
  //       if (socket) {
  //         socket.emit("messageDeleted", { msgId, forEveryone, deletedBy: authUser._id, chatId, isGroup, roomId });


  //       } else {
  //         console.error("Socket not available for messageDeleted");
  //       }
  //     }

  //   } catch (error) {
  //     set({ messages });
  //     console.log(error.response?.data?.message || "Failed to delete message");
  //     throw error;
  //   }
  // },

 deleteMessage: async (msgIds, forEveryone) => {
  const socket = useAuthStore.getState().socket;
  const { messages, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
  const authUser = useAuthStore.getState().authUser;

  if (!Array.isArray(msgIds)) msgIds = [msgIds]; // Ensure array for single/multi

  // FIX: Correctly update local messages (filter all matching msgIds)
  const tempMessages = messages.map((m) =>
    msgIds.includes(m._id)
      ? {
          ...m,
          text: "This message was deleted",
          deletedForEveryone: forEveryone,
          deletedBy: forEveryone ? [] : [authUser._id], // For "everyone", backend sets deletedBy=[], but temp stub uses empty; for "me", add self
          attachments: [],
          visibleTo: forEveryone ? [] : m.visibleTo?.filter((id) => id.toString() !== authUser._id.toString()) || [], // Sync with backend logic
        }
      : m
  );

  // FIX: Only update recentMessage if a deleted msg was the recent one (check across all msgIds)
  const isGroup = !!selectedGroup;
 const chatId = isGroup ?  selectedGroup._id : selectedUser._id;
    let targetListKey = isGroup ? "groupChats" : "chats";
    let targetList = isGroup ? groupChats : chats;
    let updatedChats = chats.filter((c) => c._id !== chatId);
    let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
    let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
    let updatedList = [...targetList];


  const chatIndex = updatedList.findIndex((c) => c._id === chatId);
    let chat;

      chat = { ...updatedList[chatIndex]};
      chat.recentMessage = {
        ...chat.recentMessage,
        text:"This message was deleted",
        createdAt: new Date(),
       deletedBy:[authUser._id],
       deletedForEveryone: forEveryone,
      };
      updatedList.splice(chatIndex, 1);
      updatedList.unshift(chat);
  // Apply local updates immediately for UI reflection
  set({
    messages: tempMessages,
    [targetListKey]: updatedList,
  });

  try {
    // FIX: Send msgIds as array to backend
   // await axiosInstance.post("/messages/delete", { msgIds, forEveryone });

    // Emit via socket for each msg (for real-time sync to others)
    for (const msgId of msgIds) {
      const msg = messages.find((m) => m._id === msgId);
      if (!msg) continue;

      const chatId = msg.groupId || (msg.receiverId?._id === authUser._id ? msg.senderId?._id : msg.receiverId_id);
      const isGroup = !!msg.groupId;
      const roomId = msg.roomId || (isGroup ? chatId : selectedUser?.roomId || chatId);

      if (socket) {
        socket.emit("messageDeleted", {
          msgId,
          forEveryone,
          deletedBy: authUser._id,
          chatId,
          isGroup,
          roomId,
        });
      } else {
        console.error("Socket not available for messageDeleted");
      }
    }
  } catch (error) {
    // Revert on error
    set({ messages });
    console.error(error.response?.data?.message || "Failed to delete message(s)");
    throw error;
  }
},
   reportChat: async (userId, reason, details) => { // NEW: Accept reason and details
     const {selectedUser,chats,archivedChats, groupChats, messages,  selectedGroup } = get();
   const isGroup = !!selectedGroup
   const chatId = isGroup && userId === selectedGroup._id ? selectedGroup._id :  userId
   const { authUser } = useAuthStore.getState();
   const roomId = isGroup ? userId.toString() : `private_${userId}_${authUser._id}`;

   const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage = {
      _id: tempId,
      text: `We have received your report about ${isGroup ? "this group" : "chat with this user"} "${isGroup ? selectedGroup.name : selectedUser.fullName}". Our team are reviewing your report, and within a day, you will get a response. For the meantime, you will be blocked from this chat`,
      // `We have received your report about ${isGroup ? "this group" : "chat with this user"} "${targetName}". Our team are reviewing your report, and within a day, you will get a response. For the meantime, you will be blocked from this chat`,

    //  || `You reported ${isGroup ? "group" : "user"} "${isGroup ? selectedGroup.name : selectedUser.fullName}". Our team will review your report. Within a day, you will get a response`,
      senderId: authUser,
      receiverId: isGroup ? null : userId,
      groupId: isGroup ? userId : null,
      roomId,
      attachments:[],
      createdAt: new Date(),
      readBy: isGroup ? [] : [{ userId: authUser._id, readAt: new Date() }],
      pendingFor: isGroup ? groupChats.find(g => g._id === userId)?.members.map(m => m._id.toString()).filter(id => id !== authUser._id.toString()) || [] : [userId],
      isEdited: false,
      reactions: [],
      isPinned: false,
      isStarred: false,
      replyTo: null,
      isSystem: true,
      visibleTo: [authUser._id],
    };

    if ((selectedGroup && userId === selectedGroup._id) || (selectedUser && userId === selectedUser._id)) {
      set({
        messages: [...messages, tempMessage],
         })
         ;
    }
     if ((selectedUser && userId === selectedUser._id)) {
      set((state) => ({
        selectedUser:  state.selectedUser,
        report:true,
        blockedUsers: [...state.blockedUsers, userId],
      }));
    }

      let targetListKey = isGroup ? "groupChats" : "chats";
    let targetList = isGroup ? groupChats : chats;
    let updatedChats = chats.filter((c) => c._id !== chatId);
    let updatedGroupChats = groupChats.filter((c) => c._id !== chatId);
    let updatedArchivedChats = archivedChats.filter((c) => c._id !== chatId);
    let updatedList = [...targetList];

    const chatIndex = updatedList.findIndex((c) => c._id === chatId);
    let chat;

      chat = { ...updatedList[chatIndex], roomId,  name: isGroup ? selectedGroup.name : undefined,
          fullName: isGroup ? undefined : authUser.fullName,
          profilePic: isGroup ? (selectedGroup.profilePic || "/avatar.png") : (authUser.profilePic || "/avatar.png"),
          };
      chat.recentMessage = {
         text: `We have received your report about your chat with this ${isGroup ? "group" : "user"} "${isGroup ? selectedGroup.name : selectedUser.fullName}". Our team will review your report, and within a day, you will get a response. For the meantime, you will be blocked from this chat`,
        attachmentType:[],
        originalName: null,
        createdAt: new Date(),
        isEdited: false,
        reactions: [],
        isPinned: false,
        isStarred: false,
        replyTo: null,
        isSystem:true,
      };
      chat.unreadCount = 0;
      updatedList.splice(chatIndex, 1);
      updatedList.unshift(chat);

    set({
      chats: updatedChats,
      groupChats: updatedGroupChats,
      archivedChats: updatedArchivedChats,
      [targetListKey]: updatedList,
    });

    try {
      // NEW: Send reason and details in the request body
  await axiosInstance.post(`/friends/report-chat/${userId}`, {type: isGroup ? "group" : "private", reason, details });
  const socket = useAuthStore.getState().socket;
      if (socket && roomId) {
        socket.emit("user_blocked", { userId, blockedBy: useAuthStore.getState().authUser._id, roomId,  report:true, });
        socket.emit("leave_private_rooms", [roomId]);
      } else {
        console.error("Socket or roomId not available for user_blocked");
      }
 toast.success("Chat reported successfully");
    } catch (error) {
      toast.error("Failed to report chat");
      console.error("Report chat error:", error);
    }
  },
     deleteChat: async (userId) => { // NEW: Accept reason and details
     const {setSelectedUser, setSelectedGroup, selectedUser,chats,archivedChats, groupChats, messages,  selectedGroup } = get();
    toast.success(userId);

    try {
      // NEW: Send reason and details in the request body
 await axiosInstance.delete(`/messages/delete-chat/${userId}`);
  const socket = useAuthStore.getState().socket;
      //  socket.emit({"leave_private_rooms", [roomId]);

   set({
      chats: chats.filter((c) => c._id !== userId),
      groupChats: groupChats.filter((c) => c._id !== userId),
      archivedChats: archivedChats.filter((c) => c._id !== userId),

    });

       setSelectedUser({...selectedUser, roomId: null})
       setSelectedGroup({...selectedGroup, roomId: null})

    } catch (error) {
      toast.error("Failed to report chat");
      console.error("Report chat error:", error);
    }
  },
  getFilteredChats: async (query) => {
  try {
    const res = await axiosInstance.get(`/messages/search?q=${query}`);
    set({ searchResults: res.data });  // Store deep results
  } catch (error) {
    console.log("Error searching chats");
  } finally {

  }
},
  getAllContacts: async () => {
    try {
      const [friendsRes, userRes] = await Promise.all([
        axiosInstance.get("/friends"),
        axiosInstance.get("/auth/check"),
      ]);
      set({
        allContacts: friendsRes.data.map(contact => ({ ...contact, roomId: contact.roomId || contact._id })),
        blockedUsers: userRes.data.blockedUsers || [],
      });
    } catch (error) {
      console.log("Error fetching contacts");
    } finally {

    }
  },
  getReceivedRequests: async () => {
     try {
      const res = await axiosInstance.get("/friends/received-requests");
      set({ receivedRequests: res.data.map(req => ({ ...req, roomId: req.privateRoomId })) });
    } catch (error) {
      console.log("Error fetching requests");
    } finally {

    }
  },
  checkIsChatArchived: async (chatId, isGroup = false) => {
    try {
      const res = await axiosInstance.get(`/messages/archived-chats`);
      const archivedChats = res.data;
      return archivedChats.some((chat) => chat._id === chatId);
    } catch (error) {
      console.error("Error checking archived status:", error);
      return get().archivedChats.some((chat) => chat._id === chatId);
    }
  },
  getSentRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/sent-requests");
      set({ sentRequests: res.data.map(req => ({ ...req, roomId: req.privateRoomId })) });
    } catch (error) {
      console.log("Error fetching sent requests");
    } finally {

    }
  },
  getUsersForRequest: async () => {

    try {
      const res = await axiosInstance.get("/friends/users-for-request");
      set({ usersForRequest: res.data }); // Modified: Now includes pending/declined with flags
    } catch (error) {
      console.log("Error fetching users");
    } finally {

    }
  },
  getNotifications: async () => {

    try {
      const res = await axiosInstance.get("/friends/notifications");
      set({ notifications: res.data });
    } catch (error) {
      console.log("Error fetching notifications");
    } finally {

    }
  },
  sendFriendRequest: async (userId) => {
    try {
      console.log("Sending friend request to userId:", userId);
      const res = await axiosInstance.post(`/friends/send/${userId}`);
      const { roomId } = res.data;
      toast.success("Friend request sent");
      get().getUsersForRequest();
      get().getSentRequests();
      get().getReceivedRequests();
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("newFriendRequest", { roomId });
      }
    } catch (error) {
      console.log(error.response?.data.message || "Error sending request");
    }
  },
  acceptRequest: async (requestId) => {
    try {
      const res = await axiosInstance.post(`/friends/accept/${requestId}`);
      const { roomId } = res.data;
      toast.success("Request accepted");
      get().getReceivedRequests();
      get().getSentRequests();
      get().getAllContacts();
      get().getUsersForRequest();
      get().getNotifications();
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("friendRequestAccepted", { roomId });
      }
    } catch (error) {
      console.log(error.response?.data.message || "Error accepting request");
    }
  },
  declineRequest: async (requestId) => {
    try {
      await axiosInstance.post(`/friends/decline/${requestId}`);
      toast.success("Request declined");
      get().getReceivedRequests();
      get().getSentRequests();
      get().getUsersForRequest();

      get().getNotifications();
    } catch (error) {
      console.log(error.response?.data.message || "Error declining request");
    }
  },
  // New: Cancel sent request
  cancelRequest: async (requestId) => {
    toast.success(requestId)
    try {
      await axiosInstance.post(`/friends/cancel/${requestId}`);
      toast.success("Request cancelled");
      get().getReceivedRequests();
      get().getSentRequests();
      get().getUsersForRequest();
      get().getNotifications();
    } catch (error) {
      console.log(error.response?.data.message || "Error cancelling request");
    }
  },
  getMessagesByUserId: async (userId) => {
     const [friendsRes, userRes] = await Promise.all([
        axiosInstance.get("/friends"),
        axiosInstance.get("/auth/check"),
      ]);
      set({
        allContacts: friendsRes.data.map(contact => ({ ...contact, roomId: contact.roomId || contact._id })),
        blockedUsers: userRes.data.blockedUsers || [],
      });
    set({ isMessagesLoading: true });
    try {
      const isArchived = get().archivedChats.some((c) => c._id === userId);
      const res = await axiosInstance.get(`/messages/user/${userId}${isArchived ? '?archived=true' : ''}`);
      const roomId = res.data[0]?.roomId || userId;
      set({
        messages: res.data
          .filter(msg => msg.visibleTo.length === 0 || msg.visibleTo.some(id => id.toString() === useAuthStore.getState().authUser._id.toString()))
          .map(msg => ({ ...msg, roomId }))
      });
      const unreadMsgIds = res.data
        .filter((msg) => !msg.readBy.some((rb) => rb.userId.toString() === useAuthStore.getState().authUser._id.toString()))
        .map((msg) => msg._id);
      if (unreadMsgIds.length > 0) {
        get().markMessageAsRead(unreadMsgIds, null, roomId);
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error fetching messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  getMessagesByGroupId: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const isArchived = get().archivedChats.some((c) => c._id === groupId);
      const res = await axiosInstance.get(`/messages/group/${groupId}${isArchived ? '?archived=true' : ''}`);
      set({
        messages: res.data
          .filter(msg => msg.visibleTo.length === 0 || msg.visibleTo.some(id => id.toString() === useAuthStore.getState().authUser._id.toString()))
          .map(msg => ({ ...msg, roomId: groupId }))
      });
      const unreadMsgIds = res.data
        .filter((msg) => !msg.readBy.some((rb) => rb.userId.toString() === useAuthStore.getState().authUser._id.toString()))
        .map((msg) => msg._id);
      if (unreadMsgIds.length > 0) {
        get().markMessageAsRead(unreadMsgIds, groupId, groupId);
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error fetching group messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  markMessageAsRead: async (msgIds, groupId = null, roomId) => {
    const { processedMessageIds, selectedUser, selectedGroup } = get();
    const { authUser } = useAuthStore.getState();
    const socket = useAuthStore.getState().socket;
    const isGroup = !!selectedGroup
    const chatId = isGroup ? selectedGroup._id : selectedUser._id ;
    if (!chatId) return;
    // Filter out already processed message IDs
    const unprocessedMsgIds = msgIds ? msgIds?.filter(id => !processedMessageIds.has(id)) : [];
    if (unprocessedMsgIds.length === 0) return;
    try {
      const res = await axiosInstance.post("/messages/mark-read", { msgIds: unprocessedMsgIds, groupId });
      set((state) => {
        // Update processed message IDs
        const newProcessed = new Set([...state.processedMessageIds, ...unprocessedMsgIds]);
        // Update messages
        const updatedMessages = state.messages.map((msg) =>
          res.data.updatedMessages.some((um) => um.msgId.toString() === msg._id.toString())
            ? {
                ...msg,
                readBy: [...msg.readBy, { userId: authUser._id, readAt: new Date() }],
                pendingFor: msg.pendingFor.filter((id) => id !== authUser._id.toString()),
                roomId,
              }
            : msg
        );
        // Update unread counts
        const chatId = groupId || state.selectedUser?._id;
        return {
          messages: updatedMessages,
          processedMessageIds: newProcessed,
          chats: state.chats.map((chat) =>
            !groupId && state.selectedUser && chat._id === state.selectedUser._id
              ? {
                  ...chat,
                  unreadCount: updatedMessages.filter(
                    (m) =>
                      m.receiverId?.toString() === authUser._id.toString() &&
                      !m.readBy.some((rb) => rb.userId.toString() === authUser._id.toString())
                  ).length,
                }
              : chat
          ),
          groupChats: state.groupChats.map((g) =>
            groupId && g._id === groupId
              ? {
                  ...g,
                  unreadCount: updatedMessages.filter(
                    (m) =>
                      m.groupId?.toString() === groupId &&
                      !m.readBy.some((rb) => rb.userId.toString() === authUser._id.toString())
                  ).length,
                }
              : g
          ),
          archivedChats: state.archivedChats.map((chat) =>
            (groupId ? chat._id === groupId : state.selectedUser?._id === chat._id)
              ? {
                  ...chat,
                  unreadCount: updatedMessages.filter(
                    (m) =>
                      (groupId
                        ? m.groupId?.toString() === groupId
                        : m.receiverId?.toString() === authUser._id.toString()) &&
                      !m.readBy.some((rb) => rb.userId.toString() === authUser._id.toString())
                  ).length,
                }
              : chat
          ),
        };
      });
      if (socket) {
        socket.emit("messageRead", {
          msgIds: res.data.updatedMessages.map((um) => um.msgId),
          readerId: authUser._id,
          readAt: new Date(),
          chatId,
          isGroup: !!groupId,
          roomId,
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      toast.error(error.response?.data?.message || "Error marking messages as read");
    }
  },
  createGroup: async ({ name, members, profilePic }) => {
    try {
      const res = await axiosInstance.post("/groups/create", { name, members, profilePic });
      const { _id: roomId } = res.data;
      get().getUserGroups();
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("groupCreated", { ...res.data, roomId });
      }
      return res;
    } catch (error) {
      console.log(error.response?.data?.message || "Error creating group");
      throw error;
    }
  },
  getUserGroups: async () => {

    try {
      const res = await axiosInstance.get("/groups/user-groups");
      set({ allGroups: res.data });
      // const socket = useAuthStore.getState().socket;
      // if (socket) {
      //   socket.emit("join_groups", res.data.map((group) => group._id));
      // } else {
      //   console.error("Socket not available for join_groups");
      // }
    } catch (error) {
      console.log("Error fetching groups");
    } finally {

    }
  },
 sendGroupJoinRequest : async (groupId) => {
    try {
      console.log("Sending join request to groupId:", groupId);
      await axiosInstance.post(`/groups/send-join-request/${groupId}`);
      toast.success("Group join request sent");
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("newGroupRequest", groupId);
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error sending group join request");
    }
  },
  exitGroup: async (groupId) => {
    try {
    await axiosInstance.post(`/friends/exit-group/${groupId}`);
      set((state) => ({
        groupChats: state.groupChats.filter((group) => group._id !== groupId),
        archivedChats: state.archivedChats.filter((chat) => chat._id !== groupId),
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
      }));
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("leave_groups", [groupId]);
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error exiting group");
    }
  },
  deleteFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/delete-friend/${friendId}`);
      const roomId = get().chats.find((c) => c._id === friendId)?.roomId;
      set((state) => ({
        allContacts: state.allContacts.filter((contact) => contact._id !== friendId),
        chats: state.chats.filter((chat) => chat._id !== friendId),
        archivedChats: state.archivedChats.filter((chat) => chat._id !== friendId),
        selectedUser: state.selectedUser?._id === friendId ? null : state.selectedUser,
      }));
      const socket = useAuthStore.getState().socket;
      if (socket && roomId) {
        socket.emit("friend_deleted", { userId: friendId, deletedBy: useAuthStore.getState().authUser._id, roomId });
        socket.emit("leave_private_rooms", [roomId]);
      } else {
        console.error("Socket or roomId not available for friend_deleted");
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error deleting friend");
    }
  },
  queueAction: (action) => {
    const queuedActions = [...get().queuedActions, { ...action, id: `action-${Date.now()}-${Math.random()}` }];
    localStorage.setItem('queuedActions', JSON.stringify(queuedActions));
    set({ queuedActions });
    // Optimistic UI updates based on action type
    switch (action.type) {
      case "sendFriendRequest": {
        set((state) => ({
          usersForRequest: state.usersForRequest.map((user) =>
            user._id === action.userId
              ? { ...user, hasPendingSent: true, requestSentAt: new Date(), requestId: action.id }
              : user
          ),
          sentRequests: [
            ...state.sentRequests,
            {
              _id: action.id,
              to: { _id: action.userId, fullName: state.usersForRequest.find(u => u._id === action.userId)?.fullName || "Unknown" },
              from: { _id: action.senderId },
              status: "pending",
              updatedAt: new Date(),
              privateRoomId: `temp-room-${action.id}`,
            },
          ],
        }));
        break;
      }
      case "acceptRequest": {
        set((state) => ({
          receivedRequests: state.receivedRequests.filter((req) => req._id !== action.requestId),
          allContacts: [
            ...state.allContacts,
            {
              _id: state.receivedRequests.find(r => r._id === action.requestId)?.from._id,
              fullName: state.receivedRequests.find(r => r._id === action.requestId)?.from.fullName,
              profilePic: state.receivedRequests.find(r => r._id === action.requestId)?.from.profilePic || "/avatar.png",
              roomId: `temp-room-${action.requestId}`,
            },
          ],
        }));
        break;
      }
      case "declineRequest": {
        set((state) => ({
          receivedRequests: state.receivedRequests.filter((req) => req._id !== action.requestId),
        }));
        break;
      }
      // New: Queue for cancelRequest
      case "cancelRequest": {
        set((state) => ({
          sentRequests: state.sentRequests.filter((req) => req._id !== action.requestId),
        }));
        break;
      }
      case "createGroup": {
        const tempGroupId = `temp-group-${action.id}`;
        set((state) => ({
          groupChats: [
            ...state.groupChats,
            {
              _id: tempGroupId,
              name: action.data.name,
              members: action.data.members.map(memberId => ({
                _id: memberId,
                fullName: state.allContacts.find(c => c._id === memberId)?.fullName || "Unknown",
              })),
              profilePic: action.data.profilePic || "/avatar.png",
              roomId: tempGroupId,
            },
          ],
        }));
        break;
      }
      case "sendGroupJoinRequest": {
        // No UI update needed for group join request, as it's typically handled by notifications
        break;
      }
      default:
        console.warn("Unknown action type:", action.type);
    }
  },
  syncOfflineActions: async () => {
    const { queuedActions, sendFriendRequest, acceptRequest, declineRequest, createGroup, joinGroup, cancelRequest } = get(); // Modified: Added cancelRequest
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    for (const action of queuedActions) {
      try {
        switch (action.type) {
          case "sendFriendRequest": {
            await sendFriendRequest(action.userId);
            break;
          }
          case "acceptRequest": {
            await acceptRequest(action.requestId);
            break;
          }
          case "declineRequest": {
            await declineRequest(action.requestId);
            break;
          }
          // New: Sync for cancelRequest
          case "cancelRequest": {
            await cancelRequest(action.requestId);
            break;
          }
          case "createGroup": {
            await createGroup(action.data);
            break;
          }
          case "sendGroupJoinRequest": {
            await joinGroup(action.groupId);
            break;
          }
          default:
            console.warn("Unknown queued action type:", action.type);
        }
        // Remove the action from the queue after successful execution
        set((state) => {
          const updatedActions = state.queuedActions.filter((a) => a.id !== action.id);
          localStorage.setItem('queuedActions', JSON.stringify(updatedActions));
          return { queuedActions: updatedActions };
        });
      } catch (error) {
        console.error(`Error syncing action ${action.type}:`, error);
        console.log(`Failed to sync action: ${action.type}`);
      }
    }
  },
  // Modified: Update user request status (used in socket listeners), handles declinedCooldown and removal on accepted
  updateUserRequestStatus: (userId, hasPendingRequest, requestId, status, requestAt) => {
    set((state) => {
      if (status === "accepted") {
        return {
          usersForRequest: state.usersForRequest.filter((user) => user._id !== userId),
        };
      }
      let updatedUsers = state.usersForRequest.map((user) =>
        user._id === userId
          ? {
              ...user,
              hasPendingRequest,
              hasPendingSent: status === "pending" && user.hasPendingSent, // Distinguish sent/received if needed
              hasPendingReceived: status === "pending" && user.hasPendingReceived,
              requestId,
              requestStatus: status,
              requestSentAt: requestAt || user.requestSentAt,
              isDeclinedCooldown: status === "declined" ? true : user.isDeclinedCooldown,
              declinedAt: status === "declined" ? new Date() : user.declinedAt
            }
          : user
      );
      return { usersForRequest: updatedUsers };
    });
  },
  // New action to add received request (used in socket listeners)
  addReceivedRequest: (request) => {
    set((state) => ({
      receivedRequests: [...state.receivedRequests, { ...request, type: "received" }],
    }));
  },
  // New action to update sent request status (used in socket listeners)
  updateSentRequestStatus: (requestId, status) => {
    set((state) => ({
      sentRequests: state.sentRequests.map((req) =>
        req._id === requestId ? { ...req, status, updatedAt: new Date() } : req
      ),
    }));
  },

  updateGroupSentRequestStatus: () => {
    set((state) => ({
      groupJoinRequests: state.groupJoinRequests.map((req) =>
        req
      ),
      allGroups: state.allGroups.map((group) =>
        group
      ),
    }));
   // set({ groupJoinRequests: res.data });
  },
  blockUser: async (userId) => {
    try {
  await axiosInstance.post(`/friends/block/${userId}`);
      const roomId = get().chats.find((c) => c._id === userId)?.roomId;
     // toast.success(roomId)
      set((state) => ({
       // allContacts: state.allContacts.filter((contact) => contact._id !== userId),
       // chats: state.chats.filter((chat) => chat._id !== userId),
       // archivedChats: state.archivedChats.filter((chat) => chat._id !== userId),
        selectedUser:  state.selectedUser,
        blockedUsers: [...state.blockedUsers, userId],
      }));
      const socket = useAuthStore.getState().socket;
      if (socket && roomId) {
        socket.emit("user_blocked", { userId, blockedBy: useAuthStore.getState().authUser._id, roomId });
        socket.emit("leave_private_rooms", [roomId]);
      } else {
        console.error("Socket or roomId not available for user_blocked");
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error blocking user");
    }
  },
  unblockUser: async (userId) => {
    try {
    await axiosInstance.post(`/friends/unblock/${userId}`);
      set((state) => ({
         selectedUser:  state.selectedUser,
         blockedUsers: state.blockedUsers.filter((id) => id !== userId),
      }));
      get().getMyChatPartners();
      get().getGroupChats();
      const socket = useAuthStore.getState().socket;
      if (socket) {
         const roomId = get().chats.find((c) => c._id === userId)?.roomId;

      //  const roomId = (await axiosInstance.get(`/friends/received-requests`)).data.find(req => req.from._id === userId)?.privateRoomId;
        if (roomId) {
        // toast.error(`${userId}, ${roomId},`)
          socket.emit("user_unblocked", { userId, unblockedBy: useAuthStore.getState().authUser._id, roomId });
          socket.emit("join_private_rooms", [roomId]);
        }
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error unblocking user");
    }
  },
  getGroupJoinRequests: async (groupId) => {

    try {
      const res = await axiosInstance.get(`/groups/join-requests/${groupId}`);
      set({ groupJoinRequests: res.data });
    } catch (error) {
      console.log("Error fetching group join requests");
    } finally {

    }
  },
  acceptGroupJoinRequest: async (groupId, userId) => {
    try {
      toast.loading("Processing Request")
      await axiosInstance.post(`/groups/accept-join-request/${groupId}/${userId}`);
      get().getGroupJoinRequests(groupId);
      get().getUserGroups()
      toast.dismiss()
      toast.success("Group join request accepted");
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("groupJoined", { groupId, roomId: groupId });
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error accepting group join request");
    }
  },
  declineGroupJoinRequest: async (groupId, userId) => {


    try {
      toast.loading("Processing Request")
      await axiosInstance.post(`/groups/decline-join-request/${groupId}/${userId}`);
     toast.dismiss()
     toast.success("Group join request declined");

      get().getGroupJoinRequests(groupId);
      get().getUserGroups()
          } catch (error) {
      toast.dismiss()
      toast.error("Failed To decline")
      console.log(error.response?.data?.message || "Error declining group join request");
    } finally{
toast.dismiss()
    }
  },
   removeUser: async (groupId, userId) => {
    try {
      toast.loading("Processing Request")
      await axiosInstance.delete(`/groups/remove-user/${groupId}/${userId}`);
     toast.dismiss()
     toast.success("Group join request declined");

      get().getGroupJoinRequests(groupId);
      get().getUserGroups()
      get().getMyChatPartners()
      get().getGroupChats()
        if (socket) {
        socket.emit("leave_groups", [groupId]);
      }
          } catch (error) {
      toast.dismiss()
      toast.error("Failed To decline")
      console.log(error.response?.data?.message || "Error declining group join request");
    } finally{
toast.dismiss()
    }
  },
  markMessageAsArchived: async (msgId) => {
    try {
      const { messages, chats, groupChats, archivedChats } = get();
      const message = messages.find((msg) => msg._id === msgId);
      if (!message) return;
      const chatId = message.groupId || (message.receiverId === useAuthStore.getState().authUser._id ? message.senderId : message.receiverId);
      const isGroup = !!message.groupId;
      const roomId = message.roomId || (isGroup ? chatId : get().chats.find((c) => c._id === chatId)?.roomId);
      await axiosInstance.post(`/messages/mark-archived`, { msgId });
      set((state) => {
        const targetListKey = isGroup ? "groupChats" : "chats";
        const targetList = isGroup ? state.groupChats : state.chats;
        const chat = targetList.find((c) => c._id === chatId) || state.archivedChats.find((c) => c._id === chatId);
        if (!chat) return state;
        return {
          messages: state.messages.filter((msg) => msg._id !== msgId),
          [targetListKey]: state[targetListKey].filter((c) => c._id !== chatId),
          archivedChats: [{ ...chat, roomId }, ...state.archivedChats.filter((c) => c._id !== chatId)],
        };
      });
      const socket = useAuthStore.getState().socket;
      if (socket && roomId) {
        socket.emit("messageArchived", { msgId, archivedBy: useAuthStore.getState().authUser._id, roomId });
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error archiving message");
    }
  },
  getArchivedChats: async () => {

    try {
      const res = await axiosInstance.get("/messages/archived-chats");
      set({ archivedChats: res.data.filter(chat => chat && (chat.name || chat.fullName)).map(chat => ({ ...chat, roomId: chat.roomId || chat._id })) });
    } catch (error) {
      console.log("Error fetching archived chats");
    } finally {

    }
  },
  unarchiveChat: async (chatId) => {
    try {
      await axiosInstance.post(`/messages/archive-chat/${chatId}`, { unarchive: true });
      set((state) => {
        const chat = state.archivedChats.find((c) => c._id === chatId);
        if (!chat) return state;
        const targetListKey = chat.name ? "groupChats" : "chats";
        return {
          archivedChats: state.archivedChats.filter((c) => c._id !== chatId),
          [targetListKey]: [{ ...chat, roomId: chat.roomId || chat._id }, ...state[targetListKey]],
        };
      });
      toast.success("Chat unarchived");
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("join_groups", [chatId]);
      }
    } catch (error) {
      console.log(error.response?.data?.message || "Error unarchiving chat");
    }
  },
  archiveChat: async (chatId) => {
    try {
      await axiosInstance.post(`/messages/archive-chat/${chatId}`, { unarchive: false });
      set((state) => {
        const isGroup = state.groupChats.some((g) => g._id === chatId);
        const targetListKey = isGroup ? "groupChats" : "chats";
        const chat = state[targetListKey].find((c) => c._id === chatId);
        if (!chat) return state;
        return {
          [targetListKey]: state[targetListKey].filter((c) => c._id !== chatId),
          archivedChats: [{ ...chat, roomId: chat.roomId || chat._id }, ...state.archivedChats],
          selectedUser: !isGroup && state.selectedUser?._id === chatId ? null : state.selectedUser,
          selectedGroup: isGroup && state.selectedGroup?._id === chatId ? null : state.selectedGroup,
        };
      });
      toast.success("Chat archived");
    } catch (error) {
      console.log(error.response?.data?.message || "Error archiving chat");
    }
  },

    initiateCall: async ({type, targetId, isGroup, roomId}) => {
          const { messages,sendMessage, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
   // console.log({ggjh:"ertyuio[plkjhghfghjklmntyui",  text, attachments, groupId, receiverId, replyTo, isForwarded, roomId, ForwardUser })
    const { authUser } = useAuthStore.getState();
    toast.success(type)
    const socket = useAuthStore.getState().socket;
    const chatId = targetId;
   // const isGroup = !!groupId;
     roomId = roomId || (isGroup ? targetId : (selectedUser?.roomId || chats.find((c) => c._id === targetId)?.roomId));
    if (!chatId || !roomId) return console.log("Invalid chat or room");
    let isArchived = await get().checkIsChatArchived(chatId, isGroup);
    if (isArchived) {
      await axiosInstance.post(`/messages/archive-chat/${chatId}`, { unarchive: true });
      isArchived = false;
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage = {
      _id: tempId,
      text: `Incoming ${type} call in progress`,
      senderId: authUser,
      receiverId: isGroup ? null : chatId,
      groupId: isGroup ? chatId : null,
      roomId,
      attachments: [{
        attachmentType: "call",
        attachmentUrl: isGroup ? selectedGroup.profilePic : selectedUser._id,
        attachmentExt: type,
        size: '',
        originalName: isGroup ? selectedGroup.name : selectedUser.fullName,
        mimeType: 'Ringing',
        preview:  null,
        duration:  0,
      }],
      createdAt: new Date(),
      readBy: isGroup ? [] : [{ userId: authUser._id, readAt: new Date() }],
      pendingFor: isGroup ? groupChats.find(g => g._id === groupId)?.members.map(m => m._id.toString()).filter(id => id !== authUser._id.toString()) || [] : [chatId],
      isEdited: false,
      reactions: [],
      isPinned: false,
      isStarred: false,
      replyTo:  null,
      visibleTo: [],
    };
      if ((selectedGroup && chatId === selectedGroup._id) || (selectedUser && chatId === selectedUser._id)) {
     // set({ messages: [...messages, tempMessage] });
     

    }

   try {
     const res = await axiosInstance.post('/calls/initiate', { type, targetId, isGroup, roomId });
      const participants = isGroup ? selectedGroup.members.map(m => m._id) : [targetId, authUser._id] ;

        set({
          activeCall: res.data,
          isInCall: true,
          isRinging: false,
          callMessage: "You started a call"
        });


           try {
     await sendMessage({
           text: `Incoming ${type} call in progress`,
          attachments: [{
            type: 'call',
             data: authUser.profilePic,
             name: authUser.fullName,
        ext: res.data._id.toString(),
        size:'',
        mimeType: 'Ringing',
        preview:  type,
        duration:  0,
      }],
        receiverId: isGroup ? null : chatId,
        groupId: isGroup ? chatId : null,
          isForwarded: "true",
          replyTo:null,
          roomId,
          ForwardUser: authUser
        });

   } catch (error) {
    console.error(error)
    return
   }

        socket.emit("initiateCall", {
          callId: res.data._id,
         participants,
          roomId,
          groupId: isGroup ? targetId : null,
          type: type,
          status: "ringing",
          caller: {
            _id: authUser._id,
            fullName: authUser.fullName,
            profilePic: authUser.profilePic || "/avatar.png",
            color: authUser.color,
            about: authUser.about || "hey they lets chat"

          },
        });
       // navigate('/call');
       return res.data;
      } catch (err) {
        toast.error("Failed to start call");
      }
    },
   acceptCall: async (callId, roomId) => {
    try {
      const { authUser } = useAuthStore.getState();
      await axiosInstance.post(`/calls/accept/${callId}/${roomId}`);
      set({ isInCall: true, isRinging: false, incomingCall: null, callMessage: "You joined the call" });
      navigate('/call');
    } catch (err) {
      toast.error("Failed to accept");
    }
  },

  rejectCall: async (callId, roomId) => {
    try {
      const { authUser, socket } = useAuthStore.getState();
           const { messages, sendMessage, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
const isGroup = !!selectedGroup
const chatId = isGroup ? selectedGroup._id : selectedUser._id
           try {
             const res =  await axiosInstance.post(`/calls/reject/${callId}/${roomId}`);
            if (isGroup) {
               get().getIncomingCallHistory(chatId, 'rejected')
               await  get().getMessagesByGroupId(chatId)
          } else {
             get().getIncomingCallHistory(chatId, 'rejected')
             await get().getMessagesByUserId(chatId)
            }  
            set({ isRinging: false, incomingCall: null, activeCall: res.data , callMessage: "Call rejected" });
          socket.emit("callRejected", {callId, roomId, userId: authUser._id, call: res.data});
         
              } catch (error) {
              console.error(error)
              return
           }
    
    //  const res = !!selectedGroup ? await axiosInstance.get(`/messages/group/${selectedGroup._id}`) : await axiosInstance.get(`/messages/user/${selectedUser._id}`);
    //   set({
    //     {}Ymessages: res.data
    //       .filter(msg => msg.visibleTo.length === 0 || msg.visibleTo.some(id => id.toString() === useAuthStore.getState().authUser._id.toString()))
    //       .map(msg => ({ ...msg, roomId }))
    //   });

    } catch (err) {
      toast.error("Failed to reject");
      console.error(err)
      return;
    }
  },
  exit: async () => {
          const { authUser, socket } = useAuthStore.getState();
           const { messages, sendMessage, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
const isGroup = !!selectedGroup
const chatId = isGroup ? selectedGroup._id : selectedUser._id
        
    await get().getIncomingCallHistory(chatId, 'rejected')
            if (isGroup) {
          await  get().getMessagesByGroupId(chatId)
          } else {
           await get().getMessagesByUserId(chatId)
            } 
      set({ isRinging: false, incomingCall: null, activeCall: null  });
         
  },
  getIncomingCallHistory:  async (callId, type) => {
    try {
      const { authUser , socket} = useAuthStore.getState();
           const { messages, sendMessage, chats, groupChats, archivedChats, selectedUser, selectedGroup } = get();
    const isGroup = !!selectedGroup
   const chatId = isGroup ? selectedGroup._id || callId : selectedUser._id || callId
    //  set({ isRinging: false, incomingCall: null, activeCall:null, callMessage: "Call rejected" });
    const res =  await axiosInstance.get(`/calls/ongoing/history/${chatId}/${isGroup}/${type}`);
//{}Y{}yconsole.log(res.data)
if(type === 'ringing'){
socket.emit("initiateCall", {
          callId: res.data.data._id,
         participants: res.data.data.participants,
          roomId: isGroup ? selectedGroup._id : selectedUser.roomId,
          groupId: isGroup ? chatId : null,
          type: res.data.data.type,
          status: "ringing",
          caller: {
            _id: res.data.caller._id,
            fullName: res.data.caller.fullName,
            profilePic: res.data.caller.profilePic || "/avatar.png",
            color: res.data.caller.color,
            about: res.data.caller.about || "hey they lets chat"

          },
        });
      }
  } catch (err) {
      toast.error("Failed to reject");
      console.error(err)
      return;
    }
  },
    toggleMute: () => {
      toast.success("hjgy")
      try {
         const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = isMuted);
      set({ isMuted: !isMuted, callMessage: isMuted ? "Unmuted" : "Muted" });
    }
      } catch (error) {
        console.error(error)
      }

  },

  // SOLVES: TOGGLE VIDEO (ONE-SIDED)
  toggleVideo: () => {
    toast.success("ytftrdxdtffjf")
    const { localStream, isVideoOn } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOn);
      set({ isVideoOn: !isVideoOn, callMessage: isVideoOn ? "Camera off" : "Camera on" });
    }
  },
}));