import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import { FiPhone, FiUsers, FiSettings } from "react-icons/fi";
import { MdUpdate } from "react-icons/md";
import { IoMdArchive, IoMdColorWand } from "react-icons/io";
import { IoArrowBack, IoColorFill, IoColorFilter, IoColorFilterOutline, IoColorPalette } from "react-icons/io5";
import { MessageCircle, SettingsIcon } from "lucide-react";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import RequestsList from "../components/RequestsList";
import SendRequestList from "../components/SendRequestList";
import NotificationsList from "../components/NotificationsList";
import ArchivedChatsList from "../components/ArchivedChatsList";
import GroupJoinRequests from "../components/GroupJoinRequests";
import GroupChatsList from "../components/GroupChatsList";
import Settings from "../components/Settings";
import Status from "../components/Status";
import AddStatusModal from "../components/AddStatusModal";
import { useStatusStore } from "../store/useStatusStore";
import StatusViewer from "../components/StatusViewer";
import { useThemeStore } from "../store/useThemeStore";
import ThemeToggle from "../components/ThemeToggle";
import PrimaryColorPicker from "../components/PrimaryColorPicker";
import AddStatusModalSmall from "../components/ActiveTabSwitch";

function ChatPage() {
  const { mode } = useThemeStore();

  const {
    sidebarContent,
    setShowEmojiPicker,
    setAttached,
    setShowPopup,
    archivedChats,
    getArchivedChats,
    selectedUser,
    selectedGroup,
    setSidebarContent,
    setSelectedUser,
    setSelectedGroup,
    setSearchQuery,
    option,
    setOption,
  } = useChatStore();

  const { authUser, updateProfile, socket } = useAuthStore();
  const { selectedStatusUser, setSelectedStatusUser, showAddModal, setShowAddModal } = useStatusStore();
 const [showColor, setShowColor] = useState(false)
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  // ------------------------------------------------------------------
  // Socket updates for archive / delete
  // ------------------------------------------------------------------
  useEffect(() => {
    getArchivedChats();
    if (!socket) return;

    const handler = ({ userId, isArchived, isDeleted }) => {
      if (isDeleted) {
        setSelectedUser(null);
        setSelectedGroup(null);
        useChatStore.getState().getMyChatPartners();
        useChatStore.getState().getGroupChats();
        useChatStore.getState().getUserGroups();
        getArchivedChats();
      } else if (isArchived) {
        getArchivedChats();
        if (selectedUser?._id === userId || selectedGroup?._id === userId) {
          setSelectedUser(null);
          setSelectedGroup(null);
        }
        useChatStore.getState().getMyChatPartners();
        useChatStore.getState().getUserGroups();
        useChatStore.getState().getGroupChats();
      } else {
        getArchivedChats();
        useChatStore.getState().getMyChatPartners();
        useChatStore.getState().getGroupChats();
        useChatStore.getState().getUserGroups();
      }
    };

    socket.on("chatListUpdate", handler);
    return () => socket.off("chatListUpdate", handler);
  }, [socket, getArchivedChats, selectedUser, selectedGroup, setSelectedUser, setSelectedGroup]);

  // ------------------------------------------------------------------
  // Profile picture upload
  // ------------------------------------------------------------------
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setSelectedImg(base64);
      await updateProfile({ profilePic: base64 });
    };
    reader.readAsDataURL(file);
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className={`relative w-full h-screen overflow-hidden `}>
      <BorderAnimatedContainer>
        <div className="flex w-full h-screen flex-col md:flex-row overflow-hidden">

          {/* ====================== LEFT SIDEBAR ====================== */}
          <div
            onClick={() => { setShowEmojiPicker(false); setAttached(false); }}
            className={`
              ${selectedUser || selectedGroup ? "hidden md:flex" : "flex"}
              flex-shrink-0 flex-col bg-[var(--bg-secondary)] overflow-hidden
               w-full md:w-[21rem] h-[100vh] backdrop-blur-sm flex-shrink-0 flex-col md:flex-row 
            `}
          >

            {/* ---- ICON NAV (desktop) ---- */}
            <ul
              onClick={() => { setOption(""); setShowPopup(false); setSearchQuery(""); }}
              className="bg-[var(--bg-main)]  w-full overflow-hidden md:w-[4rem] p-2 hidden flex-row md:flex-col backdrop-blur-sm justify-between md:flex"
            >
              {/* TOP */}
              <div className="flex flex-col gap-1 mt-3">
                <button title="chats" className={`p-3 rounded-xl ${sidebarContent === "chats"  || sidebarContent === 'archive'? "bg-[var(--color-primary-hover)] text-white" : "hover:bg-[var(--color-primary)] text-[var(--text-primary)]"}`} onClick={() => setSidebarContent("chats")}>
                  <MessageCircle size={20} />
                </button>

                <button title="status" className={`p-3 rounded-xl ${sidebarContent === "status" ? "bg-[var(--color-primary-hover)] text-white" : "hover:bg-[var(--color-primary)] text-[var(--text-primary)]"}`} onClick={() => setSidebarContent("status")}>
                  <MdUpdate size={20} />
                </button>

                <button title="calls" className={`p-3 rounded-xl ${sidebarContent === "calls" ? "bg-[var(--color-primary-hover)] text-white" : "hover:bg-[var(--color-primary)] text-[var(--text-primary)]"}`} onClick={() => setSidebarContent("calls")}>
                  <FiPhone size={20} />
                </button>
              </div>

              {/* BOTTOM */}
              <div className="flex flex-col gap-1 mb-4">
                <button title="contacts" className={`p-3 rounded-xl ${["contacts","send","requests","groups"].includes(sidebarContent) ? "bg-[var(--color-primary-hover)] text-white" : "hover:bg-[var(--color-primary)] text-[var(--text-primary)]"}`} onClick={() => setSidebarContent("contacts")}>
                  <FiUsers size={20} />
                </button>

                <button title="settings" className={`p-3 rounded-xl ${sidebarContent === "settings" ? "bg-[var(--color-primary-hover)] text-white" : "hover:bg-[var(--color-primary)] text-[var(--text-primary)]"}`} onClick={() => setSidebarContent("settings")}>
                  <SettingsIcon size={20} />
                </button>
                <button title="colors" className={`p-2 rounded-xl bg-[var(--bg-secondary)]  text-[var(--text-primary)]`} onClick={() => setShowColor(!showColor)}>
                  <IoColorPalette className="text-[var(--color-primary-hover)]" size={25} />
                </button>

                {/* Theme toggle */}
               <div
                className="flex w-full  py-3 border-t border-[var(--border)]">
                  <ThemeToggle />
                </div>

                {/* Archive badge
                <button title="archive" className={`relative p-3 rounded-xl ${sidebarContent === "archive" ? "bg-[var(--color-primary-hover)] text-white" : "hover:bg-[var(--color-primary)] text-[var(--text-primary)]"}`} onClick={() => setSidebarContent("archive")}>
                  {archivedChats?.length > 0 && (
                    <div className="absolute top-1 right-1 bg-[var(--color-primary-hover)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {archivedChats.length}
                    </div>
                  )}
                  <IoMdArchive size={20} />
                </button> */}

                {/* Avatar */}
                <div className="avatar online mt-2">
                  <button className="size-10 rounded-full overflow-hidden relative group" onClick={() => fileInputRef.current.click()}>
                    <img src={selectedImg || authUser?.profilePic || "/avatar.png"} alt="avatar" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs">Change</span>
                    </div>
                  </button>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
            </ul>

            {/* ---- CONTENT AREA ---- */}
            <div
            onMouseLeave={() => setShowColor(false)}
            className="flex-1 relative flex flex-col overflow-hidden">
              {option === "" && <ProfileHeader />}
              <div onClick={() => setShowPopup(false)} className="flex-1 overflow-y-auto p-4 space-y-2">
              
                {sidebarContent === "chats" && <ChatsList />}
                {sidebarContent === "contacts" && <ContactList />}
                {sidebarContent === "requests" && <RequestsList />}
                {sidebarContent === "notifications" && <NotificationsList />}
                {sidebarContent === "send" && <SendRequestList />}
                {sidebarContent === "groups" && <GroupChatsList />}
                {sidebarContent === "groups" && selectedGroup && <GroupJoinRequests />}
                {sidebarContent === "archive" && <ArchivedChatsList />}
                {sidebarContent === "status" && <Status />}
                {sidebarContent === "settings" && <Settings />}
                 {showAddModal && <AddStatusModalSmall onClose={() => setShowAddModal(false)} />}
                
              </div>
              
            {showColor && <div >
                <PrimaryColorPicker setShowColor={setShowColor} />
              </div>}

              {/* ---- MOBILE BOTTOM NAV ---- */}
              <ul
                onClick={() => { setOption(""); setShowPopup(false); }}
                className="md:hidden flex justify-around p-2 bg-[var(--bg-main)] border-t border-[var(--border)]"
              >
                <button className={`p-3 rounded-xl ${sidebarContent === "chats" ? "bg-[var(--color-primary-hover)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--color-primary)]"}`} onClick={() => setSidebarContent("chats")}>
                  <MessageCircle size={20} />
                </button>
                <button className={`p-3 rounded-xl ${sidebarContent === "status" ? "bg-[var(--color-primary-hover)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--color-primary)]"}`} onClick={() => setSidebarContent("status")}>
                  <MdUpdate size={20} />
                </button>
                <button className={`p-3 rounded-xl ${sidebarContent === "calls" ? "bg-[var(--color-primary-hover)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--color-primary)]"}`} onClick={() => setSidebarContent("calls")}>
                  <FiPhone size={20} />
                </button>
              </ul>
            </div>
          </div>

          {/* ====================== RIGHT CHAT AREA ====================== */}
          <div
            onClick={() => setShowPopup(false)}
            className={`
              ${selectedUser || selectedGroup ? "flex" : "hidden md:flex"}
              flex-1 flex flex-col bg-[var(--bg-main)] overflow-hidden
            `}
          >
            {selectedUser?.roomId || selectedGroup?.roomId ? (
              <ChatContainer />
            ) : (
              <NoConversationPlaceholder />
            )}

            {/* Modals */}
            {showAddModal && <AddStatusModal onClose={() => setShowAddModal(false)} />}
            {selectedStatusUser && <StatusViewer onClose={() => setSelectedStatusUser(null)} />}
          </div>
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;

