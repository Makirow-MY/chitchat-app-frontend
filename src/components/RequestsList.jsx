import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { NoRequestFound } from "./NoChatsFound";
import { Trash2 } from "lucide-react";
import { FiX, FiXSquare } from "react-icons/fi";

function RequestsList() {
  const { receivedRequests,searchQuery, sentRequests, allContacts, getAllContacts, getReceivedRequests, getSentRequests, acceptRequest, declineRequest, cancelRequest, isUsersLoading, queueAction } = useChatStore();
  const { onlineUsers, isOnline } = useAuthStore();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  useEffect(() => {
    getAllContacts();
    getReceivedRequests();
    getSentRequests();
    setLocalSearchQuery(searchQuery);
  }, [getAllContacts,searchQuery, getReceivedRequests, getSentRequests]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  const allRequests = [
    ...receivedRequests.map((req) => ({ ...req, type: "received" })),
    ...allContacts.map((contact) => ({ ...contact, type: "friend" })),    
    ...sentRequests.map((req) => ({ ...req, type: "sent" })),
  ].sort((a, b) => {
    const aPending = a.type !== "friend" ? 1 : 0;
    const bPending = b.type !== "friend" ? 1 : 0;
    if (aPending !== bPending) return bPending - aPending;
    if (a.type === "friend") {
      return (a.fullName || "").localeCompare(b.fullName || "");
    }
    return new Date(a.updatedAt) - new Date(b.updatedAt);
  });
    const truncatePar = (word, maxword) => {
    if (!word) return "";
    return word.length <= maxword ? word : word.slice(0, maxword) + "...";
  };

  if (
  allRequests?.length === 0) return <NoRequestFound />;

  return (
    <>
    <p className="text-[var(--text-secondary)] text-sm">See all your friend requests here and actions</p>
      {
allRequests.map((request) => {
        // Determine the nested user object based on type
        const user = request.type === "received" ? request.from :
                    request.type === "sent" ? request.to :
                    request; // For "friend", use request itself

        return (
          <div
            key={request._id}
            className="bg-[var(--bg-main)] p-4 rounded-lg transition-colors flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <div
                className={`avatar `}
              >
                <div className="size-10 rounded-full">
                  <img
                    src={user?.profilePic || "/avatar.png"}
                    alt={user?.fullName || "Unknown"}
                  />
                </div>
              </div>
              <div>
                <h4
                 style={{color: (request.type !== "received" && request.type !== "sent") ? user.color : ""}}
                className="text-[var(--text-primary)] font-medium truncate capitalize">
                  {user?.fullName || "Unknown"}
                </h4>
                { request.type === "received" ? (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => {
                        console.log("isOnline:", isOnline); // Debug
                        if (!isOnline) {
                          queueAction({ type: "acceptRequest", requestId: request._id });
                          return;
                        }
                        acceptRequest(request._id);
                      }}
                      style={{ fontSize: "14px" }}
                      className="bg-green-500/50 p-1 font-normal rounded hover:bg-green-500/70 text-[var(--text-primary)]"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        console.log("isOnline:", isOnline); // Debug
                        if (!isOnline) {
                          queueAction({ type: "declineRequest", requestId: request._id });
                          return;
                        }
                        declineRequest(request._id);
                      }}
                      style={{ fontSize: "14px" }}
                      className="bg-red-500/50 p-1 font-normal rounded hover:bg-red-500/70 text-[var(--text-primary)]"
                    >
                      Decline
                    </button>
                  </div>
                ) : request.type === "friend" ? (
                  <p className="text-[var(--text-secondary)] text-sm">{truncatePar(user.about, 25)}</p>
                ) : request.type === "sent" ? (
                  <button
                    onClick={() => {
                      console.log("isOnline:", isOnline); // Debug
                      if (!isOnline) {
                        queueAction({ type: "cancelRequest", requestId: request._id });
                        return;
                      }
                      cancelRequest(request._id);
                    }}
                    style={{fontSize:'14px'}} 
                  className="flex gap-1 items-center bg-red-500/50 p-1 mt-1 font-normal rounded hover:bg-red-500/70 text-[var(--text-primary)] text-xs"
                >
                  <FiX size={16}/>Remove
                </button> // New: Cancel button for sent pending
              ) :  (
                  <p className="text-[var(--text-secondary)] text-sm">
                    {request.status === "declined" && `${request.status.charAt(0).toUpperCase() + request.status.slice(1)} friend request`}
                    {request.status === "pending" && `waiting approval`}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default RequestsList;


//function RequestsList() {
//   const { receivedRequests, sentRequests, allContacts, getAllContacts, getReceivedRequests, getSentRequests, acceptRequest, declineRequest, cancelRequest, isUsersLoading } = useChatStore(); // Modified: Added allContacts, getAllContacts, cancelRequest
//   const { onlineUsers, isOnline } = useAuthStore();
//   useEffect(() => {
//     getAllContacts(); // Modified: Fetch friends too
//     getReceivedRequests();
//     getSentRequests();
//   }, [getAllContacts, getReceivedRequests, getSentRequests]);
//   if (isUsersLoading) return <UsersLoadingSkeleton />;
//   const allRequests = [
//     ...allContacts.map((contact) => ({ ...contact, type: "friend" })),
//     ...receivedRequests.map((req) => ({ ...req, type: "received" })),
//     ...sentRequests.map((req) => ({ ...req, type: "sent" })),
//   ].sort((a, b) => {
//     const aPending = a.type !== "friend" ? 1 : 0;
//     const bPending = b.type !== "friend" ? 1 : 0;
//     if (aPending !== bPending) return aPending - bPending;
//     if (a.type === "friend") {
//       return (a.fullName || "").localeCompare(b.fullName || "");
//     }
//     return new Date(b.updatedAt) - new Date(a.updatedAt);
//   }); // Modified: Combined friends + pending, sorted friends first alpha (with updatedAt 0 for sort), pending last by time desc
//   if (allRequests.length === 0) return <NoRequestFound />;
//   return (
//     <>
//       {allRequests.map((request) => (
//         <div
//           key={request._id}
//           className="bg-cyan-500/10 p-4 rounded-lg transition-colors flex justify-between items-center"
//         >
//           <div className="flex items-center gap-3">
//             <div className={`avatar`} >
//               <div className="size-10 rounded-full">
//                 <img src={request[request.type === "received" ? "from" : request.type === "sent" ? "to" : ""].profilePic || request.profilePic || "/avatar.png"} alt={request[request.type === "received" ? "from" : request.type === "sent" ? "to" : ""].fullName || request.fullName} />
//               </div>
//             </div>
//             <div>
//             <h4 className="text-[var(--text-secondary)] font-medium truncate capitalize">{request[request.type === "received" ? "from" : request.type === "sent" ? "to" : ""].fullName || request.fullName}</h4>
//             {request.type === "friend" ? (
//               <p className="text-green-400 text-sm">Now friends</p> // New: State for friends
//             ) : request.type === "received" ? (
//               <div className="flex gap-2 mt-1">
//                 <button 
//                   onClick={() => {
//                     if (!isOnline) {
//                       queueAction({ type: "acceptRequest", requestId: request._id });
//                       toast.success("Accept request queued for when online");
//                       return;
//                     }
//                     acceptRequest(request._id);
//                   }} 
//                   style={{fontSize:'14px'}} 
//                   className="bg-green-500/50 p-1 font-normal rounded hover:bg-green-500/70 text-[var(--text-primary)]"
//                 >
//                   Accept
//                 </button>
//                 <button 
//                   onClick={() => {
//                     if (!isOnline) {
//                       queueAction({ type: "declineRequest", requestId: request._id });
//                       toast.success("Decline request queued for when online");
//                       return;
//                     }
//                     declineRequest(request._id);
//                   }} 
//                   style={{fontSize:'14px'}} 
//                   className="bg-red-500/50 p-1 font-normal rounded hover:bg-red-500/70 text-[var(--text-primary)]"
//                 >
//                   Decline
//                 </button>
//               </div>
//             ) : request.type === "sent" ? (
//               <button 
//                 onClick={() => {
//                   if (!isOnline) {
//                     queueAction({ type: "cancelRequest", requestId: request._id });
//                     toast.success("Cancel request queued for when online");
//                     return;
//                   }
//                   cancelRequest(request._id);
//                 }} 
//                 style={{fontSize:'14px'}} 
//                 className="flex items-center bg-red-500/50 p-1 mt-1 font-normal rounded hover:bg-red-500/70 text-[var(--text-primary)]"
//               >
//                 <FiXSquare size={16}/> My Request
//               </button> // New: Cancel button for sent pending
//             ) : (
//               <p className="text-[var(--text-secondary)] text-sm">
//               {request.status === "declined" && `${request.status.charAt(0).toUpperCase() + request.status.slice(1)} friend request`
//               }
//               {request.status === "pending" && `waiting approval`
//               }
//               </p>
//             )}
//                 </div>
//           </div>
       
//         </div>
//       ))}
//     </>
//   );
// }
// export default RequestsList;