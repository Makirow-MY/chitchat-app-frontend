import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { NoContactFound } from "./NoChatsFound";
import toast from "react-hot-toast";

function ContactList() {
  const { getAllContacts, allContacts, setSidebarContent, setSelectedUser, isUsersLoading, searchQuery } = useChatStore();
  const { onlineUsers, socket } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  useEffect(() => {
    if (socket) {
      socket.on("friendAdded", ({ friend, privateRoomId }) => {
        set((state) => ({
          allContacts: [...state.allContacts, { ...friend, roomId: privateRoomId }],
        }));
        toast.success(`You are now friends with ${friend.fullName}`);
      });

      socket.on("friendDeleted", ({ userId }) => {
        set((state) => ({
          allContacts: state.allContacts.filter((contact) => contact._id !== userId),
        }));
        toast.success("Friend removed");
      });

      return () => {
        socket.off("friendAdded");
        socket.off("friendDeleted");
      };
    }
  }, [socket]);

  const list = searchQuery
    ? allContacts.filter(
        (contact) =>
          contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allContacts;

  if (list.length === 0) return <NoContactFound />;

  return (
    <>
      {list.map((contact) => (
        <div
          key={contact._id}
          className="bg-[var(--bg-main)]  p-4 rounded-lg cursor-pointer hover:bg-[var(--color-primary-hover)] transition-colors"
          onClick={() => {
            if (socket && contact.roomId) {
              toast.success(contact.roomId)
              // SOLUTION: When selecting a contact to start/open chat, ensure join the private room. This fixes the deviation where chat container doesn't open/load for new chats and enables real-time first-message receipt.
              socket.emit("join_private_rooms", [contact.roomId]);
            }
            setSelectedUser(contact);
            setSidebarContent('chats');
           }}
        >
          <div className="flex items-center gap-3">
            <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : ""}`}>
              <div className="size-10 rounded-full">
                <img src={contact.profilePic || "/avatar.png"} />
              </div>
            </div>
            <div>
              <h4 style={{color: contact.color}} className=" font-semibold text-sm capitalize">{contact.fullName}</h4>
              <p className="text-[var(--text-secondary)] text-sm">{contact.about}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default ContactList;