// import { useEffect, useRef, useState } from "react";
// import { useChatStore } from "../store/useChatStore";
// import { useAuthStore } from "../store/useAuthStore";
// import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
// import ProfileHeader from "../components/ProfileHeader";
// import ActiveTabSwitch from "../components/ActiveTabSwitch";
// import ChatsList from "../components/ChatsList";
// import ContactList from "../components/ContactList";
// import ChatContainer from "../components/ChatContainer";
// import { FiArchive, FiMessageCircle, FiMoon, FiPhone, FiSend, FiSettings, FiSun, FiUsers } from "react-icons/fi";
// import { FaArchive, FaComment, FaUserFriends, FaUserPlus } from "react-icons/fa";
// import { MdUpdate } from "react-icons/md";
// import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
// import { useLocation } from "react-router-dom";
// import RequestsList from "../components/RequestsList";
// import SendRequestList from "../components/SendRequestList";
// import NotificationsList from "../components/NotificationsList";
// import ArchivedChatsList from "../components/ArchivedChatsList";
// import GroupJoinRequests from "../components/GroupJoinRequests";
// import GroupChatsList from "../components/GroupChatsList";
// import { IoMdArchive, IoMdTrash } from "react-icons/io";
// import { IoArrowBack } from "react-icons/io5";
// import { MessageCircle, Moon, SettingsIcon } from "lucide-react";
// import Settings from "../components/Settings";
// import toast from "react-hot-toast";
// import Status from "../components/Status";
// import AddStatusModal from "../components/AddStatusModal";
// import { useStatusStore } from "../store/useStatusStore";
// import StatusViewer from "../components/StatusViewer";
// import { useThemeStore } from "../store/useThemeStore";
// import ThemeToggle from "../components/ThemeToggle";
// import PrimaryColorPicker from "../components/PrimaryColorPicker";

