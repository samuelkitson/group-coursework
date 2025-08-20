import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import { Badge, Button, Card, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { timeOfDayName } from "@/utility/datetimes";

import { Check2All, ChevronRight, ClipboardData, PlusCircleFill, InfoCircle, Question, QuestionCircleFill, RocketTakeoff, Shuffle, Tools, Eyeglasses } from "react-bootstrap-icons";
import { ASSIGNMENT_STATES, extractNameParts } from "@/utility/helpers";

import "./style/Dashboard.css";
import api from "@/services/apiMiddleware";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fetchAssignments = useBoundStore((state) => state.fetchAssignments);
  const assignments = useBoundStore((state) => state.assignments);
  const fetchTeams = useBoundStore((state) => state.fetchTeams);
  const [activeModal, setActiveModal] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentDesc, setNewAssignmentDesc] = useState("");

  const setSelectedAssignment = useBoundStore(
    (state) => state.setSelectedAssignment,
  );
  const setTeamByAssignment = useBoundStore(
    (state) => state.setTeamByAssignment,
  );
  const handleAssignmentChange = (id) => {
    setSelectedAssignment(id);
    setTeamByAssignment(id);
    navigate("/assignment/overview");
  };

  const submitCreateAssignment = () => {
    const submitObj = {
      name: newAssignmentName,
      description: newAssignmentDesc,
    }
    setIsPending(true);
    api
      .post(`/api/assignment/`, submitObj, { successToasts: true, })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setNewAssignmentName("");
        setNewAssignmentDesc("");
        setActiveModal(null);
        // Update assignments list
        fetchAssignments(true);
      }).finally(() => {
        setIsPending(false);
      })
  };

  const [ includeClosed, setIncludeClosed ] = useState(false);
  const includedAssignments = () => includeClosed ? assignments : assignments.filter(a => a.state !== "closed");
  const hasPastAssignments = assignments.some(a => a.state === "closed");

  const getStatusIcon = (status, role) => {
    const currentState = ASSIGNMENT_STATES.find(s => s.id === status) ?? {
      name: "Unknown state",
      icon: Question,
      colour: {student: "dark", supervisor: "dark", lecturer: "dark"}
    };
    return (
      <Badge pill bg={currentState.colour[role]} className="d-inline-flex align-items-center py-2 px-3 fs-5">
        <currentState.icon />
        <span className="fw-normal fs-6 ms-2">
          {currentState.name}
        </span>
      </Badge>
    )
  };

  useEffect(() => {
    // Force update assignment states. This is done using a 500 millisecond
    // max age to stop duplicate refreshes if the Dashboard is the first page to
    // load.
    fetchAssignments(false, 500);
    fetchTeams(false, 500);
  }, []);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col md={9}>
          <h1>Good {timeOfDayName()}, {extractNameParts(user.displayName)}</h1>
          <p className="text-muted">Here's an overview of your current group coursework assignments.</p>
        </Col>
        {(user?.canCreateAssignments) &&
          <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
            <Button
              variant="primary"
              className="d-flex align-items-center"
              onClick={() => setActiveModal("new-assignment")}
            >
              <PlusCircleFill className="me-2" />New assignment
            </Button>
          </Col>
        }
      </Row>
      <Row>
        <Col md={8}>
          {hasPastAssignments &&
            <Form.Check
              type="switch"
              label="Show past assignments"
              checked={includeClosed}
              onChange={(e) => setIncludeClosed(e.target.checked)}
            />
          }
          {includedAssignments().length > 0 ? 
            includedAssignments().map((assignment, index) => (
              <Card className="my-3 clickable-card" key={index}>
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title className="mb-3">{assignment.name}</Card.Title>
                    <p className="text-muted">
                      {assignment.description}
                      {assignment.role === "supervisor" && (
                        <span>
                          <br />
                          <Eyeglasses className="me-1" />
                          You're a supervisor on this assignment.
                        </span>
                      )}
                    </p>
                    {getStatusIcon(assignment.state, assignment.role)}
                  </div>
                  <div>
                    <Button
                      variant="link"
                      size="lg"
                      className="pe-0 stretched-link"
                      onClick={() => handleAssignmentChange(assignment._id)}
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))
          :
          <Card className="my-3">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <QuestionCircleFill className="me-2" /> No assignments
              </Card.Title>
              <p className="text-muted mb-0">
                It doesn't look like you have any assignments at the moment.
                Lucky you!
              </p>
            </Card.Body>
          </Card>
          }
        </Col>
      </Row>

      <Modal
        show={activeModal === "new-assignment"}
        size="lg"
        scrollable
        centered
        onHide={() => setActiveModal(null)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Use this popup to create a new assignment in the system. You'll be
            added as a lecturer on it.
          </p>
          <Form.Group as={Row} className="mb-2 mb-md-3">
            <Form.Label column sm="2">
              Name
            </Form.Label>
            <Col sm="10">
              <Form.Control
                value={newAssignmentName}
                onChange={(e) => setNewAssignmentName(e.target.value)}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} className="mb-2 mb-md-3">
            <Form.Label column sm="2">
              Description
            </Form.Label>
            <Col sm="10">
              <Form.Control
                value={newAssignmentDesc}
                as="textarea"
                onChange={(e) => setNewAssignmentDesc(e.target.value)}
              />
            </Col>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submitCreateAssignment} disabled={isPending || !(newAssignmentName && newAssignmentDesc)}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Dashboard;
