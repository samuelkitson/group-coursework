import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Container, Row, Col, Card, ListGroup, Button } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";

import "./style/AssignmentOverview.css";
import PaginatedListGroup from "@/components/PaginatedListGroup";
import api from "@/services/apiMiddleware";
import ClassSkillsChart from "@/features/overview/ClassSkillsChart";
import AdvanceAssignmentStateCard from "@/features/overview/AdvanceAssignmentStateCard";
import { ASSIGNMENT_STATES } from "@/utility/helpers";
import TeamSkillsBarChart from "@/features/overview/TeamSkillsBarChart";
import AssignmentKeyStats from "@/features/overview/AssignmentKeyStats";
import DeleteAssignmentCard from "@/features/overview/DeleteAssignmentCard";

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function AssignmentOverview() {
  const navigate = useNavigate();
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const userRole = useAuthStore((state) => state.user?.role);
  const [studentsList, setStudentsList] = useState([]);

  const stateHelpText = () => {
    if (userRole == "student") {
      switch (selectedAssignment.state) {
        case "pre-allocation":
          return "This assignment has just been set up by your lecturer. They're not quite ready to start the allocation process yet - check back soon.";
        case "allocation-questions":
          return "The allocation questionnaire for this assignment is now live! Please take the time to fill this in accurately as this will improve your groupwork experience.";
        case "allocation":
          return "The allocation questionnaire for this assignment is now closed. Your lecturer is finalising the groups and will confirm them shortly.";
        case "live":
          return "This assignment is live! Time to get working...";
        case "closed":
          return "This assignment is now closed. You can still see the history but can't make edits.";
        default:
          return "This assignment is in an unknown state. Please ask your lecturer for help.";
      }
    } else if (userRole == "lecturer") {
      switch (selectedAssignment.state) {
        case "pre-allocation":
          return "This assignment has just been created. Choose your screening and pre-allocation questions to get started.";
        case "allocation-questions":
          return "The allocation questionnaire for this assignment is now live. You can check on the response rate using the links in the navigation bar.";
        case "allocation":
          return "You've closed the allocation questionnaire for this assignment. Please head over to the allocation page to finalise groups.";
        case "live":
          return "This assignment is live and students are busy working on it. Keep an eye on their progress using the tools here.";
        case "closed":
          return "This assignment is now closed. Students can no longer make edits.";
        default:
          return "This assignment is in an unknown state. Please ask your lecturer for help.";
      }
    } else {
      return "This assignment is in an unknown state. Please ask your lecturer for help.";
    }
  };

  var assignmentStage = ASSIGNMENT_STATES.findIndex(
    (s) => s.id == selectedAssignment.state,
  );

  const goToQuestionnaire = () => {
    navigate("/assignment/questionnaire");
  };

  useEffect(() => {
    if (userRole == "lecturer") {
      setStudentsList([]);
      api
        .get(`/api/assignment/${selectedAssignment._id}/students`)
        .then((resp) => {
          return resp.data;
        })
        .then((data) => {
          setStudentsList(data);
        });
    }
  }, [selectedAssignment]);

  return (
    <>
      <Row className="mb-2">
        <Col lg={8} sm={12}>
          <h1>{selectedAssignment.name}</h1>
          <p className="text-muted">{selectedAssignment.description}</p>
          <div className="progress-bar-wrapper my-4">
            <div className="d-flex justify-content-between flex-fill">
              {ASSIGNMENT_STATES.map((stage, index) => (
                <div
                  key={index}
                  className={`step-item d-flex flex-column ${index == assignmentStage ? "current" : index < assignmentStage ? "completed" : ""}`}
                >
                  <div className="circle-number-wrapper">
                    <div className="circle-number d-flex justify-content-center align-items-center">
                      {index + 1}
                    </div>
                  </div>
                  <span className="step-label text-center text-muted">
                    {stage.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p>{stateHelpText()}</p>
        </Col>
        <Col lg={4} sm={12}>
          <Card>
            <Card.Header>Module Team</Card.Header>
            <ListGroup variant="flush">
              {selectedAssignment.lecturers.map((lecturer, index) => (
                <ListGroup.Item
                  key={index}
                  href={`mailto:${lecturer.email}`}
                  action
                >
                  <span className="fw-bold">{lecturer.displayName}</span>
                  <br />
                  {lecturer.email}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {userRole == "lecturer" && (
        <Row className="mb-2">
          <Col lg={4}>
            <AdvanceAssignmentStateCard />
          </Col>
          {selectedAssignment.state === "pre-allocation" &&
            <Col lg={4}>
              <DeleteAssignmentCard />
            </Col>
          }
          {selectedAssignment.state !== "pre-allocation" &&
          <Col lg={6}>
            <ClassSkillsChart />
          </Col>
          }
        </Row>
      )}

      {userRole == "student" && (
        <Row className="my-2 gy-3">
          { selectedAssignment.state === "allocation-questions" &&
            <Col lg={4}>
              <Card className="p-3 mb-3">
                <Card.Body className="py-0">
                  <h5 className="text-center mb-3">Allocation questionnaire</h5>
                  <Card.Text className="mt-2 text-muted">
                    Click the button below to fill in your skills self-assessment.
                  </Card.Text>
                  <Button
                    variant="primary"
                    className="d-flex align-items-center"
                    onClick={goToQuestionnaire}
                  >
                    Questionnaire
                    <ChevronRight className="ms-2" />
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          }
          { selectedAssignment.state === "live" &&
            <>
              <Col xs={12} md={6}>
                <AssignmentKeyStats />
              </Col>
              <Col xs={12} md={6}>
                <TeamSkillsBarChart />
              </Col>
            </>
          }
        </Row>
      )}
    </>
  );
}

export default AssignmentOverview;
