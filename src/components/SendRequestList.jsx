import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { NoUsersFound } from "./NoChatsFound";
import { Send, UserPlusIcon } from "lucide-react";
import toast from "react-hot-toast";
function getRelativeTime(date) {
  const now = new Date();
  const reqDate = new Date(date);
  const diffTime = now - reqDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}
function SendRequestList() {
  const { usersForRequest, searchQuery, setSearchQuery, getUsersForRequest, sendFriendRequest, isUsersLoading, queueAction } = useChatStore();
  const { onlineUsers, socket, isOnline, authUser } = useAuthStore();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  useEffect(() => {
    getUsersForRequest();
  }, [getUsersForRequest]);
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  useEffect(() => {
    if (socket) {
      socket.on("friendRequestSent", ({ userId, requestId }) => {
        useChatStore.getState().updateUserRequestStatus(userId, true, requestId, "pending", new Date());
        toast.success("Friend request sent");
      });
      socket.on("friendRequestAccepted", ({ requestId, user }) => {
        useChatStore.getState().updateUserRequestStatus(user._id, false, requestId, "accepted");
        toast.success(`${user.fullName} accepted your friend request`);
      });
      socket.on("friendRequestDeclined", ({ requestId, user }) => {
        useChatStore.getState().updateUserRequestStatus(user._id, false, requestId, "declined");
        toast.error(`${user.fullName} declined your friend request`);
      });
      // New: Listener for cancelled requests
      socket.on("friendRequestCancelled", ({ requestId, canceller }) => {
        useChatStore.getState().updateUserRequestStatus(canceller._id, false, requestId, null);
        toast.success(`${canceller.fullName} cancelled the friend request`);
      });
      return () => {
        socket.off("friendRequestSent");
        socket.off("friendRequestAccepted");
        socket.off("friendRequestDeclined");
        socket.off("friendRequestCancelled");
      };
    }
  }, [socket]);
  const handleSendRequest = async (userId) => {
    if (!isOnline) {
      queueAction({ type: "sendFriendRequest", userId, senderId: authUser._id });
      toast.success("Friend request queued for when online");
      return;
    }
    try {
      await sendFriendRequest(userId);
    } catch (error) {
      toast.error("Failed to send friend request");
      console.error("Send request error:", error);
    }
  };
  const filteredUsers = usersForRequest ? usersForRequest.filter((contact) =>
    contact?.fullName?.toLowerCase().includes(localSearchQuery.toLowerCase().trim())
  ).sort((a, b) => {
    const aState = a.hasPendingSent || a.hasPendingReceived || a.isDeclinedCooldown ? 1 : 0;
    const bState = b.hasPendingSent || b.hasPendingReceived || b.isDeclinedCooldown ? 1 : 0;
    if (aState !== bState) return aState - bState;
    return a.fullName.localeCompare(b.fullName) ;
  }) : []; // Modified: Sort non-state first alpha, state (pending/declined) last alpha
  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (filteredUsers.length === 0) return <NoUsersFound />;
  return (
    <>
      {filteredUsers.map((user) => (
        <div
          key={user._id}
          className="bg-[var(--bg-main)] p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className={`avatar `}>
              <div className="size-10 rounded-full">
                <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
              </div>
            </div>
            <div>
              <h4
              
              className="text-[var(--text-primary)] font-medium truncate capitalize">{user.fullName}</h4>
              {user.isDeclinedCooldown ? (
                <p className="text-red-400 text-xs">Wait 5 hours • {getRelativeTime(user.declinedAt)}</p> // New: Declined cooldown state
              ) : user.hasPendingSent || user.hasPendingReceived ? (
                <p className="text-[var(--text-secondary)] text-xs">Waiting approval • {getRelativeTime(user.requestSentAt || new Date())}</p> // Modified: Handles both sent/received pending
              ) : (
                <button
                  style={{ fontSize: '14px' }}
                  className="bg-cyan-500/50 p-1 mt-1 font-normal rounded hover:bg-cyan-500/70 text-white"
                  onClick={() => handleSendRequest(user._id)}
                >
                  <Send size={14} className="inline mr-1" /> Befriend
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
export default SendRequestList;