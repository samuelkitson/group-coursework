import { Navigate, Outlet } from "react-router-dom";
import { useBoundStore } from "@/store/dataBoundStore";

function AssignmentRoute({ page }) {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  // Redirect to dashboard if no assignment selected
  if (selectedAssignment == null || page == null)
    return <Navigate to="/dashboard" />;
  // Check by state
  switch (selectedAssignment.state) {
    case "pre-allocation":
    case "allocation":
      if (!["overview", "configure", "students", "allocate"].includes(page))
        return <Navigate to="/assignment/overview" />;
      break;
    case "allocation-questions":
      if (
        !["overview", "configure", "students", "questionnaire"].includes(page)
      )
        return <Navigate to="/assignment/overview" />;
      break;
    case "live":
      if (
        ![
          "overview",
          "configure",
          "students",
          "team",
          "teams",
          "meetings",
          "check-in",
        ].includes(page)
      )
        return <Navigate to="/assignment/overview" />;
      break;
    case "closed":
      if (
        !["overview", "configure", "students", "team", "teams", "meetings"].includes(
          page,
        )
      )
        return <Navigate to="/assignment/overview" />;
      break;
    default:
      return <Navigate to="/dashboard" />;
  }
  // Route allowed
  return <Outlet />;
}

export default AssignmentRoute;
