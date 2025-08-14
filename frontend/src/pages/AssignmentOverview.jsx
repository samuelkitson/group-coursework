import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Container, Row, Col, Card, ListGroup, Button, Placeholder } from "react-bootstrap";
import { ChevronRight, PersonBadgeFill } from "react-bootstrap-icons";

import "./style/AssignmentOverview.css";
import PaginatedListGroup from "@/components/PaginatedListGroup";
import api from "@/services/apiMiddleware";
import ClassSkillsChart from "@/features/overview/ClassSkillsChart";
import AdvanceAssignmentStateCard from "@/features/overview/AdvanceAssignmentStateCard";
import { ASSIGNMENT_STATES } from "@/utility/helpers";
import TeamSkillsBarChart from "@/features/overview/TeamSkillsBarChart";
import AssignmentKeyStats from "@/features/overview/AssignmentKeyStats";
import DeleteAssignmentCard from "@/features/overview/DeleteAssignmentCard";
import StaffCheckInStatusCard from "@/features/overview/StaffCheckInStatusCard";
import SkillRatingsChart from "@/features/peerReviews/SkillRatingsChart";
import StudentCheckInStatusCard from "@/features/overview/StudentCheckInStatusCard";
import StaffQuestionnaireStatusCard from "@/features/overview/StaffQuestionnaireStatusCard";
import { components } from "react-select";
import PromptQuestionnaireCard from "@/features/overview/PromptQuestionnaireCard";
import PromptRecordMeetingCard from "@/features/overview/MeetingPreferencesCard";
import PeopleOverviewCard from "@/features/overview/PeopleOverviewCard";

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

const cardSizes = {
  "small": { sm: 6, md: 6, xl: 4 },
  "medium": { sm: 12, md: 6, xl: 4 },
  "large": { sm: 12, md: 12, xl: 6 },
}

const LoadingPlaceholder = () => (
  <Card className="h-100 placeholder-glow">
    <Card.Body>
      <Placeholder as={Card.Title} animation="glow">
        <Placeholder xs={6} />
      </Placeholder>
      <Placeholder as={Card.Text} animation="glow">
        <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={4} />
      </Placeholder>
    </Card.Body>
  </Card>
);

const CardWrapper = ({ size, children }) => {
  const cardSize = cardSizes[size];

  return (
    <Col sm={cardSize["sm"]} md={cardSize["md"]} xl={cardSize["xl"]}>
      <div className="h-100 d-flex flex-column">{children}</div>
    </Col>
  );
};


