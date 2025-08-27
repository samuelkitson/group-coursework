import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import { useAuthStore } from "./store/authStore";
import { lazy, useEffect } from "react";
import { useBoundStore } from "./store/dataBoundStore";

import Login from "./pages/Login";
import Navigation from "./components/Navigation";
import AssignmentRoute from "./components/AssignmentRoute";
import PrivateRoute from "./components/PrivateRoute";
import ScrollToTop from "./utility/ScrollToTop";

// Lazy-loaded pages
const Help = lazy(() => import("./pages/Help"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CheckIn = lazy(() => import("./pages/CheckIn"));
const ConfigureAssignment = lazy(() => import("./pages/ConfigureAssignment"));
const AssignmentOverview = lazy(() => import("./pages/AssignmentOverview"));
const AssignmentStudents = lazy(() => import("./pages/AssignmentStudents"));
const Questionnaire = lazy(() => import("./pages/Questionnaire"));
const AllocationControls = lazy(() => import("./pages/AllocationControls"));
const MyTeam = lazy(() => import("./pages/MyTeam"));
const TeamMeetings = lazy(() => import("./pages/TeamMeetings"));
const AssignmentTeams = lazy(() => import("./pages/AssignmentTeams"));
const Profile = lazy(() => import("./pages/Profile"));
const ResumeLogin = lazy(() => import("./pages/ResumeLogin"));
const AssignmentSupervisors = lazy(() => import("./pages/AssignmentSupervisors"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const TeamPeerReviews = lazy(() => import("./pages/TeamPeerReviews"));
const ReportGenerator = lazy(() => import("./pages/ReportGenerator"));
const TeamObservations = lazy(() => import("./pages/TeamObservations"));

function WithNavigation() {
  return (
    <>
      <Navigation>
        <Container className="mx-1 mt-3" fluid>
          <Outlet />
        </Container>
      </Navigation>
    </>
  )
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchAssignments = useBoundStore((state) => state.fetchAssignments);
  const fetchTeams = useBoundStore((state) => state.fetchTeams);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments(true);
      fetchTeams(true);
    }
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login-callback" element={<AuthCallback />} />
        <Route path="/login/refresh" element={<ResumeLogin />} />

        <Route element={<WithNavigation />}>
          <Route element={<PrivateRoute />}>
            <Route path="/help" element={<Help />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/assignment/overview" element={<AssignmentRoute />}>
              <Route index element={<AssignmentOverview />} />
            </Route>
            <Route path="/assignment/students" element={<AssignmentRoute />}>
              <Route index element={<AssignmentStudents />} />
            </Route>
            <Route path="/assignment/supervisors" element={<AssignmentRoute />}>
              <Route index element={<AssignmentSupervisors />} />
            </Route>
            <Route path="/assignment/configure" element={<AssignmentRoute />}>
              <Route index element={<ConfigureAssignment />} />
            </Route>
            <Route path="/assignment/allocate" element={<AssignmentRoute />}>
              <Route index element={<AllocationControls />} />
            </Route>
            <Route path="/assignment/teams" element={<AssignmentRoute />}>
              <Route index element={<AssignmentTeams />} />
            </Route>
            <Route path="/assignment/questionnaire" element={<AssignmentRoute />}>
              <Route index element={<Questionnaire />} />
            </Route>
            <Route path="/assignment/check-in" element={<AssignmentRoute />}>
              <Route index element={<CheckIn />} />
            </Route>
            <Route path="/assignment/team" element={<AssignmentRoute />}>
              <Route index element={<MyTeam />} />
            </Route>
            <Route path="/assignment/meetings" element={<AssignmentRoute />}>
              <Route index element={<TeamMeetings />} />
            </Route>
            <Route path="/assignment/peer-reviews" element={<AssignmentRoute />}>
              <Route index element={<TeamPeerReviews />} />
            </Route>
            <Route path="/assignment/reports" element={<AssignmentRoute />}>
              <Route index element={<ReportGenerator />} />
            </Route>
            <Route path="/assignment/observations" element={<AssignmentRoute />}>
              <Route index element={<TeamObservations />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