// function ChatPage() {
//   const {mode} = useThemeStore()
//   const { sidebarContent,showEmojiPicker, setShowEmojiPicker, setAttached, showPopup, setShowPopup, archivedChats, getArchivedChats, selectedUser, option, setOption, selectedGroup, setSidebarContent, setSelectedUser, setSelectedGroup, setSearchQuery } = useChatStore();
//   const {theme, setTheme, logout, authUser, updateProfile, socket } = useAuthStore();
//   const [selectedImg, setSelectedImg] = useState(null);
//   const location = useLocation();
//    const [readReceipts, setReadReceipts] = useState(true);
//     const {selectedStatusUser, setSelectedStatusUser, showAddModal, setShowAddModal} = useStatusStore();
   
//   const path = location.pathname;
//   const pathSegment = path.split("/").filter(Boolean)[0] || "";
//   const fileInputRef = useRef(null);
//   useEffect(() => {
//     getArchivedChats();
//     if (socket) {
//       socket.on("chatListUpdate", ({ userId, isArchived, isDeleted }) => {
//         if (isDeleted) {
//           setSelectedUser(null);
//           setSelectedGroup(null);
//           useChatStore.getState().getMyChatPartners();
//           useChatStore.getState().getGroupChats()
// useChatStore.getState().getUserGroups();
//           getArchivedChats();
//         } else if (isArchived) {
//           getArchivedChats();
//           if (selectedUser?._id === userId || selectedGroup?._id === userId) {
//             setSelectedUser(null);
//             setSelectedGroup(null);
//           }
//           useChatStore.getState().getMyChatPartners();
//           useChatStore.getState().getUserGroups();
//           useChatStore.getState().getGroupChats()
//         } else {
//           getArchivedChats();
//            setSelectedUser(selectedUser);
//           setSelectedGroup(selectedGroup);
//           useChatStore.getState().getMyChatPartners();
//           useChatStore.getState().getGroupChats()
//          useChatStore.getState().getUserGroups();
        
