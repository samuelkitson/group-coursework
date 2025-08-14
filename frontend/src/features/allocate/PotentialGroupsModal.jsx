import { toTitleCase } from "@/utility/helpers";
import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Card,
  Row,
  Col,
  ListGroup,
  Badge,
  Dropdown,
  Placeholder,
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

const PotentialGroupsModal = ({activeModal, allocation, handleCancel, handleConfirm, regnerateAllocation, requiredAttributes, isPending}) => {
  const [spotlightAttribute, setSpotlightAttribute] = useState(null);

  const spotlightOptions = requiredAttributes?.map(a => [a, false]) ?? [];
  const skillsList = allocation?.criteria?.find(c => c.name === "Skill coverage")?.skills?.map(s => [s, true]);
  if (skillsList) spotlightOptions.push(...skillsList);

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
    const criterion = allocation.criteria[criterionIndex];
    if (!criterion) return "Unknown criterion";
    const name = criterion.name.startsWith("Custom") ? toTitleCase(criterion.attribute) : criterion.name;
    if (criterion?.goal) {
      return `${name} (${criterion.goal})`;
    } else {
      return name;
    }
  }

  const getSpotlightValue = (student) => {
    const className = "ms-2 d-flex-inline align-items-center small";
    if (!spotlightAttribute) return null;
    let studentValue;
    if (spotlightAttribute[1]) {
      // Fetch skill rating specifically.
      studentValue = student.skills?.[spotlightAttribute[0]]?.toString();
    } else {
      // Fetch normal attribute value.
      studentValue = student?.[spotlightAttribute[0]];
    }
    if (studentValue === null || studentValue === undefined) return (<span className={`${className} text-muted`}>
      <QuestionCircle className="me-1" />no data
    </span>);
    if (typeof studentValue == "boolean") {
      if (studentValue) {
        return (
          <span className={`${className} text-success`}>
            <CheckCircle className="me-1" />{spotlightAttribute[0]}
          </span>
        ); 
      } else {
        return (
          <span className={`${className} text-danger`}>
            <XCircle className="me-1" />not {spotlightAttribute[0]}
          </span>
        ); 
      }
    }
    return (
      <span className={`${className} text-primary`}>
        {studentValue}
      </span>
    ); 
  };

  if (allocation == null) { return <></> }

  return (
    <Modal
      show={activeModal}
      backdrop="static"
      fullscreen={true}
    >
      <Modal.Header className="d-flex justify-content-between">
        <Modal.Title>Generated allocation</Modal.Title>
        <Button
          onClick={regnerateAllocation}
          variant="primary"
          className="d-flex align-items-center"
          disabled={isPending}
        >
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
            className="h-100 sticky-md-top pt-3"
          >
            <h5 className="fw-semibold">
              <Search className="me-1" /> Data spotlight
            </h5>
            <p className="text-muted small mb-2">
              Select an attribute to display its value for each student.
            </p>

            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm" className="border">
                <span className="pe-1">
                  { spotlightAttribute ? `Showing "${spotlightAttribute?.[0]}" data` : "No attribute selected"}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu size="sm" style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
                <Dropdown.Item
                  onClick={() => setSpotlightAttribute(null)}
                  className="text-muted"
                >
                  Hide data spotlight
                </Dropdown.Item>
                {spotlightOptions.map(([attribute, isSkill], index) => (
                  <Dropdown.Item
                    key={`attribute-selector-${index}`}
                    onClick={() => setSpotlightAttribute([attribute, isSkill])}
                    active={spotlightAttribute?.[0] === attribute}
                  >
                    { isSkill ? 
                      `skills > ${attribute}`
                    :
                      attribute
                    }
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs={12} md={8} className="h-100 overflow-auto pt-3">
            <div className="d-flex justify-content-between">
              <p className="mb-0">
                { isPending ? "Regenerating groups..." : `${allocation.allocation.length ?? 0} groups generated` }
              </p>
              <p className="mb-0">
                { !isPending && `Overall allocation quality: ${(allocation.fitness * 100).toFixed(1)}%`}
              </p>
            </div>
            
            { isPending ? Array.from({ length: Math.min(allocation.allocation.length, 5) }, (_, index) => (
              <Card className="placeholder-glow my-3">
                <Card.Body>
                  <Row>
                    <Col lg={6}>
                      <Placeholder as={Card.Text} animation="glow">
                        <Placeholder xs={6} /><br />
                        <Placeholder xs={3} /><br />
                        <Placeholder xs={5} /><br />
                        <Placeholder xs={4} />
                      </Placeholder>
                    </Col>
                    <Col lg={6}>
                      <Placeholder as={Card.Text} animation="glow">
                        <Placeholder xs={3} /><br />
                        <Placeholder xs={4} /><br />
                        <Placeholder xs={6} /><br />
                        <Placeholder xs={5} />
                      </Placeholder>
                    </Col>
                  </Row>
                  
                </Card.Body>
              </Card>
            )) : allocation.allocation.map((group, index) => (
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
                      <h6 className="mb-2">Allocation quality - {Math.round(group.fitness * 100)}%</h6>
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
                            {getCriterionName(index)} - {Math.round(criterion * 100)}%
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
          disabled={isPending}
          className="d-flex align-items-center"
          onClick={handleCancel}
        >
          <Trash3Fill className="me-2" /> Cancel
        </Button>
        <Button
          variant="success"
          disabled={isPending}
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
