import { useBoundStore } from "@/store/dataBoundStore";
import { Button, Card, Col, Row, Stack } from "react-bootstrap";
import { ChevronRight, Eyeglasses, HandThumbsUp, Mortarboard, Person, PersonBadge, QuestionCircle, Webcam } from "react-bootstrap-icons";
import { Link, useNavigate } from "react-router-dom";

const PeopleOverviewCard = () => {
  const navigate = useNavigate();
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );

  if (!selectedAssignment) return null;

  const studentsCount = selectedAssignment?.students?.length ?? 0;
  const staffCount = selectedAssignment?.lecturers?.length ?? 1;
  const supervisorsCount = selectedAssignment?.supervisors?.length ?? 0;

  return (
    <Card className="shadow h-100">
      <h5 className="pt-3 text-center">People</h5>

      <Card.Body className="px-4 pt-3 pb-1">
        <Row className="g-3 mb-4">
          <Col className="text-center">
            <Stack gap={2} className="align-items-center">
              <Button
                as={Link}
                to="/assignment/configure" 
                variant="light"
                className="rounded-circle p-3 d-inline-flex border-0"
              >
                <PersonBadge size={24} className="text-primary" />
              </Button>
              <div className="display-6 fw-bold text-primary mb-0">
                {staffCount}
              </div>
              <span className="text-muted small">Staff</span>
            </Stack>
          </Col>
          <Col className="text-center">
            <Stack gap={2} className="align-items-center">
              <Button
                as={Link}
                to="/assignment/students" 
                variant="light"
                className="rounded-circle p-3 d-inline-flex border-0"
              >
                <Mortarboard size={24} className="text-success" />
              </Button>
              <div className="display-6 fw-bold text-success mb-0">
                {studentsCount}
              </div>
              <span className="text-muted small">Students</span>
            </Stack>
          </Col>
          <Col className="text-center">
            <Stack gap={2} className="align-items-center">
              <Button
                as={Link}
                to="/assignment/supervisors" 
                variant="light"
                className="rounded-circle p-3 d-inline-flex border-0"
              >
                <Eyeglasses size={24} className="text-dark" />
              </Button>
              <div className="display-6 fw-bold text-dark mb-0">
                {supervisorsCount}
              </div>
              <span className="text-muted small">Supervisors</span>
            </Stack>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default PeopleOverviewCard;
