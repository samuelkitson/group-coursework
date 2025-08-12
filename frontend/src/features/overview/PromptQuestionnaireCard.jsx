import { Button, Card, Col, Row } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

const PromptQuestionnaireCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="p-3 shadow h-100">
      <Card.Body className="py-0">
        <h5 className="text-center mb-3">Skills questionnaire</h5>
        <Card.Text className="mt-2 text-muted">
          If you haven't already, remember to complete the skills questionnaire.
          This helps staff create teams more likely to work well.
        </Card.Text>
        <Button
          variant="primary"
          className="d-flex align-items-center"
          onClick={() => navigate("/assignment/questionnaire")}
        >
          Go to questionnaire <ChevronRight className="ms-2" />
        </Button>
      </Card.Body>
    </Card>
  );
};

export default PromptQuestionnaireCard;
