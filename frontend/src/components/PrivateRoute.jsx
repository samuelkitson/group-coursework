import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { useBoundStore } from "@/store/dataBoundStore";

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const fetchAssignments = useBoundStore((state) => state.fetchAssignments);
  const fetchTeams = useBoundStore((state) => state.fetchTeams);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments();
      fetchTeams();
    }
  }, [location]);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return <Outlet />;
}

export default PrivateRoute;
