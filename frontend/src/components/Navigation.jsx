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
  Button,
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
  List,
} from "react-bootstrap-icons";

import { useAuthStore } from "../store/authStore";

import "./style/Navigation.css";
import { useBoundStore } from "@/store/dataBoundStore";
import api from "@/services/apiMiddleware";
import { getAllowedPages } from "@/utility/assignmentPageMapping";

// Extracted navigation menu items to a separate component
function NavigationItems({ isSidebar = false, hideOffcanvas, collapsed = false }) {
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
    <Nav className={isSidebar ? "flex-column p-3 me-5" : "flex-column"} style={{ whiteSpace: 'nowrap' }}>
      <Nav.Link as={Link} to="/dashboard" onClick={hideOffcanvas} className={collapsed ? "text-center px-0" : ""}>
        <HouseDoor />
        {!collapsed && " Dashboard"}
      </Nav.Link>
      <Nav.Link as={Link} to="/profile" onClick={hideOffcanvas} className={collapsed ? "text-center px-0" : ""}>
        <PersonCircle />
        {!collapsed && " Profile"}
      </Nav.Link>

      <div className="border-top my-2" />
        { assignmentsActive.map((assignment) => (
            <div key={assignment._id}>
              {!collapsed &&
                <Nav.Link as={Link} to="/assignment/overview" onClick={() => handleAssignmentChange(assignment._id)}>
                  {assignment.name}
                  {assignment.state === "closed" && " (old)"}
                  {selectedAssignment?._id === assignment._id ? 
                    <ChevronDown size={14} className="ms-2" />
                  : 
                    <ChevronRight size={14} className="ms-2" />
                  }
                </Nav.Link>
              }

              { collapsed ?
              <>
              {selectedAssignment?._id === assignment?._id &&
                getAllowedPages(selectedAssignment.state, selectedAssignment.role).map((option, index) => (
                  <Nav.Link
                    as={Link}
                    to={option.link}
                    className={collapsed ? "text-center px-0" : ""}
                    onClick={hideOffcanvas}
                    key={index}
                  >
                    <option.icon />
                  </Nav.Link>
                ))}
              </>  
              :
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
              }
            </div>
        )) }
      { (selectedAssignment || !collapsed ) &&
        <div className="border-top my-2" />
      }

      <Nav.Link as={Link} to="/help" onClick={hideOffcanvas} className={collapsed ? "text-center px-0" : ""}>
        <InfoCircle />
        {!collapsed && " Help"}
      </Nav.Link>
      { !collapsed &&
      <Nav.Link onClick={logoutAndHide} className={collapsed ? "text-center px-0" : ""}>
        <BoxArrowRight />
        Logout
      </Nav.Link>
      }
    </Nav>
  );
}

const Navigation = ({ children }) => {
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleOffcanvas = () => setShowOffcanvas(!showOffcanvas);
  const hideOffcanvas = () => setShowOffcanvas(false);
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

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

      {/* Large devices - navbar with page site name and toggle button */}
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        className="d-none d-lg-block"
      >
        <Container fluid>
          <div className="d-flex align-items-center">
            <Button
              variant="dark"
              size="sm"
              onClick={toggleSidebar}
              className="ms-1 me-3 border-0"
            >
              <List size={20} />
            </Button>
            <Navbar.Brand>Group Courseworks</Navbar.Brand>
          </div>
        </Container>
      </Navbar>

      <Container fluid className="d-flex flex-column vh-100">
        <Row className="flex-grow-1">
          {/* Large devices - sidebar with navigation, toggleable */}
          <Col 
            lg={sidebarCollapsed ? "1" : "3"} 
            className="d-none d-lg-block bg-light h-100 position-relative"
            style={{ 
              transition: 'all 0.3s ease',
              minWidth: sidebarCollapsed ? '70px' : '250px',
              maxWidth: sidebarCollapsed ? '60px' : '250px',
              overflow: 'hidden'
            }}
          >
            <NavigationItems 
              isSidebar={true} 
              hideOffcanvas={hideOffcanvas} 
              collapsed={sidebarCollapsed}
            />
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