//         }
//       });
//       return () => {
//         socket.off("chatListUpdate");
//       };
//     }
//   }, [socket, getArchivedChats, selectedUser, selectedGroup, setSelectedUser, setSelectedGroup]);
// // const [theme, setTheme] = useState(window.localStorage.getItem("theme") || "dark")
// //   useEffect(() => {
// //   const getTheme = window.localStorage.getItem("theme")
// //       setTheme(theme)
// //       toast.success(theme)
// //  },[theme])
//  const toggleTheme = () => {
//      const newTheme = theme === "dark" ? "light" : "dark";
//      setTheme(newTheme);
//      document.documentElement.classList.toggle("dark", newTheme === "dark");
//      window.localStorage.setItem("theme",newTheme )
//      toast.success(`Theme switched to ${newTheme} mode`);
//    };
//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onloadend = async () => {
//       const base64Image = reader.result;
//       setSelectedImg(base64Image);
//       await updateProfile({ profilePic: base64Image });
//     };
//   };
//   return (
//    <div className={`relative w-full h-[100vh] overflow-hidden ${mode === 'light' ? 'light' : ''}`}>
//        <BorderAnimatedContainer>
//         <div className="flex w-full overflow-hidden flex-col md:flex-row h-[100vh]">
//           {/* LEFT SIDE (Sidebar) */}
//           <div
//           onClick={() => { setShowEmojiPicker(false), setAttached(false)}}
//             className={`${
//               selectedUser || selectedGroup ? "hidden md:flex" : "flex"
//             } w-full md:w-[21rem] h-[100vh] ${mode === "light" ? "bg-blue-100" : "bg-slate-800"} backdrop-blur-sm flex-shrink-0 flex-col md:flex-row overflow-hidden`}
//           >
//             <ul
          
