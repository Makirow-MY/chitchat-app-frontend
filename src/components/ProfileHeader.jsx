import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon, EllipsisVertical, MessageCircleIcon, MessageCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { FaArrowLeft, FaPeopleCarry, FaPlusSquare, FaSearch, FaUser, FaUserFriends, FaUserPlus } from "react-icons/fa";
import { FiArrowLeft, FiSearch, FiSettings } from "react-icons/fi";
import { IoLogOut, IoSend } from "react-icons/io5";
import { IoMdArchive } from "react-icons/io";
import { MdUpdate } from "react-icons/md";
//import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const bubbles = [
  { delay: 0, x: -40, y: -60, size: 48 },
  { delay: 0.2, x: 50, y: -40, size: 36 },
  { delay: 0.4, x: -60, y: 20, size: 40 },
  { delay: 0.6, x: 30, y: 50, size: 32 },
  { delay: 0.8, x: -20, y: 80, size: 44 },
];

const text = "ChitChat".split("");

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

function ProfileHeader() {
  const { logout, authUser, updateProfile, theme } = useAuthStore();
  const { isSoundEnabled, searchQuery, showPopup, setShowPopup, toggleSound, setOption, sidebarContent, setSidebarContent, setSearchQuery } = useChatStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const title = {
    chats: 'My Chats',
    contacts: 'My Contacts',
    requests: 'Friend Requests',
    send: 'Send Friend Request',
    notifications: 'Notifications',
    groups: "Group Chats",
    status: <div className="flex items-center gap-1"><MdUpdate/> Status Updates </div>,
    settings: "Settings",
    calls: "Call History",
    archive: "Archive Chats",
  }[sidebarContent] || 'Chats';

  const handleToggle = () => {
    mouseClickSound.currentTime = 0;
    mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
    if (sidebarContent === "chats") {
      setSidebarContent("groups");
    } else if (sidebarContent === "groups") {
      setSidebarContent("chats");
    } else if (sidebarContent === "contacts") {
      setSidebarContent("requests");
    }
  };

  return (
    <div className="p-6 pb-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center justify-between gap-3">
               <motion.div
                                className="relative "
                                style={{ perspective: 1000 }}
                              >
                                <div className="relative w-10 h-10">
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-teal-600 rounded-full shadow-2xl"
                                    
                                  //  transition={{ duration: 2, repeat: Infinity }}
                                  />
                                  <div className="absolute inset-2 bg-[var(--bg-main)] rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-10 h-10 text-cyan-400" />
                                  </div>
                                </div>
                              </motion.div>
                        
                              {/* Animated Text */}
                              <div className="flex">
                                {text.map((letter, i) => (
                                  <motion.span
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="text-xl sm:text-2xl font-extrabold"
                                    style={{
                                      background: "linear-gradient(to right, #FAFAF3, #0891B2, #FAFAF3)",
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                    }}
                                  >
                                    {letter === " " ? "\u00A0" : letter}
                                  </motion.span>
                                ))}
                              </div>
        </div>
        <div className="flex gap-4 items-center">
          <button
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>
          <button
            className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors md:hidden"
            onClick={() => {
              setSidebarContent("requests");
              setShowPopup(false);
            }}
          >
            <FaUserPlus className="size-5" />
          </button>
          <button
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => setShowPopup(!showPopup)}
          >
            <EllipsisVertical className="size-5" />
          </button>
        </div>
      </div>

      {sidebarContent !== "settings" && (
        <>
          {showPopup && (
            <div className="absolute top-10 right-0 bg-[var(--bg-card)] backdrop-blur-sm p-4 rounded-lg shadow-lg z-50 border border-[var(--border)]">
              <ul className="flex flex-col gap-2 text-[var(--text-primary)]">
                <li className="p-2 flex text-sm items-center gap-2 hover:bg-[var(--color-primary)]/20 cursor-pointer md:hidden" onClick={() => { setSidebarContent('send'); setShowPopup(false); }}>
                  <IoSend /> Send Request
                </li>
                <li className="p-2 flex text-sm items-center gap-2 hover:bg-[var(--color-primary)]/20 cursor-pointer md:hidden" onClick={() => { setSidebarContent('requests'); setShowPopup(false); }}>
                  <FaUserFriends /> View Requests
                </li>
                <li className="p-2 flex text-sm items-center gap-2 hover:bg-[var(--color-primary)]/20 cursor-pointer" onClick={() => { setSidebarContent('groups'); setOption("create"); setShowPopup(false); }}>
                  <FaPlusSquare /> New Group
                </li>
                <li className="p-2 flex text-sm items-center gap-2 hover:bg-[var(--color-primary)]/20 cursor-pointer" onClick={() => { setSidebarContent('settings'); setShowPopup(false); }}>
                  <FiSettings /> Settings
                </li>
                <li className="p-2 flex text-sm items-center gap-2 hover:bg-[var(--color-primary)]/20 cursor-pointer" onClick={() => { setSidebarContent('archive'); setShowPopup(false); }}>
                  <IoMdArchive /> Archive
                </li>
                <li className="p-2 flex text-sm items-center gap-2 hover:bg-[var(--color-primary)]/20 cursor-pointer" onClick={() => { logout(); setShowPopup(false); }}>
                  <IoLogOut /> Logout
                </li>
              </ul>
            </div>
          )}
          <div className="space-y-2 mt-4">
            <div className="relative w-full p-2 gap-2 flex items-center bg-[var(--bg-main)] bg-opacity-50 rounded-[10px] border border-[var(--border)]">
              <FiSearch className="font-normal text-[var(--text-secondary)]" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none bg-transparent text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                placeholder="Type to search"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-2 gap-3">
        {sidebarContent === "settings" && (
          <button onClick={() => setSidebarContent("chats")} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-primary-light)]">
            <FiArrowLeft className="size-5" />
            Back
          </button>
        )}

        {(sidebarContent !== "contacts" && sidebarContent !== "requests" && sidebarContent !== "send" && sidebarContent !== "archive" && sidebarContent !== "chats" && sidebarContent !== "groups") && (
          <h3 className="font-medium text-base max-w-[180px] truncate p-2 m-2 text-[var(--text-primary)]">
            {title}
          </h3>
        )}

        {(sidebarContent === "chats" || sidebarContent === "archive") && (
          <div className=" ">
            <button onClick={() => setSidebarContent("chats")} className={`tab text-[var(--text-primary)] ${sidebarContent === "chats" ? "tabs  bg-[var(--color-primary)] bg-opacity-50 rounded-md text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              All
            </button>
            <button onClick={() => setSidebarContent("archive")} className={`tab text-[var(--text-primary)] ${sidebarContent === "archive" ?  "tabs  bg-[var(--color-primary)] bg-opacity-50 rounded-md text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              Archive
            </button>
          </div>
        )}

        {(sidebarContent === "contacts" || sidebarContent === "groups") && (
          <div className="tabs">
            <button onClick={() => setSidebarContent("contacts")} className={`tab text-[var(--text-primary)] ${sidebarContent === "contacts" ? "tabs  bg-[var(--color-primary)] bg-opacity-50 rounded-md text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              Contacts
            </button>
            <button onClick={() => setSidebarContent("groups")} className={`tab text-[var(--text-primary)] ${sidebarContent === "groups" ? "tabs  bg-[var(--color-primary)] bg-opacity-50 rounded-md text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              Groups
            </button>
          </div>
        )}

        {sidebarContent === "groups" && (
          <a title="Add Group" className="p-3 cursor-pointer border-3 border-[var(--color-primary)]/20 text-[var(--text-primary)] relative rounded-[10px] hover:bg-[var(--color-primary)]/20" onClick={() => { setSidebarContent('groups'); setOption("create"); setShowPopup(false); }}>
            <FaPlusSquare size={19}/>
          </a>
        )}

        {sidebarContent === "contacts" && (
          <a title="Add Contacts" className="p-3 cursor-pointer border-3 border-[var(--color-primary)]/20 text-[var(--text-primary)] relative rounded-[10px] hover:bg-[var(--color-primary)]/20" onClick={() => setSidebarContent("requests")}>
            <FaUserPlus size={19} />
          </a>
        )}

        {(sidebarContent === "requests" || sidebarContent === "send") && (
          <div className="tabs tabs-boxed bg-transparent">
            <button onClick={() => setSidebarContent("contacts")} className={`tab text-[var(--text-primary)] ${sidebarContent === "contacts" ? "tabs  bg-[var(--color-primary)] bg-opacity-50 rounded-md text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              <FaArrowLeft />
            </button>
            <button onClick={() => setSidebarContent("requests")} className={`tab text-[var(--text-primary)] ${sidebarContent === "requests" ? "tabs  bg-[var(--color-primary)] bg-opacity-50 rounded-md text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              Invites
            </button>
            <button onClick={() => setSidebarContent("send")} className={`tab text-[var(--text-primary)] ${sidebarContent === "send" ? "tabs  bg-[var(--color-primary)] bg-opacity-50 rounded-md text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
              Explore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileHeader;


// import { useState, useRef } from "react";
// import { LogOutIcon, VolumeOffIcon, Volume2Icon, EllipsisVertical, MessageCircleIcon } from "lucide-react";
// import { useAuthStore } from "../store/useAuthStore";
// import { useChatStore } from "../store/useChatStore";
// import { FaArrowLeft, FaPeopleCarry, FaPlusSquare, FaSearch, FaUser, FaUserFriends, FaUserPlus } from "react-icons/fa";
// import { FiArrowLeft, FiSearch, FiSettings } from "react-icons/fi";
// import { IoLogOut, IoSend } from "react-icons/io5";
// import { IoMdArchive } from "react-icons/io";
// import { MdUpdate } from "react-icons/md";

// const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

// function ProfileHeader() {
//   const { logout, authUser, updateProfile, theme } = useAuthStore();
//   const { isSoundEnabled, searchQuery, showPopup, setShowPopup, toggleSound, setOption, sidebarContent, setSidebarContent, setSearchQuery } = useChatStore();
//   const [selectedImg, setSelectedImg] = useState(null);
  
//   const fileInputRef = useRef(null);

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

//   const title = {
//     chats: 'My Chats',
//     contacts: 'My Contacts',
//     requests: 'Friend Requests',
//     send: 'Send Friend Request',
//     notifications: 'Notifications',
//     groups: "Group Chats",
//     status: <div className="flex items-center gap-1"><MdUpdate/> Status Updates </div>,
//     settings: "Settings",
//     calls: "Call History",
//     archive: "Archive Chats",
//   }[sidebarContent] || 'Chats';

//   const handleToggle = () => {
//     mouseClickSound.currentTime = 0;
//     mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
//     if (sidebarContent === "chats") {
//       setSidebarContent("groups");
//     } else if (sidebarContent === "groups") {
//       setSidebarContent("chats");
//     } else if (sidebarContent === "contacts") {
//       setSidebarContent("requests");
//     }
//   };

//   return (
//     <div className="p-6 pb-3 border-b border-slate-700/50">
//       <div className="flex items-center justify-between w-full">
//         <div className="flex items-center justify-between gap-3">
//          <div className="flex items-center justify-center gap-3 mb-4 ">
//                   <div className="w-[2.5rem] h-[2.5rem] flex items-center justify-center p-2   text-slate-100 bg-cyan-600 rounded-full">
//                    <MessageCircleIcon className="w-[2.0rem] h-[2.0rem]" />
//                   </div>
//                   <h1  className="text-cyan-600 text-2xl sm:text-2xl font-bold" style={{
//                     background: "linear-gradient(to right, #FAFAF3FF,#0891B2, #FAFAF3FF",
//                     webkitBackgroundClip: "text",
//                     WebkitTextFillColor: "transparent",
//                   }}>ChitChat</h1>
//                   </div>
//         </div>
//         <div className="flex gap-4 items-center">
//           <button
//             className="text-slate-300 hover:text-slate-200 transition-colors"
//             onClick={() => {
//               mouseClickSound.currentTime = 0;
//               mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
//               toggleSound();
//             }}
//           >
//             {isSoundEnabled ? (
//               <Volume2Icon className="size-5" />
//             ) : (
//               <VolumeOffIcon className="size-5" />
//             )}
//           </button>
//           <button
//             className="block text-slate-300 hover:text-slate-200 transition-colors md:hidden"
//             onClick={() => {
//               setSidebarContent("requests");
//               setShowPopup(false);
//             }}
//           >
//             <FaUserPlus className="size-5" />
//           </button>
//           <button
//             className="text-slate-300 hover:text-slate-200 transition-colors"
//             onClick={() => setShowPopup(!showPopup)}
//           >
//             <EllipsisVertical className="size-5" />
//           </button>
//         </div>
//       </div>
//    {sidebarContent !== "settings" && <>
//       {showPopup && (
//         <div className="absolute top-10 right-0 bg-slate-800 backdrop-blur-sm p-4 rounded-lg shadow-lg z-50">
//           <ul className="flex flex-col gap-2 text-slate-200">
//             <li
//               className="p-2 flex text-sm items-center gap-2 hover:bg-cyan-500/20 cursor-pointer md:hidden"
//               onClick={() => { setSidebarContent('send'); setShowPopup(false); }}
//             >
//               <IoSend /> Send Request
//             </li>
//             <li
//               className="p-2 flex text-sm items-center gap-2 hover:bg-cyan-500/20 cursor-pointer md:hidden"
//               onClick={() => { setSidebarContent('requests'); setShowPopup(false); }}
//             >
//               <FaUserFriends /> View Requests
//             </li>
//             <li
//               className="p-2 flex text-sm items-center gap-2 hover:bg-cyan-500/20 cursor-pointer"
//               onClick={() => { setSidebarContent('groups'); setOption("create"); setShowPopup(false); }}
//             >
//               <FaPlusSquare /> New Group
//             </li>
//             <li
//               className="p-2 flex text-sm items-center gap-2 hover:bg-cyan-500/20 cursor-pointer"
//               onClick={() => { setSidebarContent('settings'); setShowPopup(false); }}
//             >
//               <FiSettings /> Settings
//             </li>
//             <li
//               className="p-2 flex text-sm items-center gap-2 hover:bg-cyan-500/20 cursor-pointer"
//               onClick={() => { setSidebarContent('archive'); setShowPopup(false); }}
//             >
//               <IoMdArchive /> Archive
//             </li>
//             <li
//               className="p-2 flex text-sm items-center gap-2 hover:bg-cyan-500/20 cursor-pointer"
//               onClick={() => { logout(); setShowPopup(false); }}
//             >
//               <IoLogOut /> Logout
//             </li>
//           </ul>
//         </div>
//       )}
//       <div className="space-y-2 mt-4">
//         <div className={`relative w-full p-2 gap-2 flex items-center ${theme === "light" ? "bg-slate-100" : "bg-slate-900"} rounded-[10px] `}>
//           <FiSearch className={` font-normal  ${theme !== "light" ? "text-blue-100" : "text-slate-800 "} `} size={18} />
//           <input
//             type="text"

//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className={`w-full outline-none bg-transparent ${theme !== "light" ? "text-blue-100" : "text-slate-800 "}`}
//             placeholder="Type to search"
//           />
//         </div>
//       </div>
//       </>}
//       <div className="flex items-center justify-between mt-2 gap-3">
//         {sidebarContent === "settings" &&  <button
//                 onClick={() => setSidebarContent("chats")}
//                 className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"
//               >
//                 <FiArrowLeft className="size-5" />
//                 Back
//               </button>}
        
//         {
//           (sidebarContent !== "contacts" && sidebarContent !== "requests" && sidebarContent !== "send"  && sidebarContent !== "archive" && sidebarContent !== "chats" && sidebarContent !== "groups") && (
//             <h3 className={`  ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}   font-medium text-base max-w-[180px] truncate p-2 m-2"`}>
//               {title}
//             </h3>
//           )
//         }
//         {
//           (sidebarContent === "chats"  || sidebarContent === "archive") && (
//             <div className="tabs tabs-boxed bg-transparent ">
//               <button
//                 onClick={() => setSidebarContent("chats")}
//                 className={`tab ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  ${
//                   sidebarContent === "chats" ? `bg-cyan-500/20 text-cyan-400` : "text-slate-300"
//                 }`}
//               >
//               All
//               </button>
              
//               <button
//                 onClick={() => setSidebarContent("archive")}
//                 className={`tab ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  ${
//                   sidebarContent === "archive" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300"
//                 }`}
//               >
//                 Archive
//               </button>
//             </div>
//           )
//         }
//         {
//           (sidebarContent === "contacts" || sidebarContent === "groups" || sidebarContent === "archive") && (
//             <div className="tabs tabs-boxed bg-transparent  ">
//               <button
//                 onClick={() => setSidebarContent("contacts")}
//                 className={`tab ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  ${
//                   sidebarContent === "contacts" ? `bg-cyan-500/20 text-cyan-400` : "text-slate-300"
//                 }`}
//               >
//             Contacts
//               </button>
//               <button
//                 onClick={() => setSidebarContent("groups")}
//                 className={`tab ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  ${
//                   sidebarContent === "groups" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300"
//                 }`}
//               >
//                 Groups
//               </button>
              
//             </div>
//           )
//         }
//          {
//           sidebarContent === "groups" && (
//             <a
//               title="Add Group"
//               className={`p-3 cursor-pointer border-3 border-cyan-500/20 ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  relative text-[var(--text-primary)] rounded-[10px] ${
//                 sidebarContent === "requests" ? "bg-cyan-500/20" : "hover:bg-cyan-500/20"
//               }`}
//                onClick={() => { setSidebarContent('groups'); setOption("create"); setShowPopup(false); }}
//             >
//               <FaPlusSquare size={19}/>
//             </a>
//           )
//         }
//         {
//           sidebarContent === "contacts" && (
//             <a
//               title="Add Contacts"
//               className={`p-3 cursor-pointer border-3 border-cyan-500/20 ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  relative text-[var(--text-primary)] rounded-[10px] ${
//                 sidebarContent === "requests" ? "bg-cyan-500/20" : "hover:bg-cyan-500/20"
//               }`}
//               onClick={() => setSidebarContent("requests")}
//             >
//               <FaUserPlus size={19} />
//             </a>
//           )
//         }
//         {
//           (sidebarContent === "requests" || sidebarContent === "send") && (
//             <div className="tabs tabs-boxed bg-transparent">
//               <button
//                 onClick={() => setSidebarContent("contacts")}
//                 className={`tab ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  ${
//                   sidebarContent === "contacts" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300"
//                 }`}
//               >
//                 <FaArrowLeft />
//               </button>
//               <button
//                 onClick={() => setSidebarContent("requests")}
//                 className={`tab ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  ${
//                   sidebarContent === "requests" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300"
//                 }`}
//               >
//                 Invites
//               </button>
//               <button
//                 onClick={() => setSidebarContent("send")}
//                 className={`tab ${theme === "light" ? "text-black" : "text-[var(--text-primary)]"}  ${
//                   sidebarContent === "send" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300"
//                 }`}
//               >
//                Explore
//               </button>
//             </div>
//           )
//         }
//       </div>
//     </div>
//   );
// }

// export default ProfileHeader;