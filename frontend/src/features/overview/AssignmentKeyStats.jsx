import { Card, Col, Row } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { daysSince } from "@/utility/datetimes";

const AssignmentKeyStats = ({ data }) => {
  const { meetingsCount, daysSinceLast, outstandingActionsCount } = data;

  return (
    <Card className="p-3 shadow h-100">
      <h5 className="text-center mb-1">Meeting stats</h5>
      <Row className="d-flex align-items-center">
        <Col className="text-muted text-end" xs={5}>You've had</Col>
        <Col className="display-6 text-center text-primary" xs={2}>{meetingsCount ?? 0}</Col>
        <Col className="text-muted text-start" xs={5}>meetings so far</Col>
      </Row>
      <Row className="d-flex align-items-center">
        <Col className="text-muted text-end" xs={5}>You last met</Col>
        <Col className="display-6 text-center text-primary" xs={2}>{daysSinceLast ?? "--"}</Col>
        <Col className="text-muted text-start" xs={5}>days ago</Col>
      </Row>
      <Row className="d-flex align-items-center">
        <Col className="text-muted text-end" xs={5}>There are</Col>
        <Col className="display-6 text-center text-primary" xs={2}>{outstandingActionsCount ?? "--"}</Col>
        <Col className="text-muted text-start" xs={5}>outstanding actions</Col>
      </Row>
    </Card>
  );
};

AssignmentKeyStats.loadData = async () => {
  const selectedTeam = useBoundStore.getState().getSelectedTeam();
  if (!selectedTeam) return null;
  try {
    const res = await api.get(`/api/stats/team-meetings?team=${selectedTeam._id}`, {
      genericErrorToasts: false,
    })
    const data = res.data;
    const daysSinceLast = data?.lastMeetingDate ? daysSince(data.lastMeetingDate) : null;
    return {
      meetingsCount: data?.meetingsCount ?? 0,
      daysSinceLast,
      outstandingActionsCount: data?.outstandingActionsCount ?? 0,
    };
  } catch (e) {
    return null;
  }
};

export default AssignmentKeyStats;
