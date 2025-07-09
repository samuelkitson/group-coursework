import React, { useEffect, useState } from "react";
import {
  Navbar,
  Nav,
  Dropdown,
  Offcanvas,
  Container,
  Row,
  Col,
  Badge,
  ListGroup,
  Collapse,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  Map,
  People,
  Shuffle,
  PersonVideo3,
  CardChecklist,
  HouseDoor,
  PersonCircle,
  BoxArrowRight,
  InfoCircle,
  Tools,
  PersonCheck,
  ChevronDown,
  ChevronRight,
} from "react-bootstrap-icons";

import { useAuthStore } from "../store/authStore";

import "./style/Navigation.css";
import { useBoundStore } from "@/store/dataBoundStore";
import api from "@/services/apiMiddleware";
import { getAllowedPages } from "@/utility/assignmentPageMapping";

// Extracted navigation menu items to a separate component
function NavigationItems({ isSidebar = false, hideOffcanvas }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const fetchAssignments = useBoundStore((state) => state.fetchAssignments);
  const fetchTeams = useBoundStore((state) => state.fetchTeams);
  const assignments = useBoundStore((state) => state.assignments);
  const setSelectedAssignment = useBoundStore(
    (state) => state.setSelectedAssignment,
  );
  const setTeamByAssignment = useBoundStore(
    (state) => state.setTeamByAssignment,
  );
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const assignmentsActive = assignments.filter(a => a.state !== "closed" || a._id === selectedAssignment?._id);
  const resetDataStores = useBoundStore((state) => state.resetAll);

  useEffect(() => {
    // Fetch assignments when the navbar is first loaded and the user is logged in
    if (isAuthenticated) {
      fetchAssignments();
      fetchTeams();
    }
  }, [fetchAssignments, fetchTeams, user]);

  const logoutAndHide = () => {
    hideOffcanvas();
    api.post(
      "/api/auth/logout",
      {},
      { successToasts: true, sessionErrorToasts: false },
    );
    logout();
    resetDataStores();
    navigate("/login");
  };

  const handleAssignmentChange = (id) => {
    setSelectedAssignment(id);
    setTeamByAssignment(id);
  };

  return (
    <Nav className={isSidebar ? "flex-column p-3 me-5" : "flex-column"}>
      {isAuthenticated ? (
        <>
          <Nav.Link as={Link} to="/dashboard" onClick={hideOffcanvas}>
            <HouseDoor />
            Dashboard
          </Nav.Link>
          <Nav.Link as={Link} to="/profile" onClick={hideOffcanvas}>
            <PersonCircle />
            Profile
          </Nav.Link>

          <div className="border-top my-2"></div>

          {assignmentsActive.length > 0 && (
            <>
            { assignmentsActive.map((assignment) => (
                <div key={assignment._id}>
                  <Nav.Link as={Link} to="/assignment/overview" onClick={() => handleAssignmentChange(assignment._id)}>
                    {assignment.name}
                    {assignment.state === "closed" && " (old)"}
                    {selectedAssignment?._id === assignment._id ? 
                      <ChevronDown size={14} className="ms-2" />
                    : 
                      <ChevronRight size={14} className="ms-2" />
                    }
                  </Nav.Link>
                  <Collapse in={selectedAssignment?._id === assignment._id}>
                    <div>
                    {selectedAssignment &&
                      getAllowedPages(selectedAssignment.state, selectedAssignment.role).map((option, index) => (
                        <Nav.Link
                          as={Link}
                          to={option.link}
                          className="ms-2 ps-4 d-flex align-items-center justify-content-between"
                          onClick={hideOffcanvas}
                          key={index}
                        >
                          <div className="d-flex align-items-center">
                            <option.icon />
                            <span className="ms-2">{option.label}</span>
                          </div>
                          { option.badge && 
                            <Badge className="rounded-pill" bg="danger">1</Badge>
                          }
                        </Nav.Link>
                      ))}
                    </div>
                  </Collapse>
                </div>
            )) }
            <div className="border-top my-2" />
            </>
          )}

          <Nav.Link as={Link} to="/help" onClick={hideOffcanvas}>
            <InfoCircle />
            Help
          </Nav.Link>
          <Nav.Link onClick={logoutAndHide}>
            <BoxArrowRight />
            Logout
          </Nav.Link>
        </>
      ) : (
        <>
          <Nav.Link as={Link} to="/login" onClick={hideOffcanvas}>
            <PersonCircle />
            Login
          </Nav.Link>
          <Nav.Link as={Link} to="/help" onClick={hideOffcanvas}>
            <InfoCircle />
            Help
          </Nav.Link>
        </>
      )}
    </Nav>
  );
}

const Navigation = ({ children }) => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const toggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);
  const hideOffcanvas = () => setShowOffcanvas(false);

  return (
    <>
      {/* Small devices - navbar with button to show full navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" className="d-lg-none">
        <Container>
          <Navbar.Brand href="#">Group Courseworks</Navbar.Brand>
          <Navbar.Toggle
            aria-controls="offcanvas-navbar"
            onClick={toggleOffcanvas}
          />
        </Container>
      </Navbar>

      {/* Large devices - navbar with page site name only */}
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        className="d-none d-lg-block"
      >
        <Container fluid>
          <Navbar.Brand className="ps-3">Group Courseworks</Navbar.Brand>
        </Container>
      </Navbar>

      <Container fluid className=" d-flex flex-column vh-100">
        <Row className="flex-grow-1">
          {/* Large devices - sidebar with navigation, always shown */}
          <Col lg="3" className="d-none d-lg-block bg-light h-100">
            <NavigationItems isSidebar={true} hideOffcanvas={hideOffcanvas} />
          </Col>

          {/* Main content area - expands to fill space left by sidebar */}
          <Col className="p-3">{children}</Col>
        </Row>
      </Container>

      {/* Small devices - separate navigation that slides over the page */}
      <Offcanvas
        show={showOffcanvas}
        onHide={toggleOffcanvas}
        placement="start"
        className="d-lg-none"
        id="sidebar-nav"
      >
        <Offcanvas.Header closeButton />
        <Offcanvas.Body>
          <NavigationItems hideOffcanvas={hideOffcanvas} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Navigation;
