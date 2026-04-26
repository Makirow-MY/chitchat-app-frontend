// Frontend: components/ChatHeader.js
// Optimized, cleaned, well-commented, and organized version
// Preserves all original functionality, styling, theme, and presentation
// Improvements: Removed unused imports, redundant code, improved readability, added clear comments, extracted logic where helpful

import { ChevronDown, ChevronUp, PhoneIcon, SearchIcon, VideoIcon } from "lucide-react";
import { FiMoreVertical, FiSearch } from "react-icons/fi";
import { IoMdArchive } from "react-icons/io";
import { MdClearAll, MdDeleteSweep } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";

const ChatHeader = ({
  dropdownOpen,
  setDropdownOpen,
  handleReportChat,
  searchQuery,
  onSearchChange,
  handleNextMatch,
  handlePrevMatch,
  resultsCount,
  currentMatchIndex,
}) => {
  // --- Store selections ---
  const {
    selectedUser,
    selectedGroup,
    onlineUsers,
    archivedChats,
    archiveChat,
    unarchiveChat,
    deleteChat,
    setSelectedUser,
    setSelectedGroup,
    setAttached,
    setShowEmojiPicker,
  } = useChatStore();

  const { authUser, theme, showmedia, setShowMedia } = useAuthStore();
  const { initiateCall } = useCallStore();

  // --- Local state ---
  const [showSearch, setShowSearch] = useState(false);

// --- Utility: Format last seen date exactly like WhatsApp ---
// WhatsApp displays:
// - "today at HH:MM AM/PM" for same day
// - "yesterday at HH:MM AM/PM" for previous day
// - Full date (e.g., "12/28/2023") for older dates
// Time is in 12-hour format with AM/PM, using device's locale and timezone
// No "X hours ago" or weekday with ordinal – simplified to match WhatsApp precisely

const formatFullDate = (date) => {
  const d = new Date(date);
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const isYesterday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() - 1;

  const timeString = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `today at ${timeString}`;
  } else if (isYesterday) {
    return `yesterday at ${timeString}`;
  } else {
    // Full date in MM/DD/YYYY format (common in en-US; adjust locale if needed)
    return d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  }
};

  // --- Determine online status ---
  let isOnline = false;
  let onlineMembersData = [];

  if (selectedUser) {
    isOnline = onlineUsers?.includes(selectedUser._id);
  } else if (selectedGroup) {
    const memberIds = selectedGroup.members?.map((m) => m._id) || [];
    const onlineIds = memberIds?.filter((id) => onlineUsers?.includes(id));
    onlineMembersData = selectedGroup.members?.filter((m) => onlineIds.includes(m._id)) || [];
    isOnline = onlineMembersData.length > 0;
  }

  // --- Check if current chat is archived ---
  const isArchived = archivedChats.some(
    (chat) => chat._id === (selectedUser?._id || selectedGroup?._id)
  );

  // --- Global Escape key handler: closes chat & dropdown ---
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
        setSelectedGroup(null);
        setDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setSelectedUser, setSelectedGroup, setDropdownOpen]);

  // --- Archive / Unarchive chat ---
  const handleArchiveAction = async () => {
    const entityId = selectedUser?._id || selectedGroup?._id;
    if (!entityId) return;

    try {
      if (isArchived) {
        await unarchiveChat(entityId);
        toast.success("Chat unarchived");
      } else {
        await archiveChat(entityId);
        toast.success("Chat archived");
      }
      setDropdownOpen(false);
    } catch (err) {
      toast.error(`Failed to ${isArchived ? "unarchive" : "archive"} chat`);
    }
  };

  // --- Permanently delete chat ---
  const handleDeleteChat = async () => {
    const entityId = selectedUser?._id || selectedGroup?._id;
    if (!entityId) return;

    try {
      await deleteChat(entityId);
      toast.success("Chat deleted");
      setDropdownOpen(false);
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  // --- Initiate voice or video call ---
  const startCall = (type) => {
    const targetId = selectedUser?._id || selectedGroup?._id;
    const isGroup = !!selectedGroup;
    const roomId = isGroup ? selectedGroup._id : selectedUser?.roomId;

    initiateCall({ type, targetId, isGroup, roomId });
  };

  const handleVoiceCall = () => startCall("voice");
  const handleVideoCall = () => startCall("video");

  // --- Toggle search bar & reset query ---
  const toggleSearch = () => {
    setShowSearch((prev) => !prev);
    if (!showSearch) onSearchChange("");
  };

  // --- Helper: Check if current user is a group member ---
  const isGroupMember = selectedGroup?.members?.some((m) => m._id === authUser?._id);

  return (
    <div
      onClick={() => {
        setShowEmojiPicker(false);
        setAttached(false);
      }}
      className={`flex justify-between z-[100000] items-center bg-[var(--bg-secondary)] border-b border-[var(--border)] max-h-[84px] px-4 sm:px-6 py-4 flex-shrink-0 ${
        theme === "light" ? "bg-blue-100" : "bg-[var(--bg-secondary)]"
      }`}
    >
      {/* User or Group Info Section */}
      {selectedUser || selectedGroup ? (
        <>
          <div className="flex items-center gap-2">
            {/* Back button (mobile only) */}
            <button
              onClick={() =>
               {
                 selectedUser
                  ? setSelectedUser({ ...selectedUser, roomId: null })
                  : setSelectedGroup({ ...selectedGroup, roomId: null })

              }
              }
              className="p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] block md:hidden"
            >
              <FaArrowLeft size={18} />
            </button>

            {/* Avatar & Details */}
            <div
              onClick={() => setShowMedia(!showmedia)}
              className={`flex items-center space-x-3 ${
                selectedGroup && isGroupMember ? "cursor-pointer" : ""
              }`}
            >
              <div className={`avatar ${isOnline ? "online" : ""}`}>
                <div className="w-10 sm:w-12 rounded-full">
                  <img
                    src={(selectedUser || selectedGroup).profilePic || "/avatar.png"}
                    alt={(selectedUser || selectedGroup).fullName || selectedGroup?.name}
                  />
                </div>
              </div>

              <div>
                {/* Name */}
                <h3
                  style={{ color: (selectedUser || selectedGroup).color }}
                  className="text-[var(--text-primary)] font-medium capitalize text-sm sm:text-base"
                >
                  {selectedUser?.fullName || selectedGroup?.name}
                </h3>

                {/* Status / Member info */}
                {selectedUser ? (
                  <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
                    {selectedUser.onlineStatus === "online"
                      ? "online"
                      : formatFullDate(selectedUser.lastSeen)}
                  </p>
                ) : (
                  <p className="text-[var(--text-secondary)] text-xs sm:text-sm">
                    {isGroupMember ? (
                      <>
                        {selectedGroup.members.length - selectedGroup.restrictions.length} Members
                        {onlineMembersData.length > 0 && ` (${onlineMembersData.length} Online)`}
                      </>
                    ) : (
                      <span className="text-red-400">Non members can't view group content</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar (when active) */}
          {showSearch && (
            <div className="flex items-center gap-2">
              <div
                className={`relative w-full p-2 gap-2 flex items-center rounded-[10px] ${
                  theme === "light" ? "bg-slate-100" : "bg-[var(--bg-main)]"
                }`}
              >
                <FiSearch className="text-[var(--text-secondary)]" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full outline-none bg-transparent text-[var(--text-primary)]"
                  placeholder="Search message"
                />
              </div>

              {/* Navigation through results */}
              {resultsCount > 0 && (
                <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <button onClick={handlePrevMatch} disabled={currentMatchIndex === 0}>
                    <ChevronUp className="size-5" />
                  </button>
                  <span>
                    {currentMatchIndex + 1}/{resultsCount}
                  </span>
                  <button onClick={handleNextMatch} disabled={currentMatchIndex === resultsCount - 1}>
                    <ChevronDown className="size-5" />
                  </button>
                </div>
              )}

              {resultsCount === 0 && searchQuery && (
                <span className="text-[var(--text-secondary)]">No results</span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="relative flex items-center space-x-2">
            {/* Search toggle */}
            <button
              onClick={toggleSearch}
              className="p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <SearchIcon className="size-5" />
            </button>

            {/* Voice & Video Call buttons (desktop only) */}
            {selectedUser && (
              <>
                <button
                  onClick={handleVoiceCall}
                  className="hidden md:block p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <PhoneIcon className="size-5" />
                </button>
                <button
                  onClick={handleVideoCall}
                  className="hidden md:block p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <VideoIcon className="size-5" />
                </button>
              </>
            )}

            {/* Group call buttons (only if user is a member) */}
            {selectedGroup && isGroupMember && (
              <>
                <button
                  onClick={handleVoiceCall}
                  className="p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <PhoneIcon className="size-5" />
                </button>
                <button
                  onClick={handleVideoCall}
                  className="p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <VideoIcon className="size-5" />
                </button>
              </>
            )}

            {/* More options dropdown */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <FiMoreVertical className="size-5" />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-8 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg z-[10000]">
                <button
                  onClick={handleArchiveAction}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
                >
                  <IoMdArchive size={16} />
                  {isArchived ? "Unarchive Chat" : "Archive Chat"}
                </button>

                {/* Report option - shown conditionally based on original logic */}
                {selectedUser && handleReportChat && (
                  <button
                    onClick={handleReportChat}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
                  >
                    <MdClearAll size={16} /> Report Chat
                  </button>
                )}

                {selectedGroup && (
                  <button
                    onClick={handleReportChat}
                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
                  >
                    <MdClearAll size={16} /> Report Chat
                  </button>
                )}

                <button
                  onClick={handleDeleteChat}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700"
                >
                  <MdDeleteSweep size={16} /> Clear Chat
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ChatHeader;