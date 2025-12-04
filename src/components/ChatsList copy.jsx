import { useEffect, useMemo, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { IoMdArchive, IoMdTrash } from "react-icons/io";
import { FaImage, FaVideo, FaFileAudio, FaFile } from "react-icons/fa";
import toast from "react-hot-toast";

function ChatsList() {
  const {
    getMyChatPartners,
    chats,
    getFilteredChats,
    filteredChats,
    isUsersLoading,
    setSelectedUser,
    archiveChat,
    selectedUser,
    setSelectedGroup,
    deleteFriend,
    blockUser,
    searchQuery,
    selectedGroup,
    setSidebarContent,
    archivedChats,
    groupChats,
  } = useChatStore();
  const { onlineUsers, authUser, socket } = useAuthStore(); // SOLUTION: Added socket for join on click
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (searchQuery) {
      getFilteredChats(searchQuery);
    } else {
      getMyChatPartners();
    }
  }, [searchQuery, getMyChatPartners, getFilteredChats]);

  const chatList = useMemo(() => (searchQuery ? filteredChats : [...chats, ...groupChats, ...archivedChats]), [
    searchQuery,
    chats,
    groupChats,
    archivedChats,
    filteredChats,
  ]);

  const truncatePar = (word, maxword) => {
    if (!word) return "";
    return word.length <= maxword ? word : word.slice(0, maxword) + "...";
  };

  const getDisplay = (message) => {
    if (!message) return null;
    if (message.reactions && message.reactions.length > 0) {
      const isSender = message.senderId === authUser._id.toString();
      const isAttachment = !!message.attachmentType;
      const messageType = isAttachment ? message.attachmentType : "message";
      const content = isAttachment ? message.originalName : message.text;
      const reactors = message.reactions;
      const isReactor = reactors.some((r) => r.userId === authUser._id.toString());
      if (reactors.length === 1) {
        const reactor = reactors[0];
        const reactorName = reactor.userId === authUser._id.toString() ? "You" : reactor.name || "This Contact";
        const emojiPart = ` with ${reactor.emoji}`;
        if (isSender) {
          return `${reactorName} reacted${emojiPart} to your ${messageType}`;
        } else if (isReactor) {
          return `You reacted${emojiPart} to your ${messageType}`;
        } else {
          return `${reactorName} reacted${emojiPart} to the ${messageType}`;
        }
      } else {
        const base = isReactor ? "You both" : "Some members";
        const target = isSender ? `your ${messageType}` : `the ${messageType}: ${truncatePar(content, 10)}`;
        return `${base} reacted to ${target}`;
      }
    } else {
      const prefix = message.isEdited ? "Edited: " : "";
      if (message.text && message.text.trim() !== "") {
        return prefix + truncatePar(message.text, 22);
      }
      if (message.originalName) {
        const name = truncatePar(message.originalName, 22);
        switch (message.attachmentType) {
          case "image":
            return (
              <>
                {prefix}
                <FaImage className="inline-block mr-1" /> {name}
              </>
            );
          case "video":
            return (
              <>
                {prefix}
                <FaVideo className="inline-block mr-1" /> {name}
              </>
            );
          case "audio":
            return (
              <>
                {prefix}
                <FaFileAudio className="inline-block mr-1" /> {name}
              </>
            );
          case "document":
            return (
              <>
                {prefix}
                <FaFile className="inline-block mr-1" /> {name}
              </>
            );
          default:
            return prefix + name;
        }
      }
      return null;
    }
  };

  const handleChatClick = (chat) => {
    if (chat.name) {
      if (socket && chat.roomId) {
        // SOLUTION: On clicking a group chat, join the room if not already. This fixes group deviations for real-time updates and opening containers.
        socket.emit("join_groups", [chat.roomId]);
      }
      setSelectedGroup({ ...chat, roomId: chat.roomId || chat._id });
      setSelectedUser(null);
    } else {
      if (socket && chat.roomId) {
        // SOLUTION: On clicking a private chat, join the private room. This ensures real-time message receipt and fixes inability to open chat container by syncing state properly.
        socket.emit("join_private_rooms", [chat.roomId]);
      }
      setSelectedUser({ ...chat, roomId: chat.roomId || chat._id });
      setSelectedGroup(null);
    }
    setActive(null);
  };

  const handleArchive = async (chatId, isGroup) => {
    try {
      await archiveChat(chatId);
      toast.success(isGroup ? "Group archived" : "Chat archived");
    } catch (error) {
      toast.error("Failed to archive chat");
    }
  };

  const handleDeleteOrBlock = async (chatId, action) => {
    try {
      if (action === "delete") {
        await deleteFriend(chatId);
        toast.success("Friend deleted");
      } else if (action === "block") {
        await blockUser(chatId);
        toast.success("User blocked");
      }
      setActive(null);
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  if (isUsersLoading && chatList.length === 0) return <UsersLoadingSkeleton />;
  if (!isUsersLoading &&chatList.length === 0) return <NoChatsFound />;

  return (
    <div className="overflow-y-auto">
      {chatList.map((chat) => (
        <div
          key={chat._id}
          onClick={() => handleChatClick(chat)}
          onContextMenu={(e) => {
            e.preventDefault();
            setActive(chat._id);
          }}
          className={`${
            (selectedUser && chat._id === selectedUser._id) || (selectedGroup && chat._id === selectedGroup._id)
              ? "bg-cyan-600/30"
              : "bg-slate-900"
          } px-2 py-4 mb-2 rounded-lg overflow-hidden cursor-pointer hover:bg-cyan-500/20 transition-colors relative`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={chat.profilePic || "/avatar.png"}
                alt=""
                className="w-9 h-9 rounded-full object-cover"
              />
              {!chat.name && onlineUsers.includes(chat._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 style={{color: chat.color}} className="text-sm font-semibold capitalize text-slate-200">{truncatePar(chat.name || chat.fullName, 15)}</h3>
                {chat.recentMessage && (
                  <span className="text-xs text-slate-400">
                    {new Date(chat.recentMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">{getDisplay(chat.recentMessage)}</p>
                {chat.unreadCount > 0 && (
                  <span className="bg-cyan-600 text-white text-xs rounded-full px-2 py-1">{chat.unreadCount}</span>
                )}
              </div>
            </div>
          </div>
          {active === chat._id && !chat.name && (
            <div className="absolute right-2 top-2 flex flex-col bg-slate-800 rounded-lg shadow-lg">
              <button
                onClick={() => handleArchive(chat._id, !!chat.name)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                <IoMdArchive /> Archive
              </button>
              <button
                onClick={() => handleDeleteOrBlock(chat._id, "delete")}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
              >
                <IoMdTrash /> Delete Friend
              </button>
              <button
                onClick={() => handleDeleteOrBlock(chat._id, "block")}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
              >
                <IoMdTrash /> Block
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChatsList;