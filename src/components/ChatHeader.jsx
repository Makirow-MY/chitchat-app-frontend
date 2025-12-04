// Frontend: components/ChatHeader.js (Updated with call buttons triggering enhanced calls)
import { ChevronDown, ChevronUp, FileArchive, InfoIcon, PhoneIcon, Search, SearchIcon, VideoIcon, XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { FiMoreVertical, FiSearch } from "react-icons/fi";
import { IoMdArchive, IoMdTrash } from "react-icons/io";
import toast from "react-hot-toast";
import { FaArrowLeft, FaBackward, FaBroom, FaInfo } from "react-icons/fa";
import { MdClear, MdClearAll, MdDeleteSweep, MdOutlineDeleteSweep, MdReport } from "react-icons/md";
import { useCallStore } from "../store/useCallStore";

function ChatHeader({
  dropdownOpen, setDropdownOpen,
  handleReportChat, searchQuery, onSearchChange, handleNextMatch, handlePrevMatch, resultsCount, currentMatchIndex}) {
  const { 
    initiateCall,
    selectedUser,report, blockedUsers, sidebarContent, setAttached, setShowEmojiPicker, setSelectedUser, setSelectedGroup, selectedGroup, archiveChat, unarchiveChat, deleteChat, archivedChats } = useChatStore();
  const {theme, onlineUsers,authUser, showmedia, setShowMedia } = useAuthStore();
 // const [dropdownOpen, setDropdownOpen] = useState(false);
function formatFullDate(date) {
  const d = new Date(date);
  const weekday = d.toLocaleString("en-US", { weekday: "long" });
  const month = d.toLocaleString("en-US", { month: "long" });
 // const hour = d.toLocaleString("en-US", { hour: "long" });
  const day = d.getDate();
  const hour = d.getHours()
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
  return hour <= 3 ? `${hour} hour${hour > 1 ? 's' : ''} ago` : `${weekday} ${day}${ordinal} ${month}`;
}

  let isOnline = false;
  let onlineMembersData = [];
  if (selectedUser) {
    isOnline = onlineUsers.includes(selectedUser._id);
  } else if (selectedGroup) {
    const membersId = selectedGroup.members ? selectedGroup.members.map((member) => member._id) : [];
    const onlineMemberIds = membersId.filter((id) => onlineUsers.includes(id));
    onlineMembersData = selectedGroup.members ? selectedGroup.members.filter((member) => onlineMemberIds.includes(member._id)) : [];
    isOnline = onlineMembersData.length > 0;
  }

  const isArchived = archivedChats.some((chat) => chat._id === (selectedUser?._id || selectedGroup?._id));
const [showSearch, setShowSearch] = useState(false)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setSelectedUser(null);
        setSelectedGroup(null);
        setDropdownOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser, setSelectedGroup]);

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
    } catch (error) {
      toast.error(`Failed to ${isArchived ? "unarchive" : "archive"} chat`);
    }
  };

  const handleDeleteChat = async () => {
    const entityId = selectedUser?._id || selectedGroup?._id;
    if (!entityId) return;
    try {
      await deleteChat(entityId);
      toast.success("Chat deleted");
      setDropdownOpen(false);
    } catch (error) {
      toast.error("Failed to delete chat");
    }
  };
  //const { initiateCall } = useCallStore(); // Add this

// **Function: Handle voice call initiation**
// Triggers voice call using call store.
const handleVoiceCall = () => {
    const targetId = selectedUser?._id || selectedGroup?._id;
    const isGroup = !!selectedGroup;
    initiateCall({type:'voice', targetId, isGroup, roomId: isGroup ? selectedGroup._id : selectedUser.roomId});
  };

// **Function: Handle video call initiation**
// Triggers video call using call store.
  const handleVideoCall = () => {
    const targetId = selectedUser?._id || selectedGroup?._id;
    const isGroup = !!selectedGroup;
    initiateCall({type:'video', targetId, isGroup, roomId: isGroup ? selectedGroup._id : selectedUser.roomId});
  };

  return (
    <div onClick={() => { setShowEmojiPicker(false), setAttached(false) }} className={`flex  justify-between z-[100000] items-center bg-[var(--bg-secondary)] border-b border-[var(--border)] max-h-[84px] px-4 sm:px-6 py-4 flex-shrink-0 ${theme === "light" ? "bg-blue-100" : "bg-[var(--bg-secondary)]"} `}>
      {selectedUser ? (
        <>
         <div className="flex items-center gap-2">
        <button onClick={() => setSelectedUser({...selectedUser, roomId: null})} className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] block md:hidden">
              <FaArrowLeft size={18} />
            </button>
          <div
          onClick={() => setShowMedia(!showmedia)}
          className="flex cursor-pointer items-center space-x-3">
            <div className={`avatar ${isOnline ? "online" : ""}`}>
              <div className="w-10 sm:w-12 rounded-full">
                <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              </div>
            </div>
            <div>
              <h3 style={{color: selectedUser.color}} className="text-[var(--text-primary)] font-medium capitalize text-sm sm:text-base">{selectedUser.fullName}</h3>
              <p className={`text-[var(--text-secondary)] text-xs sm:text-sm `}>{selectedUser?.onlineStatus === "online" ? selectedUser.onlineStatus: formatFullDate(selectedUser.lastSeen)}</p>
            </div>
          </div>
          </div>
                   {
  showSearch && (
    <div className="  flex items-center gap-2">
      <div className={`relative w-full p-2 gap-2 flex items-center ${theme === "light" ? "bg-slate-100" : "bg-[var(--bg-main)]"} rounded-[10px]`}>
        <FiSearch className={`font-normaltext-[var(--text-secondary)] `} size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full outline-none bg-transparent text-[var(--text-primary)] ${theme !== "light" ? "text-blue-100" : "text-slate-800"}`}
          placeholder="Search message"
        />
      </div>
      {resultsCount > 0 && (
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <button onClick={handlePrevMatch} disabled={currentMatchIndex === 0}>
            <ChevronUp className="size-5" />
          </button>
          <span>{currentMatchIndex + 1}/{resultsCount}</span>
          <button onClick={handleNextMatch} disabled={currentMatchIndex === resultsCount - 1}>
            <ChevronDown className="size-5" />
          </button>
        </div>
      )}
      {resultsCount === 0 && searchQuery && <span className="text-[var(--text-secondary)]">No results</span>}
    </div>
  )
}
          <div className="relative flex items-center space-x-2">
  
         
            <button
              className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => {setShowSearch(!showSearch)
                onSearchChange("")
              }}
            >
              <SearchIcon className="size-5" />
            </button>
            <button // onClick={handleVoiceCall} 
            className="hidden md:block p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <PhoneIcon className="size-5" />
            </button>
            <button //onClick={handleVideoCall} 
            className="hidden md:block p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <VideoIcon className="size-5" />
            </button>
            <button
              className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <FiMoreVertical className="size-5" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-8 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg z-60">
                <button
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
                  onClick={handleArchiveAction}
                >
                  <IoMdArchive size={16} /> {isArchived ? "Unarchive Chat" : "Archive Chat"}
                </button>
                  {selectedUser && !report  && blockedUsers.some((b) => b.userId === selectedUser._id) &&  // authUser blocked them
                  <button
                 onClick={handleReportChat}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
                  >
                  <MdClearAll size={16} /> Report Chat
                </button>
                }
                <button
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700"
                  onClick={handleDeleteChat}
                >
                  <MdDeleteSweep size={16} />Clear Chat
                </button>
              </div>
            )}
            
         
          </div>
        </>
      ) : selectedGroup ? (
        <>
         <div className="flex items-center gap-2">
        <button onClick={() => setSelectedGroup({...selectedGroup, roomId: null})} className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] block md:hidden">
              <FaArrowLeft size={18} />
            </button>
          <div
           onClick={() => selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  && setShowMedia(!showmedia)}
          className={`flex gap-1 ${selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  ? "cursor-pointer" : "pointer-events-none"} cursor-pointer items-center space-x-3`}>
            <div className={`avatar ${isOnline ? "online" : ""}`}>
              <div className="w-10 sm:w-12 rounded-full">
                <img src={selectedGroup.profilePic || "/avatar.png"} alt={selectedGroup.name} />
              </div>
            </div>
          {selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  &&  <div>
              <h3
              style={{color: selectedGroup.color}}
              className="text-[var(--text-primary)] font-medium capitalize text-sm sm:text-base">{selectedGroup.name}</h3>
              <p className={`text-[var(--text-secondary)] text-xs sm:text-sm `}>
                {selectedGroup?.members && selectedGroup?.members.length - selectedGroup?.restrictions.length} Members {
                  onlineMembersData && onlineMembersData.length > 0 && `(${onlineMembersData.length} Online)`
                }
                {
                  sidebarContent === "archive" ? "Archive" : ""
                }
              </p>
            </div>}
            {selectedGroup.members.length >1 &&  !selectedGroup.members.find((memId) => memId._id === authUser._id)  &&  <div>
              <h3
              className="text-[var(--text-primary)] font-medium capitalize text-sm sm:text-base">{selectedGroup.name}</h3>
              <p className="text-red-400 text-xs sm:text-sm">
               Non members can't view group content
              </p>
            </div>}
          </div>
         </div>
                          {
  showSearch && (
    <div className="  flex items-center gap-2">
      <div className={`relative w-full p-2 gap-2 flex items-center ${theme === "light" ? "bg-slate-100" : "bg-[var(--bg-main)]"} rounded-[10px]`}>
        <FiSearch className={`font-normal text-[var(--text-secondary)]`} size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full outline-none bg-transparent text-[var(--text-primary)]`}
          placeholder="Search message"
        />
      </div>
      {resultsCount > 0 && (
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <button onClick={handlePrevMatch} disabled={currentMatchIndex === 0}>
            <ChevronUp className="size-5" />
          </button>
          <span>{currentMatchIndex + 1}/{resultsCount}</span>
          <button onClick={handleNextMatch} disabled={currentMatchIndex === resultsCount - 1}>
            <ChevronDown className="size-5" />
          </button>
        </div>
      )}
      {resultsCount === 0 && searchQuery && <span className="text-[var(--text-secondary)]">No results</span>}
    </div>
  )
}
         {selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  && <div className="relative flex items-center space-x-2">
           
            <button
              className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => {setShowSearch(!showSearch)
                onSearchChange("")
              }}
            >
              <SearchIcon className="size-5" />
            </button>

              <button //{}Y{}yonClick={handleVoiceCall} 
              className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <PhoneIcon className="size-5" />
            </button>
            <button //onClick={handleVideoCall}
            
            className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <VideoIcon className="size-5" />
            </button>
            <button
              className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <FiMoreVertical className="size-5" />
            </button>
           
            {dropdownOpen && (
              <div className="absolute right-0 top-8 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg z-[10000]">
                <button
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
                  onClick={handleArchiveAction}
                >
                  <IoMdArchive size={16} /> {isArchived ? "Unarchive Chat" : "Archive Chat"}
                </button>
                 <button
                 onClick={handleReportChat}
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
                  >
                  <MdClearAll size={16} /> Report Chat
                </button>
                <button
                  className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700"
                  onClick={handleDeleteChat}
                >
                 <MdClearAll size={16} /> Clear Chat
                 </button>
              </div>
            )}
           
          </div>}
        </>
      ) : null}
    </div>
  );
}

