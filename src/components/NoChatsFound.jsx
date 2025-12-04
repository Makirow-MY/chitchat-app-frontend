import { useChatStore } from "../store/useChatStore";
import { LucideMessageSquareOff, LucideMailX, LucideArchiveX, LucideBellOff, LucideMessageCircle, LucideMessageCircleOff, MessageCircleIcon, UsersIcon, SearchIcon, CheckIcon, ArrowRightIcon, UploadIcon, ArrowLeftIcon } from "lucide-react";
import { FaArrowRight, FaArrowLeft, FaCheck, FaSearch, FaUpload, FaUserSlash, FaUsersSlash } from "react-icons/fa";

import randomColor from "randomcolor";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiMessageCircle } from "react-icons/fi";
import { useAuthStore } from "../store/useAuthStore";

function NoChatsFound() {
  const { setSidebarContent } = useChatStore();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
        <LucideMessageCircleOff className="w-8 h-8 text-[var(--text-primary)]" />
      </div>
      <div>
        <h4 className="text-[var(--text-primary)] font-medium mb-1">No Conversations Available</h4>
        <p className="text-[var(--text-secondary)] text-sm px-6">
          Initiate a conversation by selecting a contact from the contacts section.
        </p>
      </div>
      <button
        onClick={() => setSidebarContent("contacts")}
        className="px-4 py-2 text-sm text-[var(--text-primary)] bg-[var(--color-primary-hover)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Browse Contacts
      </button>
    </div>
  );
}

function NoContactFound() {
  const { setSidebarContent } = useChatStore();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
        <FaUserSlash className="w-8 h-8 text-[var(--text-primary)]" />
      </div>
      <div>
        <h4 className="text-[var(--text-primary)] font-medium mb-1">No Contacts Available</h4>
        <p className="text-[var(--text-secondary)] text-sm px-6">
          Build your network by sending or accepting connection requests.
        </p>
      </div>
      <button
        onClick={() => setSidebarContent("requests")}
        className="px-4 py-2 text-sm text-[var(--text-primary)] bg-[var(--color-primary-hover)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        View Connection Requests
      </button>
    </div>
  );
}

function NoRequestFound() {
  const { setSidebarContent } = useChatStore();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
        <LucideMailX className="w-8 h-8 text-[var(--text-primary)]" />
      </div>
      <div>
        <h4 className="text-[var(--text-primary)] font-medium mb-1">No Pending Requests</h4>
        <p className="text-[var(--text-secondary)] text-sm px-6">
          Start connecting by sending requests to other users.
        </p>
      </div>
      <button
        onClick={() => setSidebarContent("send")}
        className="px-4 py-2 text-sm text-[var(--text-primary)] bg-[var(--color-primary-hover)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Send Connection Requests
      </button>
    </div>
  );
}

function NoUsersFound() {
  const { setSidebarContent } = useChatStore();
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
        <FaUsersSlash className="w-8 h-8 text-[var(--text-primary)]" />
      </div>
      <div>
        <h4 className="text-[var(--text-primary)] font-medium mb-1">No Available Users</h4>
        <p className="text-[var(--text-secondary)] text-sm px-6">
          Connect with users worldwide to grow your network.
        </p>
      </div>
    </div>
  );
}

function NoNotificationFound() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
        <LucideBellOff className="w-8 h-8 text-[var(--text-primary)]" />
      </div>
      <div>
        <h4 className="text-[var(--text-primary)] font-medium mb-1">No Notifications Available</h4>
        <p className="text-[var(--text-secondary)] text-sm px-6">
          Notifications will appear here when relevant activities occur.
        </p>
      </div>
    </div>
  );
}

function NoArchiveChatFound() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
      <div className="w-16 h-16 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
        <LucideArchiveX className="w-8 h-8 text-[var(--text-primary)]" />
      </div>
      <div>
        <h4 className="text-[var(--text-primary)] font-medium mb-1">No Archived Conversations</h4>
        <p className="text-[var(--text-secondary)] text-sm px-6">
          Archived conversations will be displayed here once archived.
        </p>
      </div>
    </div>
  );
}


