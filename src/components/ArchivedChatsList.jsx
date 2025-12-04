// ArchivedChatsList.jsx
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { IoMdRemove, IoMdTrash } from "react-icons/io";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { NoArchiveFound } from "./NoChatsFound";
import { FaImage, FaVideo, FaFileAudio, FaFile } from "react-icons/fa";

function ArchivedChatsList() {
  const {
    archivedChats,
    isUsersLoading,
    getArchivedChats,
    searchQuery,
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    setSidebarContent,
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [active, setActive] = useState(false);

  useEffect(() => {
    getArchivedChats();
  }, [getArchivedChats]);

  const truncatePar = (word, maxword) => {
    if (!word) return "";
    return word.length <= maxword ? word : word.slice(0, maxword) + "...";
  };

  const getDisplay = (message) => {
    if (message.reactions && message.reactions.length > 0) {
      const isSender = message.senderId === authUser._id.toString();
      const isAttachment = !!message.attachmentType;
      const messageType = isAttachment ? message.attachmentType : 'message';
      const content = isAttachment ? message.originalName : message.text;
      const reactors = message.reactions;
      const isReactor = reactors.some(r => r.userId === authUser._id.toString());
      if (reactors.length === 1) {
        const reactor = reactors[0];
        const reactorName = reactor.userId === authUser._id.toString() ? 'You' : reactor.name || 'User';
        const emojiPart = ` with ${reactor.emoji}`;
        if (isSender) {
          return `${reactorName} reacted${emojiPart} to your ${messageType}`;
        } else if (isReactor) {
          return `You reacted${emojiPart} to the ${messageType}`;
        } else {
          return `${reactorName} reacted${emojiPart} to the ${messageType}`;
        }
      } else {
        const base = isReactor ? 'You and some members' : 'Some members';
        const target = isSender ? `your ${messageType}` : `the ${messageType}: ${truncatePar(content, 10)}`;
        return `${base} reacted to ${target}`;
      }
    } else {
      const prefix = message.isEdited ? 'Edited: ' : '';
      if (message.text && message.text.trim() !== "") {
        return prefix + truncatePar(message.text, 22);
      }
      if (message.originalName) {
        const name = truncatePar(message.originalName, 22);
        switch (message.attachmentType) {
          case "image": return prefix + (<> {name}</>);
          case "video": return prefix + (<> {name}</>);
          case "audio": return prefix + (<> {name}</>);
          case "document": return prefix + (<> {name}</>);
          default: return prefix + name;
        }
      }
      return null;
    }
  };

  const list = searchQuery
    ? archivedChats.filter((chat) => chat && (
        (chat.name && chat.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chat.fullName && chat.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
      ))
    : archivedChats;

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (list.length === 0) return <NoArchiveFound />;

  return (
    <>
      {list.map((chat) => (
        <div
          key={chat._id}
          onClick={() => {
            setActive(false);
            if (chat.name) {
              setSelectedUser(null);
              setSelectedGroup({ _id: chat._id, name: chat.name, profilePic: chat.profilePic, admin: chat.admin, members: chat.members });
            } else {
              setSelectedGroup(null);
              setSelectedUser({ _id: chat._id, fullName: chat.fullName, profilePic: chat.profilePic });
            }
          }}
          onDoubleClick={() => setActive(true)}
          className={`${ 
            (selectedUser && chat._id === selectedUser._id) || (selectedGroup && chat._id === selectedGroup._id) ? "bg-cyan-600/30" : "bg-slate-900/50" 
          } px-2 py-4 rounded-lg overflow-hidden cursor-pointer hover:bg-cyan-500/20 transition-colors relative`}
        >
          {!chat.name && onlineUsers.includes(chat._id) && (
            <div className="absolute top-2 right-2 h-3 w-3 bg-green-500 rounded-full border-2 border-[var(--border)]"></div>
          )}
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName || chat.name} />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{truncatePar(chat.fullName ? chat.fullName : chat.name, 15)}</p>
              <div className="flex justify-between items-center">
                <p className="text-xs text-[var(--text-secondary)]">
                  {chat.recentMessage && getDisplay(chat.recentMessage)}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {chat.recentMessage && new Date(chat.recentMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
            {chat.unreadCount > 0 && (
              <div className="absolute bottom-2 right-2 bg-cyan-600 text-white text-xs rounded-full px-2 py-1">
                {chat.unreadCount}
              </div>
            )}
          </div>
          {((selectedUser && chat._id === selectedUser._id) || (selectedGroup && chat._id === selectedGroup._id)) ? (
            active && (
              <div className="absolute bottom-0 right-0 flex flex-col bg-[var(--bg-secondary)] rounded-tl-lg p-2 z-20">
                <button
                  onClick={async () => {
                    try {
                      await unarchiveChat(chat._id);
                      toast.success("Chat unarchived");
                      setSidebarContent("chats");
                    } catch (error) {
                      toast.error("Failed to unarchive chat");
                    }
                  }}
                  title="Unarchive Chat"
                >
                  <IoMdRemove size={20} />
                </button>
                <button
                  onClick={async () => {
                    try {
                      await deleteChat(chat._id);
                      toast.success("Chat deleted");
                    } catch (error) {
                      toast.error("Failed to delete chat");
                    }
                  }}
                  title="Delete Chat"
                >
                  <IoMdTrash size={20} />
                </button>
              </div>
            )
          ) : null}
        </div>
      ))}
    </>
  );
}

export default ArchivedChatsList;