export default ChatHeader;


// import { ChevronDown, ChevronUp, FileArchive, InfoIcon, PhoneIcon, Search, SearchIcon, VideoIcon, XIcon } from "lucide-react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import { useEffect, useState } from "react";
// import { FiMoreVertical, FiSearch } from "react-icons/fi";
// import { IoMdArchive, IoMdTrash } from "react-icons/io";
// import toast from "react-hot-toast";
// import { FaInfo } from "react-icons/fa";
// import { MdClearAll } from "react-icons/md";
// import { useCallStore } from "../store/useCallStore";

// function ChatHeader({searchQuery, onSearchChange, handleNextMatch, handlePrevMatch, resultsCount, currentMatchIndex}) {
//   const { selectedUser, sidebarContent, setAttached, setShowEmojiPicker, setSelectedUser, setSelectedGroup, selectedGroup, archiveChat, unarchiveChat, deleteChat, archivedChats } = useChatStore();
//   const {theme, onlineUsers,authUser, showmedia, setShowMedia } = useAuthStore();
//   const [dropdownOpen, setDropdownOpen] = useState(false);

//   let isOnline = false;
//   let onlineMembersData = [];
//   if (selectedUser) {
//     isOnline = onlineUsers.includes(selectedUser._id);
//   } else if (selectedGroup) {
//     const membersId = selectedGroup.members ? selectedGroup.members.map((member) => member._id) : [];
//     const onlineMemberIds = membersId.filter((id) => onlineUsers.includes(id));
//     onlineMembersData = selectedGroup.members ? selectedGroup.members.filter((member) => onlineMemberIds.includes(member._id)) : [];
//     isOnline = onlineMembersData.length > 0;
//   }

