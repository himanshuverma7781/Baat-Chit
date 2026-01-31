import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { logout } from "../lib/api";
import toast from "react-hot-toast";

const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      console.log("✅ Logout successful, clearing queries and redirecting...");

      // Invalidate auth user query to remove cached data
      queryClient.setQueryData(["authUser"], null);

      // Show success message
      toast.success("Logged out successfully");

      // Redirect to login with replace to prevent going back
      console.log("Navigating to /login...");
      navigate("/login", { replace: true });

      // Clear all queries after navigation
      setTimeout(() => {
        queryClient.clear();
      }, 100);
    },
    onError: (error) => {
      console.error("❌ Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    },
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;