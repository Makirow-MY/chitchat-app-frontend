import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
function GroupJoinRequests() {
  const { selectedGroup, groupJoinRequests, getGroupJoinRequests, acceptGroupJoinRequest } = useChatStore();
  const { authUser } = useAuthStore();
  useEffect(() => {
    // Only fetch requests if selectedGroup, its admin, and authUser are defined
    if (
      selectedGroup &&
      selectedGroup.admin &&
      selectedGroup.admin._id &&
      authUser &&
      authUser._id &&
      selectedGroup.admin._id === authUser._id
    ) {
      getGroupJoinRequests(selectedGroup._id);
    }
  }, [selectedGroup, authUser, getGroupJoinRequests]);
  // Render nothing if not admin or no selected group
  if (
    !selectedGroup ||
    !selectedGroup.admin ||
    !selectedGroup.admin._id ||
    !authUser ||
    !authUser._id ||
    selectedGroup.admin._id !== authUser._id
  ) {
    return null;
  }
 
}
export default GroupJoinRequests;