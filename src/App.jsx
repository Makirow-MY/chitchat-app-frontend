import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect, useState } from "react";
import PageLoader from "./components/PageLoader";
import {} from "react-icons";

import { Toaster } from "react-hot-toast";
import { useChatStore } from "./store/useChatStore";
import { useCallStore } from "./store/useCallStore";
import { useThemeStore } from "./store/useThemeStore";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const user =  JSON.parse(window.localStorage.getItem("chitchatUser"));
  const {
    getMyChatPartners,
    chats,
    getFilteredChats,
     getUserGroups,
     getAllContacts,
     getGroupJoinRequests,
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
    allContacts,
    getGroupChats
  } = useChatStore();
  const {initSocket} = useCallStore();
  const [active, setActive] = useState(true);

const { initInitialData, isInitialDataLoading } = useChatStore(); // ← ADD
const { mode, primaryColor, init } = useThemeStore();


  

useEffect(() => {
  init();
}, [init]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser || user) {
      initInitialData();               // ← FIRE ONCE after login/signup
    }
  }, [authUser, initInitialData]);
  setTimeout(() => {
    setActive(false)
  }, 5000);

  //if (isCheckingAuth && active) return <PageLoader />;
if (isCheckingAuth || (isInitialDataLoading && (authUser || user) )) {
    return <PageLoader />;
  }
 
  return (
    <div className="min-h-screen bg-[var(--bg-main)] relative flex items-center justify-center  w-full ">
      {/* DECORATORS - GRID BG & GLOW SHAPES */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />

      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
      </Routes>

      <Toaster />
    </div>
  );
}
export default App;