function NoGroupFound() {
  const { groupChats, setSelectedUser, allContacts, setOption, option, getAllContacts, getUserGroups, setSelectedGroup, createGroup, sendGroupJoinRequest, isUsersLoading, queueAction } = useChatStore();
  const { authUser, isOnline, socket } = useAuthStore();
  const [searchGroupName, setSearchGroupName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [joinGroupId, setJoinGroupId] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const fileInputRef = useRef(null);
  const [showDetail, setShowDetails] = useState(false)

  useEffect(() => {
    if (option === "create" && allContacts.length === 0) {
      getAllContacts();
      getUserGroups();
    }
  }, [option, allContacts.length, getAllContacts, getUserGroups]);

  useEffect(() => {
    if (socket) {
      socket.on("groupCreated", ({ group }) => {
        toast.success("Group created successfully");
        setSelectedGroup(group);
        setOption("");
        setGroupName("");
        setProfilePic(null);
        setSelectedContacts([]);
        setSelectedUser(null);
      });
      socket.on("groupJoinRequestSent", ({ groupId }) => {
        toast.success("Join request sent successfully");
        setJoinGroupId("");
        setOption("");
      });
      return () => {
        socket.off("groupCreated");
        socket.off("groupJoinRequestSent");
      };
    }
  }, [socket, setSelectedGroup, setSelectedUser, setOption]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setProfilePic(reader.result);
    };
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedContacts.length === 0) {
      toast.error("Group name and at least one member are required");
      return;
    }
    if (!isOnline) {
      queueAction({ type: "createGroup", data: { name: groupName, members: selectedContacts, profilePic } });
      toast.success("Group creation queued for when online");
      setGroupName("");
      setProfilePic(null);
      setSelectedContacts([]);
      setOption("");
      return;
    }
    const toastId = toast.loading("Creating Group...");
    try {
      const res = await createGroup({ name: groupName.trim(), members: selectedContacts, profilePic, color: randomColor({
            luminosity: 'bright',
            format: 'hex',
          })
         });
      setGroupName("");
      setProfilePic(null);
      setSelectedContacts([]);
      setOption("");
      setSelectedUser(null);
      setSelectedGroup({...setSelectedGroup , roomId: setSelectedGroup?._id.toString()});
      toast.dismiss(toastId);
      toast.success("Group created successfully");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Failed to create group");
      console.error("Create group error:", error);
    }
  };

  const handleJoinRequest = async (e) => {
    e.preventDefault();
    if (!joinGroupId.trim()) {
      toast.error("Group ID is required");
      return;
    }
    if (!isOnline) {
      queueAction({ type: "sendGroupJoinRequest", groupId: joinGroupId });
      toast.success("Join request queued for when online");
      setJoinGroupId("");
      setOption("");
      return;
    }
    const toastId = toast.loading("Sending join request...");
    try {
      await sendGroupJoinRequest(joinGroupId.trim());
      setJoinGroupId("");
      setOption("");
      toast.dismiss(toastId);
      toast.success("Join request sent successfully");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Failed to send join request");
      console.error("Join request error:", error);
    }
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const filteredContacts = allContacts.filter(
    (contact) =>
      !groupChats.some((group) => group.members.includes(contact._id) && group.terminated) &&
      (contact.fullName.toLowerCase().trim().includes(searchGroupName.toLowerCase().trim()) ||
        contact.email.toLowerCase().trim().includes(searchGroupName.toLowerCase().trim()))
  );

  return (
    <div className="flex flex-col items-center  text-center p-0 h-[100vh] overflow-hidden">
      {option === "" && (
        <>
          <div className="w-16 h-16 bg-[var(--color-primary-hover)] rounded-full flex items-center justify-center">
            <UsersIcon className="w-8 h-8 text-[var(--text-primary)]" />
          </div>
          <div>
            <h4 className="text-[var(--text-primary)] font-medium mb-1">No Groups Available</h4>
            <p className="text-[var(--text-secondary)] text-sm px-6">
              Groups you create or join will appear here.
            </p>
          </div>
         
        </>
      )}
      {option === "create" && (
        <>
        {
           showDetail === false &&   <div className="w-full space-y-4 mt-2 ">
          <h3 className="text-[var(--text-primary)] text-left font-medium text-base">Create New Group</h3>
          <form className="flex flex-col space-y-2 pt-1">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
              <input
                type="text"
                value={searchGroupName}
                onChange={(e) => setSearchGroupName(e.target.value)}
                className="input-search w-full p-2 bg-slate-700/50 rounded-[10px] text-[var(--text-primary)]"
                placeholder="Search Contacts"
              />
            </div>
            <p className="text-sm text-[var(--text-primary)] pt-2 w-full text-left">
              Select members to include in this group.
              {selectedContacts.length > 0 && (
                <span className="block text-[var(--text-secondary)] text-center pt-2">
                  {selectedContacts.length} of {filteredContacts.length} selected
                </span>
              )}
            </p>
            <div className="space-y-2 max-h-[100vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
              {isUsersLoading ? (
                <p className="text-[var(--text-secondary)] text-center">Loading contacts...</p>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                    onClick={() => toggleContactSelection(contact._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="avatar relative">
                        <div className="w-10 rounded-full">
                          <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
                        </div>
                        {selectedContacts.includes(contact._id) && (
                          <div className="bg-[var(--color-primary)] rounded-full p-0.5 absolute bottom-0 left-0 z-30">
                            <CheckIcon size={12} className="text-[var(--text-primary)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-start items-start">
                        <h4 className="text-[var(--text-primary)] font-medium capitalize truncate max-w-[150px]">{contact.fullName}</h4>
                        <p className="text-[var(--text-secondary)] text-sm text-left truncate max-w-[150px]">{contact.about || "No status"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] text-center">No contacts available</p>
              )}
            </div>
            {selectedContacts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="fixed bottom-4 right-4 bg-[var(--color-primary)] text-[var(--text-primary)] rounded-full p-3 hover:bg-[var(--color-primary)] transition-colors"
              >
                <ArrowRightIcon size={20} />
              </button>
            )}
          </form>
        </div>
        }
      

        {showDetail === true && (
        <div className="w-full space-y-4">
          <h2 className="text-[var(--text-primary)] text-sm text-left font-medium pb-4">Group Details</h2>
          <form className="flex flex-col space-y-2">
            <div className="flex gap-2 flex-row-reverse w-full">
              <div className="flex flex-col space-y-2">
                <textarea
                  value={groupName.slice(0, 25)}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className="w-full bg-[var(--bg-main)] text-[var(--text-primary)] rounded-lg p-2 text-sm resize-none"
                  rows={2}
                />
              </div>
              <div className="avatar">
                <button
                  className="size-12 rounded-full overflow-hidden relative group"
                  onClick={(e) => {
                    fileInputRef.current.click();
                    e.preventDefault();
                  }}
                >
                  <img
                    src={profilePic || "/avatar.png"}
                    alt="group image"
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <UploadIcon size={16} className="text-[var(--text-primary)]" />
                  </div>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="space-y-2 max-h-[80vh] overflow-y-auto pt-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
              <h3 className="text-[var(--text-primary)] text-sm font-bold">{selectedContacts.length} Selected Members</h3>
              {selectedContacts.length > 0 ? (
                selectedContacts.map((contactId) => {
                  const contact = allContacts.find((c) => c._id === contactId);
                  return contact ? (
                    <div
                      key={contact._id}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-slate-800/50"
                    >
                      <div className="avatar">
                        <div className="w-10 rounded-full">
                          <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
                        </div>
                      </div>
                      <div className="flex flex-col justify-start items-start">
                        <h4 className="text-[var(--text-primary)] font-medium capitalize truncate max-w-[150px]">{contact.fullName}</h4>
                        <p className="text-[var(--text-secondary)] text-sm text-left truncate max-w-[150px]">{contact.about || "No status"}</p>
                      </div>
                    </div>
                  ) : null;
                })
              ) : (
                <p className="text-[var(--text-secondary)] text-center">No members selected</p>
              )}
            </div>
            <div className="fixed bottom-4 left-4 right-4 flex justify-between">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="bg-slate-700 text-[var(--text-primary)] rounded-full p-3 hover:bg-slate-600 transition-colors"
              >
                <ArrowLeftIcon size={20} />
              </button>
              <button
                type="button"
                onClick={handleCreateGroup}
                className="bg-[var(--color-primary)] text-[var(--text-primary)] rounded-full p-3 hover:bg-[var(--color-primary)] transition-colors"
              >
                <CheckIcon size={20} />
              </button>
            </div>
          </form>
        </div>
        )}
        </>
        
      )}
      <></>
      
    
    </div>
  );
}

export default NoChatsFound;
export { NoContactFound, NoRequestFound, NoUsersFound, NoNotificationFound, NoArchiveChatFound as NoArchiveFound, NoGroupFound };