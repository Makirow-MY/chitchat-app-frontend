import { useEffect, useMemo, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { IoMdArchive, IoMdTrash } from "react-icons/io";
import { FaImage, FaVideo, FaFileAudio, FaFile, FaPinterest, FaUser } from "react-icons/fa";
import toast from "react-hot-toast";
import { IoArchiveOutline, IoPinSharp, IoTrash } from "react-icons/io5";
import { FiMapPin, FiPlusSquare } from "react-icons/fi";
import { BanIcon, Blocks, PhoneCall, PhoneMissed, PhoneOff, PinIcon, Video, VideoOff } from "lucide-react";

function ChatsList() {
  const {
    getMyChatPartners,
    chats,
    getFilteredChats,
    setSearchResults,
    searchResults,
    isUsersLoading,
    setSelectedUser,
    archiveChat,
    selectedUser,
    setSelectedGroup,
    deleteFriend,
    blockUser,
    searchQuery,
    deleteChat,
    selectedGroup,
    setSidebarContent,
    messages,
    archivedChats,
    groupChats,
    getGroupChats,
    getMessagesByGroupId,
    getMessagesByUserId,
    setTargetHighlightMsgId,
  } = useChatStore();
  const { onlineUsers, theme, authUser, socket } = useAuthStore();
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (searchQuery) {
      getFilteredChats(searchQuery);
    } else {
      getMyChatPartners();
      getGroupChats();
      setSearchResults([]);
    }
  }, [searchQuery,messages, getFilteredChats, setSearchResults, getGroupChats, getMyChatPartners]);

  const chatList = useMemo(() => {
    let list = searchQuery ? searchResults : [...chats, ...groupChats, ...archivedChats];
    list.sort((a, b) => new Date(b.recentMessage?.createdAt || 0) - new Date(a.recentMessage?.createdAt || 0));
    return list;
  }, [searchQuery, chats, groupChats, archivedChats, searchResults]);

  const truncatePar = (word, maxword) => {
    if (!word) return "";
    return word && word.length <= maxword ? word : word.slice(0, maxword) + "...";
  };

  const highlightQuery = (text) => {
    if (!searchQuery || !text) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
    return parts.map((part, i) => (
      <span key={i} className={part.toLowerCase() === searchQuery.toLowerCase() ? " font-bold text-[var(--text-primary)] space-x-1 mx-1" : " "}>
        {part}
      </span>
    ));
  };

  const getDisplay = (message, chat) => {
    if (!message) return null;
    if (message.isSystem) {
      return truncatePar(message.text, 25);
    }
    else if (!chat.name && chat.fullName && message.reactions && message.reactions.length > 0) {
      const isSender = message.senderId === authUser._id.toString();
      const isAttachment = !!message.attachmentType;
      const messageType = isAttachment ? message.attachmentType : "message";
      const content = isAttachment ? message.originalName : message.text;
      const reactors = message.reactions;
      const isReactor = reactors.some((r) => r.userId === authUser._id.toString());
      if (reactors.length === 1) {
        const reactor = reactors[0];
        const reactorName = reactor.userId === authUser._id.toString() ? "You" : reactor.fullName || "This Contact";
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
    } else if (chat.name && !chat.fullName && message.reactions && message.reactions.length > 0) {
      const isSender = message.senderId === authUser._id.toString();
      const isAttachment = !!message.attachmentType;
      const messageType = isAttachment ? message.attachmentType : 'message';
      const content = isAttachment ? message.originalName : message.text;
      const reactors = message.reactions;
      const isReactor = reactors.some(r => r.userId === authUser._id.toString());
      if (reactors.length === 1) {
        const reactor = reactors[0];
        const reactorName = reactor.userId === authUser._id.toString() ? 'You' : chat.members?.find((mem) => mem._id === reactor.userId)?.fullName?.split(" ")[0]?.replace(chat.members?.find((mem) => mem._id === reactor.userId)?.fullName?.split("")[0], chat.members?.find((mem) => mem._id === reactor.userId)?.fullName?.split("")[0].toUpperCase()) || 'User';
        const emojiPart = ` with ${reactor.emoji}`;
        if (isSender) {
          return truncatePar(`${reactorName} reacted ${emojiPart} to "${content}" `, 30);
        } else if (isReactor) {
          return truncatePar(`You reacted ${emojiPart} to "${content}"`, 30);
        } else {
          return truncatePar(`${reactorName} reacted ${emojiPart} to "${content}"`, 30);
        }
      } else {
        const base = isReactor ? 'You & some members' : 'Some members';
        const target = isSender ? `your "${content}"` : `the ${messageType}: ${truncatePar(`"${content}"`, 10)}`;
        return truncatePar(`${base} reacted to ${target}`, 27);
      }
    } else {
      let prefix = "You";
      prefix = message?.deletedBy?.includes(authUser._id) ? <BanIcon size={13}/> : message.isForwarded && message.attachmentType !== "share" && message.attachmentType !== "call" ? "Forwarded: " : message.isEdited ? "Edited: " : ((message.senderId === authUser._id || message.senderId?._id === authUser._id) && (chat._id !== authUser._id)) ? "You: " : (chat.name ? `${chat.members?.find((mem) => (mem._id === message.senderId || mem._id === message.senderId?._id))?.fullName?.split(" ")[0]?.replace(chat.members?.find((mem) => mem._id === message.senderId)?.fullName?.split("")[0], chat.members?.find((mem) => mem._id === message.senderId)?.fullName?.split("")[0].toUpperCase())}: ` : "user: ");
      if (message.text && message.text.trim() !== "" && message.attachmentType !== 'call') {
        return <>{prefix === "undefined:" ? "You: " : prefix || "You: "}{highlightQuery(truncatePar(message.text, 15))}</>;
      }
      if (message.originalName) {
        const name = truncatePar(message.originalName, 22);
        switch (message.attachmentType) {
          case "image":
            return (
              <div className="flex items-center gap-1 ">
                {prefix}
                <FaImage className="inline-block mr-1" /> {highlightQuery(name)}
              </div>
            );
          case "video":
            return (
              <div className="flex items-center gap-1 ">
                {prefix}
                <FaVideo className="inline-block mr-1" /> {highlightQuery(name)}
              </div>
            );
             case "share":
            return (
              <div className="flex items-center gap-1 capitalize">
                {prefix}
                
                <FaUser className="inline-block mr-1" /> {highlightQuery(name)}
              </div>
            );
             case "call":
            return (
              <div className="flex  items-center gap-1 capitalize">
                  {
                   message.text === "Missed voice call" && <PhoneMissed size={18} className="inline-block mr-1"/>
               }
               {
                   message.text === "Missed video call" && <VideoOff size={18} className="inline-block mr-1"/>
               }
               {
                 message.text === "Declined voice call" && <PhoneOff size={18} className="inline-block mr-1 text-red-200" />
               }
               {
                 message.text === "Declined video call" && <VideoOff size={18} className="inline-block mr-1 text-red-200" />
               }
                
                 {highlightQuery(truncatePar(message.text, 22))}
              </div>
            );
          case "audio":
            return (
              <div className="flex items-center gap-1 ">
                {prefix}
                <FaFileAudio className="inline-block mr-1" /> {highlightQuery(name)}
              </div>
            );
          case "document":
            return (
              <div className="flex items-center gap-1 ">
                {prefix}
                <FaFile className="inline-block mr-1" /> {highlightQuery(name)}
              </div>
            );
          default:
            return prefix + highlightQuery(name);
        }
      }
      return null;
    }
  };

  useEffect(() => {
    socket.on("groupUpdated", (group) => {
      if (selectedGroup?._id === group.groupId) {
        setGroupName(group.name);
        setSelectedImg(group.profilePic);
        setSelectedGroup({ ...group, roomId: group._id });
        getMyChatPartners();
        getGroupChats();
        getUserGroups();
        toast.success("Group updated");
      }
    });

    return () => {
      socket.off("groupUpdated");
    };
  }, [socket]);

  const handleChatClick = (chat) => {
    if (searchQuery && chat.recentMessage) {
      setTargetHighlightMsgId(chat.recentMessage.text);
    }

    if (chat.name) {
      if (socket && chat.roomId) {
        socket.emit("join_groups", [chat.roomId]);
      }
      setSelectedGroup({ ...chat, roomId: chat.roomId || chat._id });
      setSelectedUser(null);
      localStorage.setItem('selectedGroup', JSON.stringify({ ...chat, roomId: chat.roomId || chat._id }));
      localStorage.setItem('selectedUser', null);
      getMessagesByGroupId(selectedGroup._id);
    } else {
      if (socket && chat?.roomId) {
        socket.emit("join_private_rooms", [chat.roomId]);
      }
      setSelectedUser({ ...chat, roomId: chat.roomId || chat._id });
      setSelectedGroup(null);
      localStorage.setItem('selectedUser', JSON.stringify({ ...chat, roomId: chat.roomId || chat._id }));
      localStorage.setItem('selectedGroup', null);
      getMessagesByUserId(selectedUser._id);
    }

    if (searchQuery && chat.recentMessage) {
      setTargetHighlightMsgId(chat.matchingMessage.id);
    }
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
        try {
          await deleteChat(chatId);
          toast.success("Chat deleted");
          setDropdownOpen(false);
        } catch (error) {
          toast.error("Failed to delete chat");
        }
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
  //if (chatList.length === 0) return ;

  return (
    <div onClick={() => setActive(null)} className="overflow-y-auto relative ">
     {
         chatList.length === 0 &&  <NoChatsFound />
     }
      {chatList.map((chat) => (
        <div
          key={chat?._id}
          onClick={() => handleChatClick(chat)}
          onContextMenu={(e) => {
            e.preventDefault();
            setActive(chat._id);
          }}
          className={`${
            (selectedUser && chat._id === selectedUser._id) || (selectedGroup && chat._id === selectedGroup._id)
              ? " bg-opacity-20 bg-[var(--color-primary-hover)] "
              : "bg-[var(--bg-main)]"
          } px-2 py-4 mb-2 rounded-lg overflow-hidden cursor-pointer hover:bg-[var(--color-primary)]/20 transition-colors`}
        >
          <div className={`flex items-center w-full gap-3 ${active === chat._id ? "pointer-events-none" : ""}`}>
            <div className="relative">
              <img
                src={chat.profilePic || "/avatar.png"}
                alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              {!chat.name && chat.onlineStatus === "online" && (
                <span className="absolute top-0 left-0 w-3 h-3 bg-[var(--color-primary-light)] rounded-full border-1 border-[var(--bg-main)]"></span>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex w-full items-center justify-between">
                <h3 style={{ color: chat.color }} className="text-sm font-semibold capitalize text-[var(--text-primary)] text-nowrap text-[0.8rem]">
                  {truncatePar(chat.name || chat.fullName, 15)}
                </h3>
                {chat.recentMessage && (
                  <span className="text-xs text-[0.65rem] text-nowrap text-[var(--text-secondary)]">
                    {new Date(chat.recentMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-primary)] flex items-center">{getDisplay(chat.recentMessage, chat)}</p>
                {chat.unreadCount > 0 && (
                  <span className="bg-[var(--color-primary)] text-[var(--text-primary)] text-xs rounded-full px-2 py-1">{chat.unreadCount}</span>
                )}
              </div>
            </div>
          </div>
          {active === chat._id && (
            <div 
            onMouseLeave={() => setActive(null)}
            className={`absolute right-2 top-2 flex flex-col bg-[var(--bg-card)] rounded-lg shadow-lg z-30 min-w-[10rem] p-2 border border-[var(--border)]`}>
              <button
                onClick={() => handleArchive(chat._id, !!chat.name)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--color-primary)]"
              >
                <IoArchiveOutline size={19} /> Archive
              </button>
              <button
                onClick={() => handleDeleteOrBlock(chat._id, "block")}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--color-primary)]"
              >
                <PinIcon size={19} /> Pin
              </button>
              <button
                onClick={() => handleDeleteOrBlock(chat._id, "delete")}
                className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--color-primary)]"
              >
                <IoTrash size={19} /> Delete
              </button>
            </div>
          )}
        </div>
      ))}
      <button
           // onClick={onClick}
            className="flex md:hidden justify-center items-center fixed bottom-9 right-6 btn btn-circle btn-primary btn-lg shadow-lg z-40  text-[var(--text-primary)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] "
          >
            <FiPlusSquare size={25} />
          </button>
    </div>
  );
}

export default ChatsList;