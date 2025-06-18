import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <Outlet />;
}

export default PrivateRoute;
