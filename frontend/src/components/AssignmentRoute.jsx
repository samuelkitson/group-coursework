import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useBoundStore } from "@/store/dataBoundStore";
import { isPageAllowed } from "@/utility/assignmentPageMapping";

function AssignmentRoute({ page }) {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );
  const location = useLocation();
  const path = location.pathname;
  // Redirect to dashboard if no assignment selected
  // if (selectedAssignment == null || page == null)
  //   return <Navigate to="/dashboard" />;
  // Check by state
  const teamSet = selectedTeam != null;
  if (isPageAllowed(path, selectedAssignment.state, selectedAssignment.role, true, teamSet)) {
    // This page is allowed under the current assignment state and role
    return <Outlet />
  } else {
    // Not allowed, so return to the assignment overview page
    if (path === "/assignment/overview") {
      // Shouldn't happen, but fallback to the dashboard if access to the
      // overview page is denied for some reason
      console.warn("Access denied to assignment overview page");
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/assignment/overview" />;
    }
  }
}

export default AssignmentRoute;