//               onClick={() => {setOption(""), setShowPopup(false), setSearchQuery("")}}
//               className={`w-full overflow-hidden md:w-[4rem] p-2 hidden flex-row md:flex-col backdrop-blur-sm justify-between md:flex ${mode === "light" ? "bg-slate-100" : "bg-slate-900"}`}
//             >
//               <div className="TOP pd-4 flex flex-row md:flex-col items-center gap-2 md:gap-0">
//                 <div className="flex flex-row md:flex-col justify-center mt-3 gap-2 text-white">
//                   <a
//                     title="chats"
//                     className={`p-3 cursor-pointer rounded-[10px] ${theme === "light" ? "text-black" : "text-white"} ${
//                       (sidebarContent === "chats") ? "bg-cyan-500" : "hover:bg-cyan-500"
//                     }`}
//                     onClick={() => setSidebarContent("chats")}
//                   >
//                     <li><MessageCircle size={20} /></li>
//                   </a>
//                   <a
//                     title="status"
//                     className={`p-3 cursor-pointer rounded-[10px] ${theme === "light" ? "text-black" : "text-white"} ${
//                       sidebarContent === "status" ? "bg-cyan-500" : "hover:bg-cyan-500"
//                     }`}
//                     onClick={() => setSidebarContent("status")}
//                   >
//                     <li><MdUpdate size={20} /></li>
//                   </a>
//                   <a
//                     title="calls"
//                     className={`p-3 cursor-pointer rounded-[10px] ${theme === "light" ? "text-black" : "text-white"} ${
//                       sidebarContent === "calls" ? "bg-cyan-500" : "hover:bg-cyan-500"
//                     }`}
//                     onClick={() => setSidebarContent("calls")}
//                   >
//                     <li><FiPhone size={20} /></li>
//                   </a>
//                 </div>
//               </div>
//               <div className="BOTTOM flex pt-2 flex-row md:flex-col gap-2 items-center flex-row justify-around">
//                 <a
//                   title="Contacts"
//                   className={`hidden p-3 cursor-pointer ${theme === "light" ? "text-black" : "text-white"} rounded-[10px] ${
//                     (sidebarContent === "contacts" || sidebarContent === "send" || sidebarContent === "requests" || sidebarContent === "groups") ? "bg-cyan-500" : "hover:bg-cyan-500"
//                   } md:block`}
//                   onClick={() => setSidebarContent("contacts")}
//                 >
//                   <li><FiUsers size={20} /></li>
//                 </a>

//                 <a
//                   title="Contacts"
//                   className={`hidden p-3 cursor-pointer ${theme === "light" ? "text-black" : "text-white"} rounded-[10px] ${
//                   theme === "settings"   ? "bg-cyan-500" : "hover:bg-cyan-500"
//                   } md:block`}
//                   onClick={() => setSidebarContent("settings")}
//                >
//                   <li> <SettingsIcon size={20}/>
//                           </li>
//                 </a>
              

//             <div className="flex items-center justify-between p-3 border-t border-[var(--border)]">
//               <ThemeToggle />
//             </div>
            