function AssignmentOverview() {
  const navigate = useNavigate();
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );

  const [loadedCards, setLoadedCards] = useState(null);

  const stateHelpText = () => {
    if (selectedAssignment.role === "student") {
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
    } else if (selectedAssignment.role === "supervisor") {
      switch (selectedAssignment.state) {
        case "pre-allocation":
          return "This assignment has just been created. Please wait for the module team to get everything set up.";
        case "allocation-questions":
          return "The allocation questionnaire for this assignment is now live. Please encourage students to fill this in.";
        case "allocation":
          return "The module team is finalising allocation and creating teams. Check back soon to find out which teams you'll be supervising.";
        case "live":
          return "This assignment is live and students are busy working on it. Keep an eye on their progress using the tools here.";
        case "closed":
          return "This assignment is now closed. Students can no longer make edits.";
        default:
          return "This assignment is in an unknown state. Please ask the module team for help.";
      }
    } else if (selectedAssignment.role === "lecturer") {
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

  /**
   * Defines the dashboard cards that could be displayed. The function
   * attemptLoad should return true when there is a possiblity that the card
   * could be displayed. If it's impossible (e.g. wrong user role), then return
   * false and the card will not be loaded at all.
   */
  const cardDefinitions = [
    {
      id: "staff-advance-state",
      component: AdvanceAssignmentStateCard,
      size: "small",
      attemptLoad: () => selectedAssignment.role === "lecturer",
    },
    {
      id: "staff-questionnaire-status",
      component: StaffQuestionnaireStatusCard,
      size: "small",
      attemptLoad: () => (selectedAssignment.role === "lecturer" && selectedAssignment.state === "allocation-questions" && selectedAssignment?.skills?.length > 0),
    },
    {
      id: "staff-checkin-status",
      component: StaffCheckInStatusCard,
      size: "small",
      attemptLoad: () => selectedAssignment.role === "lecturer",
    },
    {
      id: "staff-delete-assignment",
      component: DeleteAssignmentCard,
      size: "small",
      attemptLoad: () => (selectedAssignment.role === "lecturer" && selectedAssignment.state === "pre-allocation"),
    },
    {
      id: "people-stats-card",
      component: PeopleOverviewCard,
      size: "small",
      attemptLoad: () => (selectedAssignment.role === "lecturer"),
    },
    {
      id: "staff-skills-chart",
      component: ClassSkillsChart,
      size: "large",
      chart: true,
      attemptLoad: () => (["lecturer", "supervisor"].includes(selectedAssignment.role) && selectedAssignment.state !== "pre-allocation"),
    },
    {
      id: "student-questionnaire-reminder",
      component: PromptQuestionnaireCard,
      size: "small",
      attemptLoad: () => (selectedAssignment.role === "student" && selectedAssignment.state === "allocation-questions" && selectedAssignment?.skills?.length > 0),
    },
    {
      id: "student-checkin-status",
      component: StudentCheckInStatusCard,
      size: "small",
      attemptLoad: () => (selectedAssignment.role === "student" && selectedAssignment.state === "live"),
    },
    {
      id: "student-meeting-reminder",
      component: PromptRecordMeetingCard,
      size: "small",
      attemptLoad: () => (selectedAssignment.role === "student" && selectedAssignment.state === "live"),
    },
    {
      id: "student-key-stats",
      component: AssignmentKeyStats,
      size: "medium",
      attemptLoad: () => (selectedAssignment.role === "student" && selectedAssignment.state === "live"),
    },
    {
      id: "student-team-skills",
      component: TeamSkillsBarChart,
      size: "large",
      chart: true,
      attemptLoad: () => (selectedAssignment.role === "student" && selectedAssignment.state === "live"),
    },
  ];

  /**
   * When the page loads (or the selected assignment changes), load all of the
   * cards. For each card in cardDefinitions, it first filters the list to only
   * those where attemptLoad() returns true. Then it loads the data for each
   * card (if needed) and stores this. Once all cards have loaded, loadedCards
   * is updated to cause them to display. isCancelled is used to prevent race
   * conditions.
   */
  useEffect(() => {
    let isCancelled = false;
    const loadCards = async () => {
      const visibleCards = cardDefinitions.filter((card) => card.attemptLoad());
      const results = await Promise.all(
        visibleCards.map(async ({ id, component, size, chart }) => {
          if (component?.loadData) {
            const data = await component.loadData();
            if (data == null) return null;
            return { id, component, data, size, chart };
          }
          return { id, component, data: null, size, chart };
        })
      );
      if (!isCancelled) {
        setLoadedCards(results.filter(Boolean));
      }
    };
    setLoadedCards(null);
    loadCards();
    return () => {
      isCancelled = true;
    };
  }, [selectedAssignment]);

  const statCards = loadedCards?.filter(card => !card?.chart) ?? [];
  const chartCards = loadedCards?.filter(card => card?.chart) ?? [];

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
        <Col xs={0} lg={1}></Col>
        <Col lg={3} sm={12}>
          <h4 className="d-flex align-items-center"><PersonBadgeFill size={18} className="me-2" />Module team</h4>
          {selectedAssignment.lecturers.map((lecturer, index) => (<div key={index}>
            <a href={`mailto:${lecturer.email}?subject=${selectedAssignment.name}`}>
              {lecturer.displayName}
            </a><br />
          </div>))}
        </Col>
      </Row>

      <Container fluid className="mt-4 px-0">
        <Row className="g-3 mb-3">
          {statCards
          ? statCards.map(({ id, component: Component, data, size }) => (
              <CardWrapper key={id} size={size}>
                <Component data={data} />
              </CardWrapper>
            ))
          :
            cardDefinitions
              .filter((card) => card.attemptLoad())
              .map(({ id, size }) => (
                <CardWrapper key={id} size={size}>
                  <LoadingPlaceholder />
                </CardWrapper>
          ))}
        </Row>
        <Row className="g-3">
          {chartCards.map(({ id, component: Component, data, size }) => (
              <CardWrapper key={id} size={size}>
                <Component data={data} />
              </CardWrapper>
            ))
          }
        </Row>
      </Container>
    </>
  );
}

export default AssignmentOverview;
