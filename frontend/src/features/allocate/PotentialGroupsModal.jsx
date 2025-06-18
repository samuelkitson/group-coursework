import {
  Modal,
  Button,
  Card,
  Row,
  Col,
  ListGroup,
} from "react-bootstrap";
import {
  FlagFill,
  XCircle,
  ExclamationCircle,
  CheckCircle,
  CheckCircleFill,
  Trash3Fill,
  Shuffle,
} from "react-bootstrap-icons";

const PotentialGroupsModal = ({showModal, allocation, handleCancel, handleConfirm, regnerateAllocation, criteriaOptions, dealbreakerOptions}) => {
  const criterionIcon = (quality) => {
    if (quality < 0.4) {
      return <XCircle />;
    } else if (quality < 0.8) {
      return <ExclamationCircle />;
    } else {
      return <CheckCircle />;
    }
  };

  const criterionColour = (quality) => {
    if (quality < 0.4) {
      return "text-danger";
    } else if (quality < 0.8) {
      return "text-warning";
    } else {
      return "text-success";
    }
  };
  
  const borderColour = (quality, dealbreakers) => {
    if (dealbreakers?.length > 0) {
      return "danger";
    }
    if (quality < 0.4) {
      return "danger";
    } else if (quality < 0.8) {
      return "warning";
    } else {
      return "";
    }
  };

  const getCriterionName = (criterionIndex) => {
    const tag = allocation.criteria[criterionIndex]?.tag;
    if (!tag) return "Unknown criterion";
    return criteriaOptions.find(c => c.tag === tag)?.title ?? "Unknown criterion";
  }

  const getDealbreakerName = (tag) => {
    return dealbreakerOptions.find(c => c.tag === tag)?.title ?? "Unknown dealbreaker";
  }

  if (allocation == null) { return <></> }

  return (
    <Modal
      show={showModal}
      backdrop="static"
      fullscreen={true}
    >
      <Modal.Header className="d-flex justify-content-between">
        <Modal.Title>Generated allocation</Modal.Title>
        <Button onClick={regnerateAllocation} variant="primary" className="d-flex align-items-center">
          <Shuffle className="me-2" />
          Regenerate
        </Button>
      </Modal.Header>
      <Modal.Body className="px-4">
        <p className="text-muted">
          We've created a group allocation based on your preferences, as shown
          below.
          <br /> Each group has been evaluated against how well it meets your
          criteria and dealbreakers, with the worst groups listed first.
        </p>
        <Row className="mt-3">
          <Col
            xs={12}
            md={4}
            className="h-100 overflow-auto sticky-md-top pt-3"
          >
            <ListGroup variant="flush">
              <ListGroup.Item>
                Allocation quality: {(allocation.fitness * 100).toFixed(1)}%
              </ListGroup.Item>
              <ListGroup.Item>
                Number of groups: {allocation.allocation.length}
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col xs={12} md={8} className="h-100 overflow-auto pt-3">
            {allocation.allocation.map((group, index) => (
              <Card key={index} className="my-3" border={borderColour(group.fitness ,group.dealbreakers)}>
                <Card.Body>
                  <Row>
                    <Col lg={6}>
                      <h6 className="mb-2">Members</h6>
                      <ul className="list-unstyled">
                        {group.members.map((student, i) => (
                          <li key={student._id}>{student.displayName}</li>
                        ))}
                      </ul>
                    </Col>
                    <Col lg={6}>
                      <h6 className="mb-2">Allocation quality ({Math.round(group.fitness * 100)}%)</h6>
                      <ul className="list-unstyled">
                        {group.dealbreakers &&
                          group.dealbreakers
                            .sort((a, b) => b.importance - a.importance)
                            .map((dealbreaker, index) => (
                              <li
                                key={index}
                                className="d-flex align-items-center text-danger fw-semibold"
                              >
                                <FlagFill className="me-2" />
                                {getDealbreakerName(dealbreaker)} 
                              </li>
                            ))}
                        {group.criteriaScores.map((criterion, index) => (
                          <li
                            key={index}
                            className={`d-flex align-items-center ${criterionColour(criterion)}`}
                          >
                            <span className="me-2">
                              {criterionIcon(criterion)}
                            </span>
                            {getCriterionName(index)} ({Math.round(criterion * 100)}%)
                          </li>
                        ))}
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button
          variant="danger"
          className="d-flex align-items-center"
          onClick={handleCancel}
        >
          <Trash3Fill className="me-2" /> Cancel
        </Button>
        <Button
          variant="success"
          className="d-flex align-items-center"
          onClick={handleConfirm}
        >
          <CheckCircleFill className="me-2" /> Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PotentialGroupsModal;
