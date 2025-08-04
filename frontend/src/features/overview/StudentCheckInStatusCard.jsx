import React, { useState } from "react";
import { Button, Card, Col, Modal, Row, Stack } from "react-bootstrap";
import { CheckCircleFill, ChevronRight, ClockFill, DashCircle, EnvelopeCheckFill, EnvelopeFill, PencilSquare } from "react-bootstrap-icons";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { useNavigate } from "react-router-dom";

const StudentCheckInStatusCard = ({ data }) => {
  const navigate = useNavigate();

  const open = data?.open ?? false;
  const type = data?.type ?? "none";

  if (type === "disabled") return null;

  let icon = <DashCircle size={40} className="text-muted" />;
  let label = "You don't need to complete a check-in this week";
  let buttonText = null;
  let backgroundClass = null;

  if (open) {
    if (type === "simple") {
      icon = <ClockFill size={40} className="text-warning" />;
      label = "Please take 2 minutes to complete this week's check-in";
      buttonText = "Go to check-in";
      backgroundClass = "bg-warning-subtle";
    } else if (type === "full") {
      icon = <ClockFill size={40} className="text-warning" />;
      label = "It's time to complete a peer review for your team";
      buttonText = "Go to check-in";
      backgroundClass = "bg-warning-subtle";
    }
  } else if (type != "none") {
    icon = <CheckCircleFill size={40} className="text-success" />;
    label = "Thank you for completing this week's check-in!";
  }

  const goToCheckIn = () => {
    navigate("/assignment/check-in");
  }

  return (
    <Card className={`p-3 shadow h-100 ${backgroundClass}`}>
      <h5 className="text-center mb-3">Check-in status</h5>
      
      <Row className="justify-content-center mb-3">
        <Col xs="auto">
          {icon}
        </Col>
      </Row>
      
      <Row className="justify-content-center">
        <Col xs={10} className="text-center">
          <div className="mb-3">{label}</div>
        </Col>
      </Row>

      {buttonText && (
        <Row className="justify-content-center">
          <Col xs="auto">
            <Button
              variant="outline-primary"
              className="d-flex align-items-center"
              onClick={goToCheckIn}
            >
              {buttonText} <ChevronRight className="ms-2" />
            </Button>
          </Col>
        </Row>
      )}
    </Card>
  );
};

StudentCheckInStatusCard.loadData = async () => {
  const selectedTeam = useBoundStore.getState().getSelectedTeam();
  if (!selectedTeam) return null;
  try {
    const res = await api.get(
      `/api/checkin?team=${selectedTeam._id}`,
      { genericErrorToasts: false }
    );
    const { type, open, completionRate, } = res.data;
    if (!type || type === "disabled") return null;
    return { type, open, completionRate, };
  } catch (e) {
    return null;
  }
};

export default StudentCheckInStatusCard;
