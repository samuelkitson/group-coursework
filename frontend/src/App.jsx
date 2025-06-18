import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
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

function App() {
  return (
    <Router>
      <Navigation>
        <Container className="mt-4">
          <Routes>
            <Route path="/help" element={<Help />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login/refresh" element={<ResumeLogin />} />
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<AssignmentRoute page="overview" />}>
                <Route
                  path="/assignment/overview"
                  element={<AssignmentOverview />}
                />
              </Route>
              <Route element={<AssignmentRoute page="students" />}>
                <Route
                  path="/assignment/students"
                  element={<AssignmentStudents />}
                />
              </Route>
              <Route element={<AssignmentRoute page="configure" />}>
                <Route
                  path="/assignment/configure"
                  element={<ConfigureAssignment />}
                />
              </Route>
              <Route element={<AssignmentRoute page="allocate" />}>
                <Route
                  path="/assignment/allocate"
                  element={<AllocationControls />}
                />
              </Route>
              <Route element={<AssignmentRoute page="teams" />}>
                <Route
                  path="/assignment/teams"
                  element={<AssignmentTeams />}
                />
              </Route>
              <Route element={<AssignmentRoute page="questionnaire" />}>
                <Route
                  path="/assignment/questionnaire"
                  element={<Questionnaire />}
                />
              </Route>
              <Route element={<AssignmentRoute page="check-in" />}>
                <Route path="/assignment/check-in" element={<CheckIn />} />
              </Route>
              <Route element={<AssignmentRoute page="team" />}>
                <Route path="/assignment/team" element={<MyTeam />} />
              </Route>
              <Route element={<AssignmentRoute page="meetings" />}>
                <Route path="/assignment/meetings" element={<TeamMeetings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Container>
      </Navigation>
    </Router>
  );
}

export default App;