//   const isArchived = archivedChats.some((chat) => chat._id === (selectedUser?._id || selectedGroup?._id));
// const [showSearch, setShowSearch] = useState(false)
//   useEffect(() => {
//     const handleEscKey = (event) => {
//       if (event.key === "Escape") {
//         setSelectedUser(null);
//         setSelectedGroup(null);
//         setDropdownOpen(false);
//       }
//     };

//     window.addEventListener("keydown", handleEscKey);
//     return () => window.removeEventListener("keydown", handleEscKey);
//   }, [setSelectedUser, setSelectedGroup]);

//   const handleArchiveAction = async () => {
//     const entityId = selectedUser?._id || selectedGroup?._id;
//     if (!entityId) return;
//     try {
//       if (isArchived) {
//         await unarchiveChat(entityId);
//         toast.success("Chat unarchived");
//       } else {
//         await archiveChat(entityId);
//         toast.success("Chat archived");
//       }
//       setDropdownOpen(false);
//     } catch (error) {
//       toast.error(`Failed to ${isArchived ? "unarchive" : "archive"} chat`);
//     }
//   };

//   const handleDeleteChat = async () => {
//     const entityId = selectedUser?._id || selectedGroup?._id;
//     if (!entityId) return;
//     try {
//       await deleteChat(entityId);
//       toast.success("Chat deleted");
//       setDropdownOpen(false);
//     } catch (error) {
//       toast.error("Failed to delete chat");
//     }
//   };
//   const { initiateCall } = useCallStore(); // Add this

// const handleVoiceCall = () => {
//     const targetId = selectedUser?._id || selectedGroup?._id;
//     const isGroup = !!selectedGroup;
//     useCallStore.getState().initiateCall('voice', targetId, isGroup);
//   };

//   const handleVideoCall = () => {
//     const targetId = selectedUser?._id || selectedGroup?._id;
//     const isGroup = !!selectedGroup;
//     useCallStore.getState().initiateCall('video', targetId, isGroup);
//   };

