import { useEffect, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound, { NoGroupFound } from "./NoChatsFound";
import { IoMdArchive, IoMdTrash } from "react-icons/io";
import toast from "react-hot-toast";
import { useState } from "react";
import { FaImage, FaVideo, FaFileAudio, FaFile } from "react-icons/fa";
import { useAuthStore } from "../store/useAuthStore";

function GroupChatsList() {
  const {
    getUserGroups,
    groupChats,
    getFilteredChats,
    filteredChats,
    isUsersLoading,
    setSelectedGroup,
    archiveChat,
    setSelectedUser,
    selectedGroup,
    deleteChat,
    sendGroupJoinRequest,
    searchQuery,
    allGroups,
    option,
    setSidebarContent,
  } = useChatStore();
  const { authUser, socket, isOnline, showmedia, setShowMedia  } = useAuthStore(); // SOLUTION: Added socket for join on click
  const [active, setActive] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    
      getUserGroups();
    setLocalSearchQuery(searchQuery);
  }, [getUserGroups, searchQuery]);
  const chatList = useMemo(() => (allGroups), [allGroups]);
  const truncatePar = (word, maxword) => {
    if (!word) return "";
    return word.length <= maxword ? word : word.slice(0, maxword) + "...";
  };
    useEffect(() => {
      if (socket) {
        socket.on("groupCreated", ({ group }) => {
          toast.success("Group created successfully");
         // setSelectedGroup(group);
         // setOption("");
        //  setGroupName("");
        //  setProfilePic(null);
          //setSelectedContacts([]);
       //   setSelectedUser(null);
        });
        socket.on("groupJoinRequestSent", ({ groupId }) => {
          toast.success("Join request sent successfully");
        // setJoinGroupId("");
         // setOption("");
        });
         socket.on("groupJoined", ({ groupId, groupName, roomId }) => {
                  useChatStore.getState().getUserGroups();
                  useChatStore.getState().getGroupJoinRequests(groupId);
                  toast.success(`Joined group: ${groupName}`);
                  socket.emit("join_groups", [roomId]);
                });
        return () => {
          socket.off("groupCreated");
          socket.off("groupJoined");
          socket.off("groupJoinRequestSent");
        };
      }
    }, [socket, setSelectedGroup, setSelectedUser,]);
  //console.log
  const handleJoinRequest = async (joinGroupId) => {

    if (!joinGroupId.trim()) {
      toast.error("Group ID is required");
      return;
    }
    if (!isOnline) {
      queueAction({ type: "sendGroupJoinRequest", groupId: joinGroupId });
      toast.success("Join request queued for when online");
      
      return;
    }
    const toastId = toast.loading("Sending join request...");
    try {
     await sendGroupJoinRequest(joinGroupId);
      toast.dismiss(toastId);
      getUserGroups();
    toast.success("Join request sent successfully");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error.response?.data?.message || "Failed to send join request");
      console.error("Join request error:", error);
    }
  };
  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chatList.filter((contact) =>
    contact.name.toLowerCase().includes(localSearchQuery.toLowerCase().trim())
  // || contact.about.toLowerCase().includes(localSearchQuery.toLowerCase().trim())
  ).length === 0) return <NoGroupFound />;
  return (
    <>
      {chatList && option !== "create" &&
        chatList.filter((contact) =>
    contact.name.toLowerCase().includes(localSearchQuery.toLowerCase().trim()) 
        //|| contact.about.toLowerCase().includes(localSearchQuery.toLowerCase().trim())
  ).map((chat) => (
          <div
            key={chat._id}
            onClick={() => {
              if (socket) {
                // SOLUTION: On clicking a group, join the room to enable real-time updates. This fixes group-specific deviations like no instant chat list updates or message reflections.
                socket.emit("join_groups", [chat._id]);
              }
              if(chat.members.length >1 &&  !chat.members.find((memId) => memId._id === authUser._id)) setShowMedia(false)
              setSelectedGroup({...chat, roomId: chat._id });
             
            }}
            className={` ${
             (selectedGroup && chat._id === selectedGroup._id)
              ? "bg-[var(--color-primary-hover)]"
              : "bg-[var(--bg-main)]"
          }
              px-2 py-4 rounded-lg overflow-hidden cursor-pointer hover:bg-[var(--color-primary)] transition-colors relative`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={chat.profilePic || "/avatar.png"}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div >
                  <h3 
                  style={{color: chat.color}}
                  className="text-sm capitalize font-semibold text-[var(--text-primary)]">{truncatePar(chat.name, 25)}</h3>
             {
                chat.members.length >1 &&  chat.members.find((memId) => memId._id === authUser._id) &&       <p className="text-[var(--text-secondary)] text-sm">{truncatePar(chat.about, 25)}</p>}
                </div>
              
                {
                chat.members.length >1 &&  !chat.members.find((memId) => memId._id === authUser._id) && !chat.joinRequests.find((memId) => memId.userId._id === authUser._id) && <p className="text-red-400 text-xs">Non Members can't view group content</p>
               }
                  {
                chat.members.length > 1 &&  !chat.members.find((memId) => memId._id === authUser._id) && chat.joinRequests.find((memId) => memId.userId._id === authUser._id) &&               
                  <p className="text-[var(--text-secondary)] text-xs">Waiting approval </p> // Modified: Handles both sent
               }
                
              </div>
              {selectedGroup && chat._id === selectedGroup._id && active && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await archiveChat(chat._id);
                        toast.success("Group chat archived");
                        setSidebarContent("archive");
                      } catch (error) {
                        toast.error("Failed to archive group chat");
                      }
                    }}
                    title="Archive Group Chat"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <IoMdArchive />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await deleteChat(chat._id);
                        toast.success("Group chat deleted");
                      } catch (error) {
                        toast.error("Failed to delete group chat");
                      }
                    }}
                    title="Delete Group Chat"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <IoMdTrash />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {chatList && option === "create" && <NoGroupFound/>
        }
    </>
  );
}
export default GroupChatsList;