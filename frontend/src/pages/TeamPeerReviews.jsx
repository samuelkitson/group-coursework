import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Col, Container, Dropdown, InputGroup, Placeholder, Row, Spinner } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { format, parseISO } from "date-fns";
import { useBoundStore } from "@/store/dataBoundStore";
import { ArrowLeftShort, CursorFill, GraphUp, QuestionCircleFill } from "react-bootstrap-icons";
import WorkloadBalanceChart from "@/features/peerReviews/WorkloadBalanceChart";
import SkillRatingsChart from "@/features/peerReviews/SkillRatingsChart";
import ReviewComments from "@/features/peerReviews/ReviewComments";
import AllTimeWorkloadChart from "@/features/peerReviews/AllTimeWorkloadChart";

function TeamPeerReviews() {
  const selectedAssignment = useBoundStore((state) => state.getSelectedAssignment());
  const selectedTeam = useBoundStore((state) => state.getSelectedTeam());

  const [peerReviewPoints, setPeerReviewPoints] = useState([]); // Generic details of all previous review points
  const [selectedReviewIndex, setSelectedReviewIndex] = useState(null); // The index of the selected review point
  const [studentOptions, setStudentOptions] = useState([]); // The list of student names for the selected review point
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(null); // The ID of the selected student
  const [currentPeerReview, setCurrentPeerReview] = useState(null); // The full submissions of the selected review point
  const [thresholds, setThresholds] = useState({VERY_LOW: -1.5, LOW: -1, HIGH: 1, VERY_HIGH: 1.5});
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const currentReviewPoint = peerReviewPoints[selectedReviewIndex];
  const currentStudent = studentOptions[selectedStudentIndex];

  const handlePreviousReview = () => {
    if (selectedReviewIndex <= 0) return;
    setSelectedReviewIndex((prevIndex) => prevIndex - 1);
  };
  const handleNextReview = () => {
    if (selectedReviewIndex >= peerReviewPoints.length - 1) return;
    setSelectedReviewIndex((prevIndex) => prevIndex + 1);
  };
  const handleSelectReview = (index) => {
    setSelectedReviewIndex(index)
  };

  const setDefaultStudent = () => {
    // If no student selected, just choose the first one
    if (!selectedStudentIndex) {
      setSelectedStudentIndex(0);
    }
  };
  const handlePreviousStudent = () => {
    if (selectedStudentIndex <= 0) return setSelectedStudentIndex(studentOptions.length - 1);
    setSelectedStudentIndex((prevIndex) => prevIndex - 1);
  };
  const handleNextStudent = () => {
    if (selectedStudentIndex >= studentOptions.length - 1) return setSelectedStudentIndex(0);
    setSelectedStudentIndex((prevIndex) => prevIndex + 1);
  };
  const handleSelectStudent = (index) => {
    setSelectedStudentIndex(index);
  };

  const loadCurrentPeerReview = () => {
    setCurrentPeerReview(null);
    setIsLoading(true);
    if (!currentReviewPoint) return;
    api
      .get(`/api/checkin/response?peerReview=${currentReviewPoint?._id}&team=${selectedTeam._id}`, {genericErrorToasts: false})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setCurrentPeerReview(data);
        const studentOptions = Object.keys(data?.normScores ?? {});
        setStudentOptions(studentOptions);
        setDefaultStudent();
        setThresholds(data.thresholds);
      })
      .catch(() => {
        setCurrentPeerReview(null);
        setSelectedStudentIndex(null);
        setStudentOptions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  const showWorkloadChart = () => {
    setActiveModal("all-time-workload");
  };
  
  const hideModal = () => {
    setActiveModal(null);
  };

  const refreshData = () => {
    setCurrentPeerReview(null);
    setSelectedStudentIndex(null);
    setStudentOptions([]);
    setIsLoading(true);
    // Get the current setup
    api
      .get(`/api/peer-review?assignment=${selectedAssignment._id}&pastOnly=true&ignoreNone=true`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const existing = data?.peerReviews ?? [];
        const formatted = existing.map(p => {
          const startISO = parseISO(p.periodStart) ?? new Date();
          const endISO = parseISO(p.periodEnd) ?? new Date();
          return {...p, periodStart: format(startISO, "dd MMM"), periodEnd: format(endISO, "dd MMM"), };
        });
        setPeerReviewPoints(formatted);
        if (existing.length > 0) {
          setSelectedReviewIndex(existing.length - 1);
        } else {
          setSelectedReviewIndex(0);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedTeam]);
  // Refresh current peer review data when it changes
  useEffect(loadCurrentPeerReview, [selectedReviewIndex]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col xs={12} className="mb-2">
          <Link as={Button} to="/assignment/teams" variant="link" className="p-0 d-flex align-items-center">
            <ArrowLeftShort size="25"/>
            Back to teams overview
          </Link>
        </Col>
        <Col md={9}>
          <h1>Peer reviews (Team {selectedTeam?.teamNumber})</h1>
          <p className="text-muted">
            Monitor and moderate Team {selectedTeam?.teamNumber}'s peer
            reviews and check-ins. You can also add private notes.
          </p>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              className="d-flex align-items-center"
              onClick={showWorkloadChart}
            >
              <GraphUp className="me-2" />Open workload chart
            </Button>
          </div>
        </Col>
      </Row>

      { (peerReviewPoints.length === 0 && !isLoading) &&
        <Card className="my-2">
          <Card.Body>
            <Card.Title className="d-flex align-items-center">
              <QuestionCircleFill className="me-2" /> No data
            </Card.Title>
            <p className="text-muted mb-0">
              Either peer reviews haven't been configured for this assignment,
              or none of them have been completed yet. <br/>
              Peer reviews show up here the day after they close to students.
            </p>
          </Card.Body>
        </Card>
      }

      { peerReviewPoints.length > 0 &&
      <Row className="gy-1">
        <Col xs={12} md={4} xl="auto">
          <p className="text-muted mb-0 mb-md-1">
            Review period:
          </p>
        </Col>
        <Col xs={12} md={8} xl={4}>
          <InputGroup>
            <Button variant="outline-primary" size="sm" onClick={handlePreviousReview}>
              &lt;
            </Button>
            <Dropdown onSelect={(eventKey) => handleSelectReview(parseInt(eventKey))}>
              <Dropdown.Toggle variant="outline-primary" size="sm" className="px-4">
                {`${currentReviewPoint?.periodStart} - ${currentReviewPoint?.periodEnd} (${currentReviewPoint?.type})`}
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow">
                {peerReviewPoints.map((prp, index) => (
                  <Dropdown.Item
                    key={prp._id}
                    eventKey={index}
                    active={index === selectedReviewIndex}
                  >
                    {`${prp?.periodStart} - ${prp?.periodEnd} (${prp?.type})`}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="outline-primary" size="sm" onClick={handleNextReview}>
              &gt;
            </Button>
          </InputGroup>
        </Col>
        <Col xs={12} md={4} xl="auto">
          <p className="text-muted mb-1">
            Team member: 
          </p>
        </Col>
        <Col xs={12} md={8} xl={4}>
          <InputGroup>
            <Button variant="outline-primary" size="sm" onClick={handlePreviousStudent} disabled={!currentPeerReview}>
              &lt;
            </Button>
            <Dropdown onSelect={(eventKey) => handleSelectStudent(parseInt(eventKey))}>
              <Dropdown.Toggle variant="outline-primary" size="sm" className="px-4" disabled={!currentPeerReview}>
                { currentStudent ?? "Select a student" }
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow">
                {studentOptions.map((s, index) => (
                  <Dropdown.Item
                    key={index}
                    eventKey={index}
                    active={index === selectedStudentIndex}
                  >
                    {s}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="outline-primary" size="sm" onClick={handleNextStudent} disabled={!currentPeerReview}>
              &gt;
            </Button>
          </InputGroup>
        </Col>
      </Row>
      }

      { (currentReviewPoint && !currentPeerReview && !isLoading) &&
        <Card className="mt-4 shadow">
          <Card.Body>
            <Card.Title className="d-flex align-items-center">
              <QuestionCircleFill className="me-2" /> No submissions
            </Card.Title>
            <p className="text-muted mb-0">
              None of the students in Team {selectedTeam.teamNumber} completed
              their check-in for the selected week.
            </p>
          </Card.Body>
        </Card>
      }

      { isLoading &&
        <div className="mt-4 d-flex align-items-center text-muted">
          <Spinner className="me-3" />
          Loading...
        </div>
      }

      { currentPeerReview && 
      <Row className="mt-3 gy-3">
        <Col md={8}>
          <ReviewComments
            peerReviewId={currentReviewPoint._id}
            teamId={selectedTeam._id}
            reviewComments={currentPeerReview?.reviewComments}
            currentStudent={currentStudent}
            reloadReview={loadCurrentPeerReview}
          />
        </Col>
        <Col md={4}>
          <WorkloadBalanceChart normScores={currentPeerReview?.normScores} currentStudent={currentStudent} thresholds={thresholds} />
          <SkillRatingsChart skillRatings={currentPeerReview?.skillRatings} currentStudent={currentStudent} />
        </Col>
      </Row>
      }

      <AllTimeWorkloadChart showModal={activeModal === "all-time-workload"} onHide={hideModal} />
    </>
  );
}

export default TeamPeerReviews;
