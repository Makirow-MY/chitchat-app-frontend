import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Loader2 } from "lucide-react";
import PageLoader from "../components/PageLoader";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { checkAuth , authUser} = useAuthStore();
 
  useEffect(() => {
    const handleAuth = async () => {
     
      if (authUser) {
        // User confirmed email → auto login
        await checkAuth(); 
       
        // This will fetch profile and connect realtime
      setTimeout(() => {
         navigate("/", { replace: true });
      }, 3000);
       
      } else {
         window.localStorage.removeItem("userName")
         navigate("/login");
      }
    };

    handleAuth();
  }, [navigate, checkAuth]);

  return <PageLoader />;;
}