import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Col, Container, Dropdown, InputGroup, Row } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { format, parseISO } from "date-fns";
import { useBoundStore } from "@/store/dataBoundStore";
import { ArrowLeftShort, CursorFill, QuestionCircleFill } from "react-bootstrap-icons";

function TeamPeerReviews() {
  const selectedAssignment = useBoundStore((state) => state.getSelectedAssignment());
  const selectedTeam = useBoundStore((state) => state.getSelectedTeam());

  const [peerReviewPoints, setPeerReviewPoints] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPeerReview, setCurrentPeerReview] = useState(null);
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentOption = peerReviewPoints[selectedIndex];
  const currentStudent = studentOptions[selectedStudentIndex];

  const handlePrevious = () => {
    if (selectedIndex <= 0) return;
    setSelectedIndex((prevIndex) => prevIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex >= peerReviewPoints.length - 1) return;
    setSelectedIndex((prevIndex) => prevIndex + 1);
  };

  const handleSelectOption = (index) => {
    setSelectedIndex(index);
  };

  const handleSelectStudent = (index) => {
    setSelectedStudentIndex(index);
  };

  const loadCurrentPeerReview = () => {
    setCurrentPeerReview(null);
    setIsLoading(true);
    if (!currentOption) return;
    api
      .get(`/api/checkin/response?peerReview=${currentOption?._id}&team=${selectedTeam._id}`, {genericErrorToasts: false})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setCurrentPeerReview(data);
        const studentOptions = Object.keys(data?.netScores ?? {});
        setStudentOptions(studentOptions);
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

  const refreshData = () => {
    setSelectedIndex(0);
    setCurrentPeerReview(null);
    setSelectedStudentIndex(null);
    setStudentOptions([]);
    setIsLoading(true);
    // Get the current setup
    api
      .get(`/api/peer-review?assignment=${selectedAssignment._id}&pastOnly=true`)
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
          setSelectedIndex(existing.length - 1);
        } else {
          setSelectedIndex(0);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Refresh data on page load
  useEffect(refreshData, [selectedTeam]);
  // Refresh current peer review data when it changes
  useEffect(loadCurrentPeerReview, [selectedIndex]);

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
            Use these tools to monitor Team {selectedTeam?.teamNumber}'s peer
            reviews and check-ins. You should moderate any outstanding peer
            review comments and may add your own private comments.
          </p>
        </Col>
      </Row>

      { peerReviewPoints.length === 0 &&
        <Card className="my-3">
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
      <Row className="gy-2">
        <Col xs={12} md={6}>
          <p className="text-muted mb-1">
            Find peer reviews submitted in:
          </p>
          <InputGroup>
            <Button variant="outline-primary" onClick={handlePrevious}>
              &lt;
            </Button>

            <Dropdown onSelect={(eventKey) => handleSelectOption(parseInt(eventKey))}>
              <Dropdown.Toggle variant="outline-primary" className="px-4">
                {`${currentOption?.periodStart} - ${currentOption?.periodEnd} (${currentOption?.type})`}
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow">
                {peerReviewPoints.map((prp, index) => (
                  <Dropdown.Item
                    key={prp._id}
                    eventKey={index}
                    active={index === selectedIndex}
                  >
                    {`${prp?.periodStart} - ${prp?.periodEnd} (${prp?.type})`}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>

            <Button variant="outline-primary" onClick={handleNext}>
              &gt;
            </Button>
          </InputGroup>
        </Col>
        { currentPeerReview &&
          <Col xs={12} md={6}>
            <p className="text-muted mb-1">
              Focus on results for:
            </p>
            <Dropdown onSelect={handleSelectStudent} disabled={studentOptions.length === 0}>
              <Dropdown.Toggle variant="outline-primary">
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
          </Col>
        }
      </Row>
      }
    </>
  );
}

export default TeamPeerReviews;