//                 {/* 
//                                  <label className="relative inline-flex items-center cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={readReceipts}
//                 disabled
//                 onChange={() => {setReadReceipts(!readReceipts); toggleTheme()}}
//                 className="sr-only peer"
//               />
//               <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
//             </label>
//                 <div className="flex absolute z-20 right-0 items-center justify-between p-3 border-t border-[var(--border)]">
//               <PrimaryColorPicker />
//             </div><a
//                   title="Archive Chats"
//                   className={`hidden p-3 cursor-pointer relative text-white rounded-[10px] ${
//                     sidebarContent === "archive" ? "bg-cyan-500" : "hover:bg-cyan-500"
//                   } md:block`}
//                   onClick={() => setSidebarContent("archive")}
//                 >
//                   {archivedChats && archivedChats.length > 0 && (
//                     <div className="absolute top-2 right-0 bg-cyan-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
//                       {archivedChats.length}
//                     </div>
//                   )}
//                   <li><IoMdArchive size={20} /></li>
//                 </a> */}
//                 <div className="hidden flex-col gap-2 items-center mb-4 md:flex">
//                   <div className="avatar online">
//                     <button
//                       className="size-10 rounded-full overflow-hidden relative group"
//                       onClick={() => fileInputRef.current.click()}
//                     >
//                       <img
//                         src={selectedImg || authUser?.profilePic || "/avatar.png"}
//                         alt="User image"
//                         className="size-full object-cover"
//                       />
//                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
//                         <span className="text-white text-xs">Change</span>
//                       </div>
//                     </button>
//                     <input
//                       type="file"
//                       accept="image/*"
//                       ref={fileInputRef}
//                       onChange={handleImageUpload}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </ul>
//             <div className="relative w-full overflow-hidden md:w-[17rem] flex flex-col overflow-y-auto h-[100vh]">
//               {option === "" && <ProfileHeader />}
//               <div
//                onClick={() => setShowPopup(false)}
//                className="bg-transparent overflow-y-auto p-4 space-y-2">
//                 {sidebarContent === "chats" && <ChatsList />}
//                 {sidebarContent === "contacts" && <ContactList />}
//                 {sidebarContent === "requests" && <RequestsList />}
//                 {sidebarContent === "notifications" && <NotificationsList />}
//                 {sidebarContent === "send" && <SendRequestList />}
//                 {sidebarContent === "groups" && <GroupChatsList />}
//                 {sidebarContent === "groups" && selectedGroup && <GroupJoinRequests />}
//                 {sidebarContent === "archive" && <ArchivedChatsList />}
//                 {sidebarContent === "status" && <Status />}
//                {sidebarContent === "settings" && <Settings />}
//               </div>
//               <ul
//                 onClick={() => {setOption(""), setShowPopup(false)}}
//                 className="absolute bottom-0 opacity-1 left-0 z-10 w-full p-2 flex flex-row bg-slate-900 backdrop-blur-sm justify-between md:hidden"
//               >
//                 <div className="w-full flex flex-row justify-between items-center gap-2 text-white">
//                   <a
//                     title="chats"
//                     className={`p-3 cursor-pointer rounded-[10px] ${theme === "light" ? "text-black" : "text-white"} ${
//                       (sidebarContent === "chats" || sidebarContent === "groups") ? "bg-cyan-500" : "hover:bg-cyan-500"
//                     }`}
//                     onClick={() => setSidebarContent("chats")}
//                   >
//                     <li><MessageCircle size={20} /></li>
//                   </a>
//                   <a
//                     title="status"
//                     className={`p-3 cursor-pointer rounded-[10px] ${theme === "light" ? "text-black" : "text-white"} ${
//                       sidebarContent === "status" ? "bg-cyan-500" : "hover:bg-cyan-500"
//                     }`}
//                     onClick={() => setSidebarContent("status")}
//                   >
//                     <li><MdUpdate size={20} /></li>
//                   </a>
//                   <a
//                     title="calls"
//                     className={`p-3 cursor-pointer rounded-[10px] ${theme === "light" ? "text-black" : "text-white"} ${
//                       sidebarContent === "calls" ? "bg-cyan-500" : "hover:bg-cyan-500"
//                     }`}
//                     onClick={() => setSidebarContent("calls")}
//                   >
//                     <li><FiPhone size={20} /></li>
//                   </a>
//                 </div>
//               </ul>
//             </div>
//           </div>
//           {/* RIGHT SIDE (Chat Container) */}
//           <div
//               onClick={() => setShowPopup(false)}
//             className={`${
//               selectedUser || selectedGroup ? "flex" : "hidden md:flex"
//             } w-full flex flex-col ${theme === "light" ? "bg-slate-100" : "bg-slate-900"}  backdrop-blur-sm overflow-hidden`}
//           >

//             {selectedUser?.roomId || selectedGroup?.roomId ? (
//               <>
//                 <ChatContainer />
//               </>
//             ) : (
//               <NoConversationPlaceholder />
//             )}
//             {showAddModal && <AddStatusModal onClose={() => setShowAddModal(false)} />}
//               <div className="w-[90%] h-[90%]">
//                 {selectedStatusUser && <StatusViewer onClose={() => setSelectedStatusUser(null)} />}
//              </div>
             
//           </div>
//         </div>
//       </BorderAnimatedContainer>
//     </div>
//   );
// }
// export default ChatPage;