//   return (
//     <div onClick={() => { setShowEmojiPicker(false), setAttached(false) }} className={`flex justify-between z-[100000] items-center bg-[var(--bg-secondary)] border-b border-[var(--border)] max-h-[84px] px-4 sm:px-6 py-4 flex-shrink-0 ${theme === "light" ? "bg-blue-100" : "bg-[var(--bg-secondary)]"} `}>
//       {selectedUser ? (
//         <>
//           <div
//           onClick={() => setShowMedia(!showmedia)}
//           className="flex cursor-pointer items-center space-x-3">
//             <div className={`avatar ${isOnline ? "online" : ""}`}>
//               <div className="w-10 sm:w-12 rounded-full">
//                 <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
//               </div>
//             </div>
//             <div>
//               <h3 style={{color: selectedUser.color}} className="text-[var(--text-primary)] font-medium capitalize text-sm sm:text-base">{selectedUser.fullName}</h3>
//               <p className={`text-[var(--text-secondary)] text-xs sm:text-sm ${theme !== "light" ? "text-blue-100" : "text-slate-800"}`}>{isOnline ? "Online" : selectedUser.about || "Offline"} {
//                 sidebarContent === "archive" ? "Archive" : ""
//               }</p>
//             </div>
//           </div>
//                    {
//   showSearch && (
//     <div className="  flex items-center gap-2">
//       <div className={`relative w-full p-2 gap-2 flex items-center ${theme === "light" ? "bg-slate-100" : "bg-[var(--bg-main)]"} rounded-[10px]`}>
//         <FiSearch className={`font-normal ${theme !== "light" ? "text-blue-100" : "text-slate-800"}`} size={18} />
//         <input
//           type="text"
//           value={searchQuery}
//           onChange={(e) => onSearchChange(e.target.value)}
//           className={`w-full outline-none bg-transparent text-[var(--text-primary)] ${theme !== "light" ? "text-blue-100" : "text-slate-800"}`}
//           placeholder="Search message"
//         />
//       </div>
//       {resultsCount > 0 && (
//         <div className="flex items-center gap-1 text-[var(--text-secondary)]">
//           <button onClick={handlePrevMatch} disabled={currentMatchIndex === 0}>
//             <ChevronUp className="size-5" />
//           </button>
//           <span>{currentMatchIndex + 1}/{resultsCount}</span>
//           <button onClick={handleNextMatch} disabled={currentMatchIndex === resultsCount - 1}>
//             <ChevronDown className="size-5" />
//           </button>
//         </div>
//       )}
//       {resultsCount === 0 && searchQuery && <span className="text-[var(--text-secondary)]">No results</span>}
//     </div>
//   )
// }
//           <div className="relative flex items-center space-x-2">
  
         
//             <button
//               className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
//               onClick={() => {setShowSearch(!showSearch)
//                 onSearchChange("")
//               }}
//             >
//               <SearchIcon className="size-5" />
//             </button>
//             <button onClick={handleVoiceCall} className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
//               <PhoneIcon className="size-5" />
//             </button>
//             <button onClick={handleVideoCall} className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
//               <VideoIcon className="size-5" />
//             </button>
//             <button
//               className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
//               onClick={() => setDropdownOpen(!dropdownOpen)}
//             >
//               <FiMoreVertical className="size-5" />
//             </button>
//             {dropdownOpen && (
//               <div className="absolute right-0 top-8 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg z-60">
//                 <button
//                   className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
//                   onClick={handleArchiveAction}
//                 >
//                   <IoMdArchive size={16} /> {isArchived ? "Unarchive Chat" : "Archive Chat"}
//                 </button>
//                 <button
//                   className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700"
//                   onClick={handleDeleteChat}
//                 >
//                   <IoMdTrash size={16} /> Delete Chat
//                 </button>
//               </div>
//             )}
            
         
//           </div>
//         </>
//       ) : selectedGroup ? (
//         <>
//           <div
//            onClick={() => selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  && setShowMedia(!showmedia)}
//           className={`flex gap-1 ${selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  ? "cursor-pointer" : "pointer-events-none"} cursor-pointer items-center space-x-3`}>
//             <div className={`avatar ${isOnline ? "online" : ""}`}>
//               <div className="w-10 sm:w-12 rounded-full">
//                 <img src={selectedGroup.profilePic || "/avatar.png"} alt={selectedGroup.name} />
//               </div>
//             </div>
//           {selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  &&  <div>
//               <h3
//               style={{color: selectedGroup.color}}
//               className="text-[var(--text-primary)] font-medium capitalize text-sm sm:text-base">{selectedGroup.name}</h3>
//               <p className={`text-[var(--text-secondary)] text-xs sm:text-sm ${theme !== "light" ? "text-blue-100" : "text-slate-800"}`}>
//                 {selectedGroup?.members && selectedGroup?.members.length} Members {
//                   onlineMembersData && onlineMembersData.length > 0 && `(${onlineMembersData.length} Online)`
//                 }
//                 {
//                   sidebarContent === "archive" ? "Archive" : ""
//                 }
//               </p>
//             </div>}
//             {selectedGroup.members.length >1 &&  !selectedGroup.members.find((memId) => memId._id === authUser._id)  &&  <div>
//               <h3
//               className="text-[var(--text-primary)] font-medium capitalize text-sm sm:text-base">{selectedGroup.name}</h3>
//               <p className="text-red-400 text-xs sm:text-sm">
//                Non members can't view group content
//               </p>
//             </div>}
//           </div>
//          {selectedGroup.members.length >1 &&  selectedGroup.members.find((memId) => memId._id === authUser._id)  && <div className="relative flex items-center space-x-2">
//             <button
//               className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
//              // onClick={() => setShowMedia(!showmedia)}
//             >
//               <Search className="size-5" />
//             </button>
//               <button onClick={handleVoiceCall} className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
//               <PhoneIcon className="size-5" />
//             </button>
//             <button onClick={handleVideoCall} className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
//               <VideoIcon className="size-5" />
//             </button>
//             <button
//               className=" p-2.5 hover:bg-[var(--color-primary-hover)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
//               onClick={() => setDropdownOpen(!dropdownOpen)}
//             >
//               <FiMoreVertical className="size-5" />
//             </button>
           
//             {dropdownOpen && (
//               <div className="absolute right-0 top-8 w-48 bg-[var(--bg-secondary)] rounded-lg shadow-lg z-[10000]">
//                 <button
//                   className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
//                   onClick={handleArchiveAction}
//                 >
//                   <IoMdArchive size={16} /> {isArchived ? "Unarchive Chat" : "Archive Chat"}
//                 </button>
//                  <button
//                   className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-slate-700"
//                   >
//                   <MdClearAll size={16} /> Clear Chat
//                 </button>
//                 <button
//                   className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-slate-700"
//                   onClick={handleDeleteChat}
//                 >
//                   <IoMdTrash size={16} /> Delete Chat
//                 </button>
//               </div>
//             )}
           
//           </div>}
//         </>
//       ) : null}
//     </div>
//   );
// }

// export default ChatHeader;