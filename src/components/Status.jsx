// src/components/Status.jsx
import { MdUpdate } from "react-icons/md";
import { useStatusStore } from "../store/useStatusStore";
import StatusList from "./StatusList";
import StatusViewer from "./StatusViewer";
import { useEffect, useState } from "react";
import AddStatusModal from "./AddStatusModal";
import FloatingAddButton from "./FloatingAddButton";
import { useAuthStore } from "../store/useAuthStore";

export default function Status() {
  const {getMyStatus, myStatus,showAddModal, setShowAddModal, getStatusUpdates,setSelectedStatusUser, selectedStatusUser, initializeSocketListeners } = useStatusStore();
 const { onlineUsers, socket, isOnline, authUser } = useAuthStore();
 //const [showAddModal, setShowAddModal] = useState(false);
 //console.log(myStatus,"myStatus") 
 useEffect(() => {
    getStatusUpdates();
    getMyStatus();
    initializeSocketListeners();
  }, []);

  return (
    <div className="h-full overflow-y-auto ">
      <StatusList />
{myStatus && myStatus.length > 0 &&   <FloatingAddButton onClick={() => setShowAddModal(true)} />
}
  </div>
  );
}