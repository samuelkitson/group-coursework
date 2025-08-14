import { useBoundStore } from "@/store/dataBoundStore";
import { Button, Card, Col, Row, Stack } from "react-bootstrap";
import { ChevronRight, HandThumbsUp, Person, QuestionCircle, Webcam } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

const MeetingPreferencesCard = () => {
  const navigate = useNavigate();
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );

  if (!selectedTeam) return null;

  const meetingPrefs = { "either": 0, "in-person": 0, "online": 0 };
  for (const member of (selectedTeam?.members ?? [])) {
    if (member.hasOwnProperty("meetingPref")) {
      meetingPrefs[member.meetingPref] += 1;
    }
  }

  return (
    <Card className="shadow h-100">
      <h5 className="pt-3 text-center">Meeting preferences</h5>

      <Card.Body className="px-4 pt-3 pb-1">
        <Row className="g-3 mb-4">
          <Col className="text-center">
            <Stack gap={2} className="align-items-center">
              <div className="bg-light rounded-circle p-3 d-inline-flex">
                <Webcam size={24} className="text-primary" />
              </div>
              <div className="display-6 fw-bold text-primary mb-0">
                {meetingPrefs.online}
              </div>
              <span className="text-muted small">Online</span>
            </Stack>
          </Col>
          <Col className="text-center">
            <Stack gap={2} className="align-items-center">
              <div className="bg-light rounded-circle p-3 d-inline-flex">
                <Person size={24} className="text-success" />
              </div>
              <div className="display-6 fw-bold text-success mb-0">
                {meetingPrefs["in-person"]}
              </div>
              <span className="text-muted small">In-person</span>
            </Stack>
          </Col>
          <Col className="text-center">
            <Stack gap={2} className="align-items-center">
              <div className="bg-light rounded-circle p-3 d-inline-flex">
                <QuestionCircle size={24} className="text-dark" />
              </div>
              <div className="display-6 fw-bold text-dark mb-0">
                {meetingPrefs.either}
              </div>
              <span className="text-muted small">Either</span>
            </Stack>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default MeetingPreferencesCard;
