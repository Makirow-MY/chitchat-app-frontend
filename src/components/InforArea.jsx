import React, { useMemo, useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { PhoneIcon, VideoIcon, SearchIcon, FileIcon, ImageIcon, FilmIcon, MicIcon, SaveIcon, XIcon, DownloadIcon, ChevronLeft, UsersIcon, PlusIcon, AlertTriangleIcon, BanIcon, LogOutIcon, ChevronRight, UserPlus, Share, Share2Icon, StarIcon, DockIcon, User2Icon, Image, DeleteIcon, UserMinus } from "lucide-react";
import toast from "react-hot-toast";
import { IoPencilOutline } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";

function formatFullDate(date) {
  const d = new Date(date);
  const weekday = d.toLocaleString("en-US", { weekday: "long" });
  const month = d.toLocaleString("en-US", { month: "long" });
  const day = d.getDate();
  const getOrdinal = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  const ordinal = getOrdinal(day);
  return `${weekday} ${day}${ordinal} ${month} ${d.getFullYear()}`;
}

const InforArea = ({forwardModalOpen, setForwardModalOpen}) => {
  const [show, setShow] = useState("member")
  const {
    selectedUser,
   
    selectedGroup,
    messages,
    getUserGroups,
     getAllContacts,
     getGroupJoinRequests,
    groupChats,
    allContacts,
    setSelectedGroup,
    setSelectedUser,
    setSidebarContent,
    setSearchQuery,
    exitGroup,
    reportGroup,
    blockUser,
    unblockUser,
    allGroups,
    deleteFriend,
    reportChat,
    blockedUsers,
   removeUser,
    getGroupChats,
    savedMessages,
    fetchSavedMessages,
    declineGroupJoinRequest,
    queueAction,
    groupJoinRequests,
    report,
    acceptGroupJoinRequest,
  } = useChatStore();
  const { authUser, setShowMedia, updateProfile, socket, isOnline } = useAuthStore();
  const [showAllMedia, setShowAllMedia] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [groupName, setGroupName] = useState(selectedGroup?.name || "");
  const [searchQuery, setLocalSearchQuery] = useState("");
  const fileInputRef = useRef(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    fetchSavedMessages();
    getUserGroups();
    getAllContacts();
    getGroupChats()
     if (
      selectedGroup &&
      selectedGroup.admin &&
      selectedGroup.admin._id &&
      authUser &&
      authUser._id &&
      selectedGroup.admin._id === authUser._id
    ) {
      getGroupJoinRequests(selectedGroup._id);
    }
  }, [show, fetchSavedMessages,getGroupJoinRequests, selectedGroup, selectedUser, getGroupChats, getUserGroups, getAllContacts]);

  useEffect(() => {
    setGroupName(selectedGroup?.name || "");
    setSelectedImg(null);
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedUser && !selectedGroup && allContacts.length > 0) {
    const freshUser = allContacts.find(u => u._id === selectedUser._id);
    if (freshUser && freshUser._id) {
      // Preserve roomId if exists
      setSelectedUser({ ...freshUser, roomId: selectedUser.roomId || freshUser.roomId });
    }
  }
    if (socket) {
      socket.on("groupUpdated", (group) => {
        if (selectedGroup?._id === group.groupId) {
          setGroupName(group.name);
          setSelectedImg(group.profilePic);
         setSelectedGroup({ ...group, roomId: group._id });
        
          getGroupChats()
          getUserGroups()
          toast.success("Group updated");
        }
      });
      socket.on("groupTerminated", ({ groupId }) => {
        if (selectedGroup?._id === groupId) {
          toast.error("This group has been terminated");
          useChatStore.getState().updateGroupStatus(groupId, { terminated: true });
        }
      });
      socket.on("userRemoved", ({ groupId, userId }) => {
        if (selectedGroup?._id === groupId && userId === authUser._id) {
          toast.error("You have been removed from the group");
          setSelectedGroup(null);
          setShowMedia(false);
        }
      });
      socket.on("groupJoinRequest", ({ groupId, userId, userName , userProfilePic}) => {
        if (selectedGroup?._id === groupId && userId === authUser._id) {
          toast.error(`You have a group join request from ${userName } `);
         getGroupJoinRequests(groupId);
        }
       
      });
      socket.on("user_unblocked", ({userId, unblockedBy, roomId }) => {
        const authUser = useAuthStore.getState().authUser;
        if (unblockedBy === authUser._id) {
          // I unblocked: Local toast (store handles state)
          toast.success("User unblocked successfully");
        } else if (userId === authUser._id && selectedUser?._id === unblockedBy) {
          // I was unblocked, InforArea open: Update selectedUser
          toast.success("You have been unblocked by this user");
          useChatStore.getState().setSelectedUser({
            ...selectedUser,
            roomId,
            blockedUsers: (selectedUser.blockedUsers || []).filter((id) => id !== authUser._id),
          });
        }
        getAllContacts(); // Refresh for both
      });
       socket.on("user_blocked", ({userId, blockedBy, roomId }) => {
        const authUser = useAuthStore.getState().authUser;
        if (blockedBy === authUser._id) {
          // I blocked: Local toast
          toast.success("User blocked successfully");
        } else if (userId === authUser._id && selectedUser?._id === blockedBy) {
          // I am blocked, InforArea open: Update selectedUser
          toast.success("You have been blocked by this user");
          useChatStore.getState().setSelectedUser({
            ...selectedUser,
            roomId,
            blockedUsers: [...(selectedUser.blockedUsers || []), authUser._id],
          });
        }
        getAllContacts(); // Refresh for both
      });

      return () => {
        socket.off("user_blocked");
        socket.off("user_unblocked");
        socket.off("groupUpdated");
        socket.off("groupTerminated");
        socket.off("userRemoved");
        socket.off("groupJoinRequest");
      };
    }
  }, [socket, selectedGroup, authUser._id, setSelectedGroup, setShowMedia]);
  // Render nothing if not admin or no selected group
  // if (
  //   !selectedGroup ||
  //   !selectedGroup.admin ||
  //   !selectedGroup.admin._id ||
  //   !authUser ||
  //   !authUser._id ||
  //   selectedGroup.admin._id !== authUser._id
  // ) {
  //   return null;
  // }
 const attachments = messages
    .filter((msg) => msg.attachments && msg.attachments.length > 0)
    .flatMap((msg) =>
      msg.attachments.map((att) => ({
        ...att,
        createdAt: msg.createdAt,
        senderId: typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId,
      }))
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const recentAttachments = attachments.slice(0, 5);

  const UserSavedMessages = useMemo(
    () => savedMessages.filter(msg => msg.savedBy.includes(authUser._id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [savedMessages, authUser._id]
  );

  const filteredAttachments = activeTab === "saved"
    ? UserSavedMessages
    : attachments.filter((att) => {
        if (activeTab === "all") return true;
        if (activeTab === "documents") return att.attachmentType === "document";
        if (activeTab === "images") return att.attachmentType === "image";
        if (activeTab === "videos") return att.attachmentType === "video";
        if (activeTab === "audios") return att.attachmentType === "audio";
        return false;
      });

  const isGroup = !!selectedGroup;
  const profile = isGroup ? selectedGroup : selectedUser;
  const profileName = isGroup ? profile?.name : profile?.fullName || "Unknown";
  const profilePic = profile?.profilePic || profile?.groupPic || "/avatar.png";
  const about = isGroup ? `${profile?.members?.length - profile.restrictions?.length || 0} members` : profile?.about || "Come let's chat";
  const isGroupTerminated = isGroup && selectedGroup.terminated;

  const commonGroups = useMemo(() => {
    if (!isGroup) {
      return groupChats.filter(
        (group) =>
          group?.members?.some((m) => m._id.toString() === authUser._id.toString()) &&
          group?.members?.some((m) => m._id.toString() === selectedUser?._id.toString()) &&
          !group.terminated
      );
    }
    return [];
  }, [groupChats, isGroup, selectedUser, authUser._id]);

  const sortedMembers = useMemo(() => {
    if (isGroup) {
      return [...(profile.members || [])].sort((a, b) => {
        if (a._id.toString() === authUser._id.toString()) return -1;
        if (b._id.toString() === authUser._id.toString()) return 1;
        if (a._id.toString() === profile?.admin?._id.toString()) return -1;
        if (b._id.toString() === profile?.admin?._id.toString()) return 1;
        return 0;
      });
    }
    return [];
  }, [isGroup, profile?.members, profile?.admin, authUser._id]);

  const filteredMembers = searchQuery.toLowerCase().trim() ? sortedMembers.filter(
    (member) =>
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
      !selectedGroup.restrictions.find((m) => m.userId === member._id)?._id 
  ): sortedMembers.filter(
    (member) =>
      !selectedGroup.restrictions.find((m) => m.userId === member._id)?._id 
  ) ;
//  console.log(groupJoinRequests[0].userId, "groupJoinRequests")
const filteredgroupRequest =   groupJoinRequests
// groupJoinRequests.filter(
//     (member) =>
//       member.userId.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
//       !selectedGroup?.blockedMembers?.includes(member._id)
//   ) || groupJoinRequests;

  const filteredCommonGroups = commonGroups.filter(
    (group) => group.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleClose = () => {
    setShowMedia(false);
  };

  const handleGroupClick = (group) => {
    if (!group?._id || !group?.name || group.terminated) {
      toast.error("Cannot select invalid or terminated group");
      return;
    }
    console.log(group)
            if (socket && group._id) {
          // SOLUTION: On clicking a group chat, join the room if not already. This fixes group deviations for real-time updates and opening containers.
          socket.emit("join_groups", [group.roomId]);
        }
        setSelectedGroup(group);
          setSelectedUser(null);
      
        setSidebarContent("chats");
        handleClose();

    // setSelectedUser(null);
    // setSelectedGroup({ _id: group._id, name: group.name, profilePic: group.profilePic, members: group.members, admin: group.admin, terminated: false });
    // setSidebarContent("groups");
    // handleClose();
  };

  const handleMemberClick = (member) => {
    if (!member?._id || selectedGroup?.blockedMembers?.includes(member._id)) {
      toast.error("Cannot select invalid or blocked member");
      return;
    }
       
    if (member._id.toString() === authUser._id.toString()) return;
    const status = getMemberStatus(member);
    if ((status === "Friend" || status === "Admin")  && allContacts.find((m) => m._id.toString() === member._id.toString()).roomId) {
      if (socket && allContacts.find((m) => m._id.toString() === member._id.toString()).roomId) {
          // SOLUTION: On clicking a private chat, join the private room. This ensures real-time message receipt and fixes inability to open chat container by syncing state properly.
          socket.emit("join_private_rooms", [allContacts.find((m) => m._id.toString() === member._id.toString()).roomId]);
         console.log(allContacts.find((m) => m._id.toString() === member._id.toString()).roomId, "allContacts.find((m) => m._id.toString() === member._id.toString()).roomId")
 
        setSelectedUser(allContacts.find((m) => m._id.toString() === member._id.toString()));
       setSidebarContent("chats");
         setSelectedGroup(null);
      
        handleClose();
        
        //useChatStore.getState().getGroupChats();
       }

      // setSelectedGroup(null);

      // setSelectedUser({ _id: member._id, fullName: member.fullName, profilePic: member.profilePic });
      // setSidebarContent("chats");
      // handleClose();
    } else if (status === "Not Friend") {
      setSelectedUser(null);
      setSelectedGroup(null);
      setSidebarContent("send");
      setSearchQuery(member.fullName || "");
      handleClose();
    }
  };

  const handleRemoveUser = async (userId) => {
    if (isGroup && authUser._id.toString() === selectedGroup.admin._id.toString() && !isGroupTerminated) {
      try {
        await removeUser(selectedGroup._id, userId);
        toast.success("User removed from group");
      } catch (error) {
        toast.error("Failed to remove user");
        console.error("Remove user error:", error);
      }
    } else {
      toast.error(isGroupTerminated ? "Cannot remove users from a terminated group" : "Only admins can remove users");
    }
  };

  const handleExitGroup = async () => {
    if (isGroup && profile?._id && !isGroupTerminated) {
      try {
      await exitGroup(profile._id);
        setSelectedGroup({...selectedGroup, roomId:null});
        handleClose();
        toast.success("Exited group successfully");
      } catch (error) {
        toast.error("Failed to exit group");
        console.error("Exit group error:", error);
      }
    } else {
      toast.error(isGroupTerminated ? "Cannot exit a terminated group" : "Invalid group");
    }
  };

  const handleUnblockUser = async () => {
    if (!isGroup && selectedUser?._id) {
      try {
        await unblockUser(selectedUser._id);
        toast.success("User unblocked successfully");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to unblock user");
        console.error("Unblock user error:", error);
      }
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
        //useChatStore.getState().getGroupChats();
      }
      if (!chat.recentMessage) {
      useChatStore.getState().getGroupChats(); // Or getMyChatPartners for private
    }
     // setActive(null);
    };

  const handleReportGroup = async () => {
    if (isGroup && profile?._id && !isGroupTerminated) {
      try {
        await reportGroup(profile._id, "Reported by user");
        toast.success("Group reported successfully");
      } catch (error) {
        toast.error("Failed to report group");
        console.error("Report group error:", error);
      }
    } else {
      toast.error(isGroupTerminated ? "Cannot report a terminated group" : "Invalid group");
    }
  };

  const handleBlockUser = async () => {
    if (!isGroup && selectedUser?._id) {
      try {
        await blockUser(selectedUser._id);
       // setSelectedUser(null);
        //handleClose();
        toast.success("User blocked successfully");
      } catch (error) {
        toast.error("Failed to block user");
        console.error("Block user error:", error);
      }
    }
  };

  const handleDeleteFriend = async () => {
    if (!isGroup && selectedUser?._id) {
      try {
        await deleteFriend(selectedUser._id);
        setSelectedUser(null);
        handleClose();
        toast.success("Friend deleted successfully");
      } catch (error) {
        toast.error("Failed to delete friend");
        console.error("Delete friend error:", error);
      }
    }
  };

  const handleReportChat = async () => {
    if (!isGroup && selectedUser?._id) {
      try {
        await reportChat(selectedUser._id, "Reported by user");
        toast.success("Chat reported successfully");
      } catch (error) {
        toast.error("Failed to report chat");
        console.error("Report chat error:", error);
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isOnline) {
      queueAction({ type: "updateProfile", profilePic: file, groupId: isGroup ? selectedGroup._id : null, group: isGroup, groupName });
      toast.success("Profile update queued for when online");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      try {
        await updateProfile({
          profilePic: base64Image,
          groupId: isGroup ? selectedGroup._id : null,
          group: isGroup,
          groupName: isGroup ? groupName : undefined,
        });
        toast.success("Profile picture updated successfully");
      } catch (error) {
        toast.error("Failed to update profile picture");
        console.error("Image upload error:", error);
      }
    };
  };

  const handleGroupNameChange = async () => {
    if (isGroup && authUser._id.toString() === selectedGroup?.admin?._id.toString() && !isGroupTerminated) {
      if (!isOnline) {
        queueAction({ type: "updateProfile", groupId: selectedGroup._id, group: true, groupName, profilePic: selectedImg || selectedGroup.profilePic });
        toast.success("Group name update queued for when online");
        return;
      }
      try {
        await updateProfile({
          groupId: selectedGroup._id,
          group: true,
          groupName: groupName.toLowerCase().trim(),
          profilePic: selectedImg || selectedGroup.profilePic,
        });
        toast.success("Group name updated successfully");
      } catch (error) {
        toast.error("Failed to update group name");
        console.error("Group name update error:", error);
      }
    } else {
      toast.error(isGroupTerminated ? "Cannot update a terminated group" : "Only admins can update group name");
    }
    setEdit(false);
  };

  const getMemberStatus = (member) => {
    if (!member?._id) return "Unknown";
    if (member._id.toString() === authUser._id.toString()) {
      return member._id.toString() === profile?.admin?._id.toString() ? "Admin" : "Member";
    }
    if (member._id.toString() === profile?.admin?._id.toString()) return "Admin";
    if (allContacts.some((contact) => contact._id.toString() === member._id.toString())) return "Friend";
    return "Not Friend";
  };

  const truncatePar = (word, maxword) => {
    if (!word) return "";
    return word.length <= maxword ? word : word.slice(0, maxword) + "...";
  };
  const [searchGroupName, setsearchGroupName] = useState(null)
    const allChatsForForward = [...allContacts, ...allGroups];
  const list = searchGroupName
    ? allChatsForForward.filter(
        (contact) =>
          (contact.fullName && contact.fullName.toLowerCase().trim().includes(searchGroupName.toLowerCase().trim())) ||
          (contact.name && contact.name.toLowerCase().trim().includes(searchGroupName.toLowerCase().trim()))
      )
    : allChatsForForward;

  const handleDownload = async (url, name) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const urlBlob = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlBlob;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  const renderAttachment = (item, index, isGrid = false) => {
    if (activeTab === "saved" && item.senderId) {
      const msg = item;
      const senderName = msg.senderId?.fullName || "Unknown";
      const isOwnMessage = msg.senderId?._id.toString() === authUser._id.toString();

      if (msg.attachments && msg.attachments.length > 0 && isGrid) {
        return msg.attachments.map((att, attIndex) => {
          const { attachmentType, attachmentUrl, originalName, size, preview, duration } = att;
          const sizeMB = size ? (size / 1024 / 1024).toFixed(2) + " MB" : "Unknown size";
          const fileInfo = (
            <div className="absolute font-semibold capitalize h-[38%] break-words text-wrap lowercase bottom-0 left-0 right-0 bg-[var(--bg-main)] p-1 text-xs text-[var(--text-primary)] truncate">
               <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-cyan-400 capitalize flex items-center gap-1"><User2Icon size={15}/> {senderName !== authUser.fullName ? senderName : "You"}:</span>
          </div>
           <p className="text-sm font-normal text-[var(--text-primary)]">{msg.text && truncatePar(msg.text, isGrid ? 100 : 20)}</p>
         
             {!msg.text &&  `File Name:    ${truncatePar(originalName, 25)}`}
            
                    </div>
          );

          switch (attachmentType) {
            case "image":
              return (
                <div key={`${index}-${attIndex}`} className={`relative ${isGrid ? "w-full h-32" : "w-20 h-16"}`}>
                  <img src={attachmentUrl || preview} alt={originalName} className="w-full h-full object-cover rounded" />
                  {isGrid && (
                    <button
                      onClick={() => handleDownload(attachmentUrl, originalName)}
                      className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
                    >
                      <DownloadIcon size={16} />
                    </button>
                  )}
                  {isGrid && fileInfo}
                
                </div>
              );
            case "video":
              return (
                <div key={`${index}-${attIndex}`} className={`relative ${isGrid ? "w-full h-32" : "w-25 h-16"}`}>
                  <video src={attachmentUrl} className="w-full h-full object-cover rounded" controls={isGrid} />
                  {isGrid && (
                    <button
                      onClick={() => handleDownload(attachmentUrl, originalName)}
                      className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
                    >
                      <DownloadIcon size={16} />
                    </button>
                  )}
                  {isGrid && fileInfo}
                </div>
              );
            case "audio":
              return (
                <div key={`${index}-${attIndex}`} className={`relative ${isGrid ? "w-full" : "w-[4.5rem]"} bg-[var(--bg-main)] p-2 rounded`}>
                  {isGrid ? (
                    <audio src={attachmentUrl} controls className="w-full" />
                  ) : (
                    <img src="/audio-file.png" alt="audio" className="w-full" />
                  )}
                  {isGrid && fileInfo}
                  {isGrid && (
                    <span className="text-[var(--text-secondary)] text-xs">
                      {duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}` : "Audio"}
                    </span>
                  )}
                  {isGrid && (
                    <button
                      onClick={() => handleDownload(attachmentUrl, originalName)}
                      className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
                    >
                      <DownloadIcon size={16} />
                    </button>
                  )}
                </div>
              );
            case "document":
              return (
                <div key={`${index}-${attIndex}`} className={`relative ${isGrid ? "w-full h-32" : "w-[4.5rem] h-16"}`}>
                  <img src={preview} alt={originalName} className="w-full h-full object-cover rounded" />
                  {isGrid && fileInfo}
                  {isGrid && (
                    <button
                      onClick={() => handleDownload(attachmentUrl, originalName)}
                      className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
                    >
                      <DownloadIcon size={16} />
                    </button>
                  )}
                </div>
              );
            default:
              return null;
          }
        });
      }

      return (
        <div
          key={index}
          className={`relative ${isGrid ? "w-full p-4 bg-[var(--bg-main)] rounded-lg" : "w-[4.5rem] h-16 bg-[var(--bg-main)] rounded"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-cyan-400 capitalize">{senderName !== authUser.fullName ? senderName : "You"}:</span>
          </div>
          <p className="text-sm text-[var(--text-primary)]">{truncatePar(msg.text, isGrid ? 100 : 20)}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{formatFullDate(msg.createdAt)}</p>
        </div>
      );
    }

    const { attachmentType, attachmentUrl, originalName, size, preview, duration } = item;
    const sizeMB = size ? (size / 1024 / 1024).toFixed(2) + " MB" : "Unknown size";
    const fileInfo = (
      <div className="absolute h-[38%] break-words text-wrap lowercase bottom-0 left-0 right-0 bg-[var(--bg-main)]/70 p-1 text-xs text-[var(--text-primary)] truncate">
        {truncatePar(originalName, 25)}
      </div>
    );

    switch (attachmentType) {
      case "image":
        return (
          <div key={index} className={`relative ${isGrid ? "w-full h-32" : "w-20 h-16"}`}>
            <img src={attachmentUrl || preview} alt={originalName} className="w-full h-full object-cover rounded" />
            {isGrid && (
              <button
                onClick={() => handleDownload(attachmentUrl, originalName)}
                className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
              >
                <DownloadIcon size={16} />
              </button>
            )}
            {isGrid && fileInfo}
          </div>
        );
      case "video":
        return (
          <div key={index} className={`relative ${isGrid ? "w-full h-32" : "w-25 h-16"}`}>
            <video src={attachmentUrl} className="w-full h-full object-cover rounded" controls={isGrid} />
            {isGrid && (
              <button
                onClick={() => handleDownload(attachmentUrl, originalName)}
                className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
              >
                <DownloadIcon size={16} />
              </button>
            )}
            {isGrid && fileInfo}
          </div>
        );
      case "audio":
        return (
          <div key={index} className={`relative ${isGrid ? "w-full" : "w-[4.5rem]"} bg-[var(--bg-main)] p-2 rounded`}>
            {isGrid ? (
              <audio src={attachmentUrl} controls className="w-full" />
            ) : (
              <img src="/audio-file.png" alt="audio" className="w-full" />
            )}
            {isGrid && fileInfo}
            {isGrid && (
              <span className="text-[var(--text-secondary)] text-xs">
                {duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}` : "Audio"}
              </span>
            )}
            {isGrid && (
              <button
                onClick={() => handleDownload(attachmentUrl, originalName)}
                className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
              >
                <DownloadIcon size={16} />
              </button>
            )}
          </div>
        );
      case "document":
        return (
          <div key={index} className={`relative ${isGrid ? "w-full h-32" : "w-[4.5rem] h-16"}`}>
            <img src={preview || 'https://img.icons8.com/?size=100&id=Hku9UaGJ7edj&format=png&color=000000'} alt={originalName} className="w-full h-full object-cover rounded" />
            {isGrid && fileInfo}
            {isGrid && (
              <button
                onClick={() => handleDownload(attachmentUrl, originalName)}
                className="absolute top-2 right-2 text-[var(--text-primary)] bg-black/50 p-1 rounded-full"
              >
                <DownloadIcon size={16} />
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };
// const [forwardModalOpen, setForwardModalOpen] = useState(null);
 
  const renderCommonGroup = (group) => {
    if (!group?._id || !group?.name || group.terminated) return null;
    return (
      <div
        key={group._id}
        onClick={() => handleGroupClick(group)}
        className="flex items-center gap-3 p-3 hover:bg-[var(--bg-main)] rounded cursor-pointer transition-colors"
      >
        <img src={group.profilePic || "/avatar.png"} alt={group.name} className="w-10 h-10 rounded-full" />
        <div>
          <h5
          style={{color:group.color}}
          className="text-[var(--text-primary)] text-sm font-medium">{truncatePar(group.name, 25)}</h5>
          <p className="text-[var(--text-secondary)] text-xs">{truncatePar(group.about, 24)}</p>
        </div>
      </div>
    );
  };

  const renderMember = (member) => {
    if (!member?._id || selectedGroup?.blockedMembers?.includes(member._id)) return null;
    const isSelf = member._id.toString() === authUser._id.toString();
    const name = isSelf ? "You" : member.fullName;
    const status = getMemberStatus(member);
    const isAdmin = authUser._id.toString() === selectedGroup?.admin?._id.toString();
    return (
    <>
    {
      show === "member" && 
    <> {
       selectedGroup && !selectedGroup.restrictions?.find((m) => m.userId === member._id)?._id &&  <div
        key={member._id}
         onClick={() => !isSelf && handleMemberClick(member)}
         className="flex items-center justify-between p-3 hover:bg-[var(--bg-main)] rounded cursor-pointer transition-colors"
      >
        <div
          className="flex items-center w-full gap-3"
        >
          <img src={member.profilePic || "/avatar.png"} alt={name} className="w-10 h-10 rounded-full" />
          <div className="w-full">
            <h5 style={{color: member.color}} className="text-[var(--text-primary)] text-sm font-medium text-nowrap capitalize">{truncatePar(name, 25)}</h5>
            <div  className="flex w-full items-center justify-between">
                <p className="text-[var(--text-secondary)] text-xs">{status}</p>
       

                {selectedGroup && !selectedGroup.restrictions?.find((m) => m.userId === member._id)?._id && isAdmin && !isSelf && status !== "Admin" && !isGroupTerminated && (
          <button
            onClick={() => handleRemoveUser(member._id)}
            className=" text-xs flex items-center"
          >
            <BanIcon size={14} className="mr-1" /> Remove
          </button>
        )}
         {selectedGroup && selectedGroup.restrictions?.find((m) => m.userId === member._id)?._id && isAdmin && !isSelf && status !== "Admin" && !isGroupTerminated && (
          <button
            onClick={() => handleRemoveUser(member._id)}
            className=" text-xs flex items-center"
          >
           Removed
          </button>
        )}
        {status === "Not Friend" && !isSelf && (
          <button
            onClick={() => handleMemberClick(member)}
            className="text-cyan-400 hover:text-cyan-300 hover:underline text-sm flex items-center"
          >
            <UserPlus size={14} className="mr-1" />Befriend
          </button>
        )}
            </div>

             </div>
        </div>
      
      </div>
      }
   
      
      
      </>
    }
    {
      show === "request" &&   <div
        key={member.userId._id}
         className="flex items-center justify-between p-3 hover:bg-[var(--bg-main)] rounded cursor-pointer transition-colors"
      >
        <div
          className="flex items-center w-full gap-3"
        >
          <img src={member.userId.profilePic || "/avatar.png"} alt={name} className="w-10 h-10 rounded-full" />
          <div className="w-full">
            <h5 style={{color: member.userId.color}} className="text-[var(--text-primary)] text-sm font-semibold text-nowrap capitalize">{truncatePar(member.userId.fullName, 25)}</h5>
            <div  className="flex w-full items-center justify-between">
             
          <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        console.log("isOnline:", isOnline); // Debug
                        // if (!isOnline) {
                        //   queueAction({ type: "acceptRequest", requestId: request._id });
                        //   return;
                        // }
                      acceptGroupJoinRequest(selectedGroup._id , member.userId._id);
                      }}
                      style={{ fontSize: "14px" }}
                      className="bg-green-500/50 p-1 font-normal rounded hover:bg-green-500/70 text-[var(--text-primary)]"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        // console.log("isOnline:", isOnline); // Debug
                        // if (!isOnline) {
                        //   queueAction({ type: "declineRequest", requestId: request._id });
                        //   return;
                        // }
                        declineGroupJoinRequest(selectedGroup._id , member.userId._id);
                      }}
                      style={{ fontSize: "14px" }}
                      className="bg-red-500/50 p-1 font-normal rounded hover:bg-red-500/70 text-[var(--text-primary)]"
                    >
                      Decline
                    </button>
                  </div>
    
            </div>

             </div>
        </div>
      
      </div>
    }
    </>
    );
  };

  const isUserBlockedInGroup = isGroup && selectedGroup.restrictions?.find((m) => m.userId === authUser._id)?._id;

  return (
    <div className="w-[100%] flex flex-col h-[100vh] bg-[var(--bg-secondary)] backdrop-blur-sm overflow-x-hidden overflow-y-auto text-[var(--text-primary)] border-l-2 border-[var(--border)] md:w-[25rem] ">
      {!showAllMedia && (
        <>
          <div className="p-6 py-2 relative flex md:flex-col gap-3 items-center">
          <button className=" cursor-pointer transition-colors" onClick={() => {setShowMedia(false);}}>
                       <XIcon className="absolute bg-red-800/50 hover:bg-red-800 right-1 top-3 w-6 h-6 text-[var(--text-secondary)] bg-transparent " />
                     </button>
            <div className="avatar">
              <button
                className="size-[60px] md:size[80px] rounded-full overflow-hidden relative group"
                onClick={() => !isGroupTerminated && fileInputRef.current.click()}
                disabled={isGroupTerminated}
              >
                <img
                  src={selectedImg || profilePic}
                  alt={profileName}
                  className="size-full object-cover"
                />
                {isGroup && authUser._id.toString() === selectedGroup?.admin?._id.toString() && !isGroupTerminated && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[var(--text-primary)] text-xs">Change</span>
                  </div>
                )}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                disabled={isGroupTerminated}
              />
            </div> 
            <div>
            {isGroup && authUser._id.toString() === selectedGroup?.admin?._id.toString() && !isGroupTerminated ? (
              <div className="flex items-center justify-center gap-2 mt-2">
                {edit ? (
                  <>
                    <XIcon className="cursor-pointer" size={18} onClick={() => setEdit(false)} />
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      onBlur={handleGroupNameChange}
                      className="text-md outline-none text-center font-medium border-b-2 bg-transparent border-[var(--border)] text-[var(--text-primary)] rounded p-1"
                      placeholder="Group Name"
                    />
                  </>
                ) : (
                  <>
                    <IoPencilOutline className="cursor-pointer" size={18} onClick={() => setEdit(true)} />
                    <h3 className="text-md font-medium">{truncatePar(profileName, 25)}</h3>
                  </>
                )}
              </div>
            ) : (
              <h3 style={{color: profile?.color}} className="text-md font-semibold mt-2 capitalize text-center">{truncatePar(profileName, 25)}</h3>
            )}
            <p className="text-[var(--text-primary)] text-sm mt-1 text-center">Group * {about}</p>
          </div>

          </div>
           <p className="text-[var(--text-secondary)] text-center text-sm mb-1 px-6 ">{selectedGroup?.about}</p>
            {isGroupTerminated && (
              <p className="text-red-400 text-sm mt-2">This group has been terminated</p>
            )}
          {!isGroupTerminated && (
            <div className="px-4 flex gap-5 justify-center">
              <button className="flex flex-col items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <PhoneIcon size={20} className="text-cyan-500" />
                <span className="text-xs mt-1">Call</span>
              </button>
              <button className="flex flex-col items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <VideoIcon size={20} className="text-cyan-500" />
                <span className="text-xs mt-1">Video</span>
              </button>
              <button
              onClick={() => setForwardModalOpen(selectedUser._id)}
              className="flex flex-col items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <Share2Icon size={24} className="text-cyan-500" />
                <span className="text-xs mt-1">Share</span>
              </button>
            </div>
          )}
          <div className="p-4 border-b border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm text-[var(--text-primary)] font-medium">Recent Media & Files</h4>
              {!isGroupTerminated && (
                <button
                  onClick={() => setShowAllMedia(!showAllMedia)}
                  className="cursor-pointer p-2 rounded-md h-10 w-10 text-[var(--text-primary)] hover:bg-[var(--bg-main)]"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            <div className="w-full overflow-x-auto">
              <div className="flex w-[30rem] flex-shrink-0 overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {recentAttachments.length > 0 ? (
                  recentAttachments.map((att, index) => renderAttachment(att, index))
                ) : (
                  <p className="text-[var(--text-secondary)] text-sm">No recent files</p>
                )}
              </div>
            </div>
          </div>
          {!isGroup && commonGroups.length > 0 && !isGroupTerminated && (
            <div className="p-4 border-b border-slate-800">
              <h4 className="text-sm font-semibold mb-3">Common Groups</h4>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-main)] text-[var(--text-primary)] rounded-lg p-2 pl-10 text-sm"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
              </div>
            
            {
                filteredCommonGroups.length > 0 &&  <> <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {filteredCommonGroups.map(renderCommonGroup)}
              </div>
             </>
            } 
            {
                   filteredCommonGroups.length === 0 && <div>
                    
                    <p className="text-center w-full">No Common Group found with such name</p>
                   </div>
            }
             

            </div>
          )}
          {/* {
            !isGroup && <div className="flex px-3 flex-col gap-3 mt-4 mb-3">
               <div className="flex gap-3 items-center justify-center flex-col">
               {selectedUser && allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && authUser?.blockedUsers.find((b) => b.userId === selectedUser._id) &&
                    <button
                      onClick={handleUnblockUser}
                     className="flex items-center gap-2 text-sm p-2 rounded hover:bg-[var(--color-primary)]/50 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-2 border-cyan-500 bg-[var(--color-primary)] transition-colors"
                   >
                      <BanIcon size={16} /> Unblock
                    </button>
                 } 
                 
                 {selectedUser && allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && !selectedUser?.blockedUsers.find((b) => b.userId === authUser._id) &&
                       <button
                      onClick={handleBlockUser}
                      className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border- bg-red-500/50 transition-colors"
                    >
                      <BanIcon size={16} /> Block
                    </button>
                 } 
                  
               {selectedUser&& allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && (selectedUser.blockedUsers.length === 0 || selectedUser.blockedUsers.length > 0)  && selectedUser?.blockedUsers.find((b) => b.userId === authUser._id) &&
                    <p className="p-4 text-center">You have been blocked from this chat </p>
                 }
              
                {selectedUser&& allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && (selectedUser.blockedUsers.length === 0 || selectedUser.blockedUsers.length > 0)  && !selectedUser?.blockedUsers.find((b) => b.userId === authUser._id) &&
                 <button
                  onClick={handleReportChat}
                  className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-none border-red-500 bg-red-500/50 transition-colors"
                >
                  <AlertTriangleIcon size={16} /> Report Chat
                </button>}
                </div>
              
                 {allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && (
                  <button
                    onClick={handleDeleteFriend}
                    className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-none border-red-500 bg-red-500/50 transition-colors"
                  >
                    <UserMinus size={16} /> Delete
                  </button>
                )}
              </div> 
          } */}
           {
            !isGroup && <div className="flex px-3 flex-col gap-3 mt-4 mb-3">
               <div className="flex gap-3 items-center justify-center flex-col">
               {selectedUser && report  && allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && blockedUsers.some((b) => b.userId === selectedUser._id) &&  // authUser blocked them
                       <p className="p-4 text-center">You have been blocked from this chat </p>
                
                 }
               {selectedUser && !report && allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && blockedUsers.some((b) => b.userId === selectedUser._id) &&  // authUser blocked them
                    <button
                      onClick={handleUnblockUser}
                     className="flex items-center gap-2 text-sm p-2 rounded hover:bg-[var(--color-primary)]/50 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-2 border-cyan-500 bg-[var(--color-primary)] transition-colors"
                   >
                      <BanIcon size={16} /> Unblock
                    </button>
                 }
                
                {selectedUser   && allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && !selectedUser?.blockedUsers.find((b) => b.userId === authUser._id) && !blockedUsers.some((b) => b.userId === selectedUser._id) && // Not blocked by them AND authUser didn't block them
                       <button
                      onClick={handleBlockUser}
                      className="flex items-center gap-2 text-sm p-2 rounded hover:bg-red-500 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border- bg-red-500/50 transition-colors"
                    >
                      <BanIcon size={16} /> Block
                    </button>
                 }
                 
               {selectedUser&& allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && selectedUser?.blockedUsers.find((b) => b.userId === authUser._id) && // They blocked authUser
                    <p className="p-4 text-center">You have been blocked from this chat </p>
                 }

                               
             
                </div>
             
                 {allContacts.some((contact) => contact._id.toString() === selectedUser._id.toString()) && (
                  <button
                    onClick={handleDeleteFriend}
                    className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-none border-red-500 bg-red-500/50 transition-colors"
                  >
                    <UserMinus size={16} /> Delete
                  </button>
                )}
              </div>
          }
          {isGroup &&  sortedMembers.length > 0 && !isUserBlockedInGroup && !isGroupTerminated && (
            <div className="p-4 border-b border-slate-800 ">
              <div className="w-full flex justify-between items-center mb-3">
               <div onClick={() => setShow("member")} className={`flex  p-1 items-center gap-2 ${ authUser._id.toString() === selectedGroup?.admin?._id.toString() && `${show === "member" && "bg-[var(--color-primary-hover)] " } hover:bg-[var(--color-primary-hover)] cursor-pointer ` } `}>
                <h4 className="text-[var(--text-secondary)] text-sm font-semibold">Members ({filteredMembers.length})</h4>
              </div>
              {
                 authUser._id.toString() === selectedGroup?.admin?._id.toString() && <div onClick={() => setShow("request")} className={`flex  p-1 items-center gap-2 ${show === "request" && "bg-[var(--color-primary-hover)]" } cursor-pointer hover:bg-[var(--color-primary-hover)]`}>
                <h4 className="text-[var(--text-secondary)] text-sm font-semibold">Requests{filteredgroupRequest.length > 0 && <>({filteredgroupRequest.length}) </>}</h4>
              </div>
              }
              
              
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder={show === "member" ? "Search members..." : "Search request..."}
                  value={searchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-main)] text-[var(--text-primary)] rounded-lg p-2 pl-10 text-sm"
                />
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
              </div>
              {
                show === "member" && filteredMembers.length > 0 && <>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {filteredMembers.map(renderMember)}
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handleExitGroup}
                  className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500/50 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-2 border-red-500 bg-red-500 transition-colors"
                >
                  <LogOutIcon size={16} /> Exit Group
                </button>
                <button
                  onClick={handleReportGroup}
                  className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500/50 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-2 border-red-500 bg-red-500 transition-colors"
                >
                  <AlertTriangleIcon size={16} /> Report Group
                </button>
              </div>
                </>
              }
              {
                 show === "member" &&  filteredMembers.length === 0 && <div>
                    
                    <p className="text-center w-full">No group member found with such name</p>
                   </div>
            }
            {
                show === "request" && filteredgroupRequest.length > 0 && <>
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {filteredgroupRequest.map(renderMember)}
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={handleExitGroup}
                  className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500/50 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-2 border-red-500 bg-red-500 transition-colors"
                >
                  <LogOutIcon size={16} /> Exit Group
                </button>
                <button
                  onClick={handleReportGroup}
                  className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500/50 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-2 border-red-500 bg-red-500 transition-colors"
                >
                  <AlertTriangleIcon size={16} /> Report Group
                </button>
              </div>
                </>
              }
              {
                 show === "request" &&  filteredgroupRequest.length === 0 && <div>
                    
                    <p className="text-center w-full">No group request found</p>
                   </div>
            }
            </div>
          )}
          {isGroup && isUserBlockedInGroup && (
            <div className="p-4 border-b border-slate-800">
              <p className="text-red-400 text-sm mb-4">You are been removed from this group</p>
              <button
                onClick={handleExitGroup}
                className="flex items-center gap-2  text-sm p-2 rounded hover:bg-red-500/50 w-full text-[var(--text-primary)] hover:text-[var(--text-primary)] border-2 border-red-500 bg-red-500 transition-colors w-full"
              >
                <LogOutIcon size={16} /> Delete Group
              </button>
            </div>
          )}
        </>
      )}
      {showAllMedia && !isUserBlockedInGroup && !isGroupTerminated && (
        <div className="p-4 flex-grow h-[100vh] overflow-hidden">
          <div className="flex justify-start gap-3 items-center mb-7">
            <ChevronLeft
              className="cursor-pointer p-2 rounded-md h-10 w-10 hover:bg-[var(--bg-main)]"
              onClick={() => setShowAllMedia(false)}
            />
            <h4 className="text-sm font-semibold">All Media & Files</h4>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-4 flex-wrap overflow-x-hidden pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            {[
              { id: "all", label: "All", icon: FileIcon },
              { id: "documents", label: "Docs", icon: DockIcon },
              { id: "images", label: "Images", icon: Image },
              { id: "videos", label: "Videos", icon: FilmIcon },
              { id: "audios", label: "Audios", icon: MicIcon },
              { id: "saved", label: "Saved", icon: StarIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-shrink-0 items-center px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  activeTab === id ? "bg-[var(--color-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-main)] text-[var(--text-secondary)] hover:bg-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={`grid ${activeTab === "saved" ? "grid-cols-1" : "grid-cols-2"} gap-4 overflow-y-auto max-h-[100vh] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 pt-0 pb-[13rem]`}>
            {filteredAttachments.length > 0 ? (
              filteredAttachments.flatMap((item, index) => renderAttachment(item, index, true))
            ) : (
              <p className="text-[var(--text-secondary)] text-sm col-span-2 text-center py-4">
                {activeTab === "saved" ? "No saved messages" : "No items in this category"}
              </p>
            )}
          </div>
        </div>
      )}
          
               { selectedUser && forwardModalOpen && <div 
               onMouseLeave={() => setForwardModalOpen(null)}
               className="fixed top-0 inset-0 md:hidden flex items-center justify-center bg-black/50 z-[1000000]">
                  <div className="bg-[var(--bg-main)] relative p-8 rounded-lg shadow-lg w-[90%] h-[90vh] flex flex-col">
                    {/* Top Absolute Section */}
                    <div className="absolute top-0 left-0 p-8 pb-2 pt-4 w-full bg-inherit z-20">
                      <h2 className="flex items-center text-[20px] font-semibold mb-4 text-cyan-500">
                       <Share2Icon size={25} /> Send To
                      </h2>
                      <div className="relative mb-3">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={searchGroupName}
                          onChange={(e) => setsearchGroupName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          placeholder="Search Contacts"
                        />
                      </div>
                      {/* {selectedChatsForForward.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap w-full">
                          {selectedChatsForForward.map((forUser, ind) => {
                            const user = allChatsForForward.find((forw) => forw._id.toString() === forUser._id.toString());
                            return user ? (
                              <div
                                key={ind}
                                onClick={() => setSelectedChatsForForward((prev) => prev.filter((id) => id._id !== forUser._id))}
                                className="p-2 cursor-pointer rounded-full bg-[var(--color-primary)] w-fit"
                              >
                                <p className="text-[var(--text-primary)] text-sm">{user.fullName || user.name}</p>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )} */}
                      <h3 className="text-[var(--text-primary)] mt-2">Select chats to forward (max 5)</h3>
                    </div>
             
                    {/* Scrollable Middle Section */}
                    <div className="flex-1 overflow-y-auto h-[50vh] pt-36 pb-20">
                      {list && list.length > 0 ? (
                        list.map((chat) => (
                          <div
                            key={chat._id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                            onClick={() => {
                              //toggleForwardChat(chat)
                               if (socket 
                                //&&  chat.roomId && selectedChatsForForward.includes(chat) 
                                ) 
                                {
                    // SOLUTION: When selecting a contact to start/open chat, ensure join the private room. This fixes the deviation where chat container doesn't open/load for new chats and enables real-time first-message receipt.
                  //  socket.emit("join_private_rooms", [chat.roomId]);
                  }
                
                
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="avatar relative">
                                <div className="w-10 rounded-full">
                                  <img src={chat.profilePic || "/avatar.png"} alt={chat.fullName || chat.name} />
                                </div>
                                {/* {selectedChatsForForward.includes(chat) && (
                                  <div className="bg-[var(--color-primary)] rounded-full p-0.5 absolute bottom-0 left-0 z-10">
                                    <FaCheck size={12} className="font-semibold text-[var(--text-primary)]" />
                                  </div>
                                )} */}
                              </div>
                              <div className="flex flex-col justify-start items-start">
                                <h4 style={{color: chat.color}} className="text-[var(--text-primary)] font-medium capitalize">{chat.fullName || chat.name}</h4>
                                <p className="text-[var(--text-secondary)] text-sm text-left">{truncatePar(chat.about, 50)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-[var(--text-secondary)]">No group or user found with such name</div>
                      )}
                    </div>
             
                    {/* Bottom Absolute Section */}
                    <div className="absolute bottom-0 left-0 p-4 w-full bg-inherit z-20 flex justify-between gap-2">
                      <button
                      // onClick={handleForwardConfirm}
                       className="bg-[var(--color-primary)] text-[var(--text-primary)] py-2 px-4 rounded hover:bg-[var(--color-primary-hover)]">
                        Forward
                      </button>
                      <button
                        //onClick={() => setForwardModalOpen(false)}
                        className="bg-gray-500 text-[var(--text-primary)] py-2 px-4 rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>}
            
    </div>
  );
};

export default InforArea;