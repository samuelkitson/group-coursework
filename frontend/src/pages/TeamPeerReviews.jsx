import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Col, Container, Dropdown, InputGroup, Row } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { format, parseISO } from "date-fns";
import { useBoundStore } from "@/store/dataBoundStore";
import { ArrowLeftShort, QuestionCircleFill } from "react-bootstrap-icons";

function TeamPeerReviews() {
  const selectedAssignment = useBoundStore((state) => state.getSelectedAssignment());
  const selectedTeam = useBoundStore((state) => state.getSelectedTeam());

  const [peerReviewPoints, setPeerReviewPoints] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const currentOption = peerReviewPoints[selectedIndex];

  const refreshData = () => {
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
      });
  };
  
  // Refresh data on page load
  useEffect(refreshData, [selectedTeam]);

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
      <Row>
        <Col xs="auto">
          <InputGroup>
            <Button variant="outline-secondary" onClick={handlePrevious}>
              &lt;
            </Button>

            <Dropdown as={InputGroup.Append} onSelect={(eventKey) => handleSelectOption(parseInt(eventKey))}>
              <Dropdown.Toggle variant="outline-secondary" id="dropdown-basic" className="px-4">
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

            <Button variant="outline-secondary" onClick={handleNext}>
              &gt;
            </Button>
          </InputGroup>
        </Col>
      </Row>
      }
    </>
  );
}

export default TeamPeerReviews;
