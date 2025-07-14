import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Navbar, Container, Nav, Button } from "react-bootstrap";

import Help from "./pages/Help";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Navigation from "./components/Navigation";

import AssignmentRoute from "./components/AssignmentRoute";
import PrivateRoute from "./components/PrivateRoute";
import CheckIn from "./pages/CheckIn";
import ConfigureAssignment from "./pages/ConfigureAssignment";
import AssignmentOverview from "./pages/AssignmentOverview";
import AssignmentStudents from "./pages/AssignmentStudents";
import Questionnaire from "./pages/Questionnaire";
import AllocationControls from "./pages/AllocationControls";
import MyTeam from "./pages/MyTeam";
import TeamMeetings from "./pages/TeamMeetings";
import AssignmentTeams from "./pages/AssignmentTeams";
import Profile from "./pages/Profile";
import ResumeLogin from "./pages/ResumeLogin";
import AssignmentSupervisors from "./pages/AssignmentSupervisors";
import AuthCallback from "./pages/AuthCallback";
import TeamPeerReviews from "./pages/TeamPeerReviews";
import ScrollToTop from "./utility/ScrollToTop";

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
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
