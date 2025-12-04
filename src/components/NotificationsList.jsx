// New file: src/components/NotificationsList.jsx
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { NoNotificationFound } from "./NoChatsFound";
function NotificationsList() {
  const { notifications, getNotifications, isUsersLoading } = useChatStore();
  useEffect(() => {
    getNotifications();
  }, [getNotifications]);
  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (notifications.length === 0) return <NoNotificationFound />;
  return (
    <>
      {notifications.map((notif) => (
        <div key={notif._id} className="bg-[var(--color-primary-hover)] p-4 rounded-lg transition-colors">
          <p className="text-[var(--text-primary)] text-sm mb-3">{notif.message}</p>
          <p className="text-[var(--text-secondary)] text-xs">{new Date(notif.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </>
  );
}
export default NotificationsList;