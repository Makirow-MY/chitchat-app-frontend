// src/components/StatusList.jsx
import { useStatusStore } from "../store/useStatusStore";
import { MdUpdate } from "react-icons/md";
import { useAuthStore } from "../store/useAuthStore";
import { formatDistanceToNow } from "date-fns";

export default function StatusList() {
  const { myStatus, statusUpdates, setSelectedStatusUser, setShowAddModal } = useStatusStore();
  const { authUser } = useAuthStore();

  const hasMyStatus = myStatus.length > 0;
  const myLatest = myStatus[0];

  return (
    <div className="space-y-3">
      {/* MY STATUS */}
      <div
        onClick={() =>
          hasMyStatus
            ? setSelectedStatusUser({ user: authUser, statuses: myStatus, hasNew: false })
            : setShowAddModal(true)
        }
        className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-main)] hover:bg-cyan-500/10 cursor-pointer transition"
      >
        <div className="relative">
          <div className="avatar">
            <div
              className={`size-10 rounded-full overflow-hidden ${
                hasMyStatus
                  ? "ring-2 ring-cyan-500 ring-offset-4 ring-offset-[var(--bg-main)]"
                  : "ring-2 ring-slate-600 ring-offset-4 ring-offset-[var(--bg-main)]"
              }`}
            >
              {hasMyStatus ? (
                <StatusPreview status={myLatest} />
              ) : (
                <img
                  className="w-full h-full object-cover"
                  src={authUser.profilePic}
                  alt={authUser.fullName}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-medium text-[var(--text-primary)]">My Status</p>
          <p className="text-xs opacity-70 text-[var(--text-secondary)]">
            {hasMyStatus
              ? `${myStatus.length} update${myStatus.length > 1 ? "s" : ""}`
              : "Tap to add status update"}
          </p>
        </div>
      </div>

      {/* RECENT UPDATES SECTION */}
      {statusUpdates.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-500 px-2 mt-4">
            <MdUpdate />
            <span>Recent updates</span>
          </div>

          {statusUpdates.map((group) => {
            const latestStatus = group.statuses[0];
            const timeAgo = formatDistanceToNow(new Date(latestStatus.createdAt), {
              addSuffix: true,
            });

            return (
              <div
                key={group.user._id}
                onClick={() => setSelectedStatusUser(group)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-cyan-500/10 bg-[var(--bg-main)] cursor-pointer transition"
              >
                <div className="relative">
                  <div className="avatar">
                    <div
                      className={`size-10 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-[var(--bg-main)] ${
                        group.hasNew
                         ? "ring-2 ring-cyan-500 ring-offset-4 ring-offset-[var(--bg-main)]"
                  : "ring-2  ring-slate-600 ring-offset-4"
}`}
                    >
                      <StatusPreview status={latestStatus} />
                    </div>
                  </div>
                 
                </div>
                <div className="flex-1">
                  <p
                    style={{ color: group.user.color }}
                    className="font-medium capitalize"
                  >
                    {group.user.fullName}
                  </p>
                  <p className="text-xs opacity-90 text-[var(--text-secondary)]">{timeAgo}</p>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// MINI PREVIEW COMPONENT
function StatusPreview({ status }) {
  if (!status) return null;

  switch (status.type) {
    case "image":
      return (
        <img
          src={status.content}
          alt="status"
          className="w-full h-full object-cover"
        />
      );

    case "video":
      return (
        <video
          src={status.content}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
        >
          <source src={status.content} />
        </video>
      );

    case "text":
      return (
        <div
          className="w-full h-full flex items-center justify-center text-center p-1 text-xs font-medium"
          style={{
            backgroundColor: status.backgroundColor || "#333",
            color: status.textColor || "#fff",
          }}
        >
          <p className="line-clamp-2 break-all">{status.caption}</p>
        </div>
      );

    case "voice":
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <div className="text-white text-xl">Microphone</div>
        </div>
      );

    default:
      return (
        <img
          src={status.user?.profilePic}
          alt="profile"
          className="w-full h-full object-cover"
        />
      );
  }
}