import React, { useEffect, useState } from "react";
import { Card, Col, Row, Spinner } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { daysSince } from "@/utility/datetimes";

const AssignmentKeyStats = () => {
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [meetingsToDate, setMeetingsToDate] = useState(0);
  const [daysSinceLast, setDaysSinceLast] = useState();
  const [outstandingActions, setOutstandingActions] = useState();

  const refreshData = () => {
    if (selectedTeam == null) {
      return setUnavailable(true);
    }
    setLoading(true);
    api
      .get(`/api/stats/team-meetings?team=${selectedTeam._id}`, {
        genericErrorToasts: false,
      })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setMeetingsToDate(data?.meetingsCount);
        if (data?.lastMeetingDate) {
          setDaysSinceLast(daysSince(data?.lastMeetingDate))
        } else {
          setDaysSinceLast(null);
        };
        setOutstandingActions(data?.outstandingActionsCount);
        setLoading(false);
        setUnavailable(false);
      })
      .catch(() => {
        setUnavailable(true);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedTeam]);

  if (unavailable)
    return (
      <Card className="p-3 shadow-sm">
        <Card.Body>
          <p className="text-muted mb-0">
            Your meeting stats will show up here.
          </p>
        </Card.Body>
      </Card>
    );

  if (loading)
    return (
      <Card className="p-3 shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center text-muted">
            <Spinner className="me-3" />
            Loading meeting stats...
          </div>
        </Card.Body>
      </Card>
    );

  return (
    <Card className="p-3 shadow-sm">
      <h5 className="text-center mb-1">Meeting stats</h5>
      <Row className="d-flex align-items-center">
        <Col className="text-muted text-end" xs={5}>You've had</Col>
        <Col className="display-6 text-center text-primary" xs={2}>{meetingsToDate ?? 0}</Col>
        <Col className="text-muted text-start" xs={5}>meetings so far</Col>
      </Row>
      <Row className="d-flex align-items-center">
        <Col className="text-muted text-end" xs={5}>You last met</Col>
        <Col className="display-6 text-center text-primary" xs={2}>{daysSinceLast ?? "--"}</Col>
        <Col className="text-muted text-start" xs={5}>days ago</Col>
      </Row>
      <Row className="d-flex align-items-center">
        <Col className="text-muted text-end" xs={5}>There are</Col>
        <Col className="display-6 text-center text-primary" xs={2}>{outstandingActions ?? "--"}</Col>
        <Col className="text-muted text-start" xs={5}>outstanding actions</Col>
      </Row>
    </Card>
  );
};

export default AssignmentKeyStats;
