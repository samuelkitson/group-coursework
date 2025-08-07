import { useState } from "react";
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
  Search,
  QuestionCircle,
  XCircleFill,
  BarChartFill,
  InfoCircleFill,
  InfoCircle,
} from "react-bootstrap-icons";

const PotentialGroupsModal = ({showModal, allocation, handleCancel, handleConfirm, regnerateAllocation, criteriaOptions, dealbreakerOptions}) => {
  const [spotlightIndex, setSpotlightIndex] = useState([null, null]);
  const [spotlightAttribute, setSpotlightAttribute] = useState(null);

  const setSpotlight = (isCriterion, critDealIndex) => {
    if (spotlightIndex[0] == isCriterion && spotlightIndex[1] == critDealIndex) {
      setSpotlightIndex([null, null]);
      setSpotlightAttribute(null);
    } else {
      setSpotlightIndex([isCriterion, critDealIndex]);
      if (isCriterion) {
        setSpotlightAttribute(allocation.criteria[critDealIndex]?.attribute);
      } else {
        setSpotlightAttribute(allocation.dealbreakers[critDealIndex]?.attribute);
      }
    }
  };
  
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
    return allocation.criteria[criterionIndex]?.name ?? "Unknown criterion";
  }

  const getSpotlightValue = (student) => {
    const className = "ms-2 d-flex-inline align-items-center";
    if (!spotlightAttribute) return null;
    const studentValue = student[spotlightAttribute];
    if (studentValue === null || studentValue === undefined) return (<span className={`${className} text-muted`}>
      <QuestionCircle size={14} className="me-1" />no data
    </span>);
    if (typeof studentValue == "boolean") {
      if (studentValue) {
        return (
          <span className={`${className} text-success`}>
            <CheckCircle size={14} className="me-1" />{spotlightAttribute}
          </span>
        ); 
      } else {
        return (
          <span className={`${className} text-danger`}>
            <XCircle size={14} className="me-1" />not {spotlightAttribute}
          </span>
        ); 
      }
    }
    return (
      <span className={`${className} text-muted`}>
        <InfoCircle size={14} className="me-1" />{studentValue}
      </span>
    ); 
  };

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
          criteria and deal-breakers, with the worst groups listed first.
        </p>
        <Row className="mt-3">
          <Col
            xs={12}
            md={4}
            className="h-100 overflow-auto sticky-md-top pt-3"
          >
            <h5 className="fw-semibold">
              <Search className="me-1" /> Data spotlight
            </h5>
            <p className="text-muted small">
              Click one of the criteria or deal-breakers below to reveal the
              data used to compute it.
            </p>

            <ListGroup className="mt-3">
              {allocation.criteria.map((criterion, index) => (
                <ListGroup.Item
                  key={`criterion-selector-${index}`}
                  action
                  onClick={() => setSpotlight(true, index)}
                  disabled={criterion.name === "Skill coverage"}
                  active={spotlightIndex[0] && spotlightIndex[1] === index}
                >
                  {criterion.name}
                </ListGroup.Item>
              ))}
              {allocation.dealbreakers.map((dealbreaker, index) => (
                <ListGroup.Item
                  key={`dealbreaker-selector-${index}`}
                  action
                  onClick={() => setSpotlight(false, index)}
                  active={!spotlightIndex[0] && spotlightIndex[1] === index}
                >
                  {dealbreaker.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
          <Col xs={12} md={8} className="h-100 overflow-auto pt-3">
            <div className="d-flex justify-content-between">
              <p className="mb-0">
                {allocation.allocation.length ?? 0} groups generated
              </p>
              <p className="mb-0">
                Overall allocation quality: {(allocation.fitness * 100).toFixed(1)}%
              </p>
            </div>
            
            {allocation.allocation.map((group, index) => (
              <Card
                key={index}
                className="my-3"
                border={borderColour(group.fitness, group.dealbreakers)}
              >
                <Card.Body>
                  <Row>
                    <Col lg={6}>
                      <h6 className="mb-2">Members</h6>
                      <ul className="list-unstyled">
                        {group.members.map((student, i) => (
                          <li key={student._id}>
                            {student.displayName}
                            {getSpotlightValue(student)}
                          </li>
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
                                {dealbreaker} 
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
