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
  Bookmarks,
  BookmarkPlus,
  BookmarkCheckFill,
} from "react-bootstrap-icons";

const PotentialGroupsModal = ({activeModal, allocation, handleCancel, handleConfirm, regnerateAllocation, requiredAttributes, isPending, storedAllocations, setStoredAllocations}) => {
  const [spotlightAttribute, setSpotlightAttribute] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null); // null means show generated.
  const [storedCurrent, setStoredCurrent] = useState(false);
  const displayedAllocation = selectedAllocation !== null ? storedAllocations[selectedAllocation] : allocation;

  const spotlightOptions = requiredAttributes?.map(a => [a, false]) ?? [];
  const skillsList = displayedAllocation?.criteria?.find(c => c.name === "Skill coverage")?.skills?.map(s => [s, true]);
  if (skillsList) spotlightOptions.push(...skillsList);
  if (spotlightAttribute && !spotlightOptions.some(([name]) => name === spotlightAttribute[0])) {
    setSpotlightAttribute(null);
  }

  const storeAllocation = () => {
    if (!allocation) return;
    setSelectedAllocation(storedAllocations.length);
    setStoredAllocations(prevAllocations => [...prevAllocations, allocation]);
    setStoredCurrent(true);
  }

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
    const criterion = displayedAllocation?.criteria[criterionIndex];
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

  const confirmButtonHandler = () => {
    handleConfirm(selectedAllocation);
  };

  useEffect(() => {
    setStoredCurrent(false);
    setSelectedAllocation(null);
  }, [allocation]);

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
            <h5 className="fw-semibold d-flex align-items-center">
              <Search className="me-2" /> Data spotlight
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

            <h5 className="fw-semibold mt-5 d-flex align-items-center">
              <Bookmarks className="me-2" /> Stored allocations
            </h5>
            <p className="text-muted small mb-2 pe-5">
              Store and compare allocations to see the effect of adjusting
              options or regenerating.
            </p>

            { storedCurrent ? 
              <Button
                disabled={true}
                className="d-flex align-items-center mb-2"
                size="sm"
              >
                <BookmarkCheckFill className="me-2" /> Stored current allocation
              </Button>
            :
              <Button
                disabled={isPending}
                className="d-flex align-items-center mb-2"
                size="sm"
                onClick={storeAllocation}
              >
                <BookmarkPlus className="me-2" /> Store current allocation
              </Button>
            }

            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm" className="border" disabled={isPending}>
                <span className="pe-1">
                  { selectedAllocation === null ? "Generated allocation" : `Stored allocation ${selectedAllocation + 1}`}
                </span>
              </Dropdown.Toggle>
              <Dropdown.Menu size="sm" style={{ maxHeight: "calc(100vh - 500px)", overflowY: "auto" }}>
                { !storedCurrent &&
                <Dropdown.Item
                  onClick={() => setSelectedAllocation(null)}
                  className="text-muted"
                >
                  Generated allocation ({Math.round(allocation?.fitness * 100)}%)
                </Dropdown.Item>
                }
                {storedAllocations.map((allocation, index) => (
                  <Dropdown.Item
                    key={`attribute-selector-${index}`}
                    onClick={() => setSelectedAllocation(index)}
                    active={index === selectedAllocation}
                  >
                    { `Stored allocation ${index + 1} (${Math.round(storedAllocations[index].fitness * 100)}%)`}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs={12} md={8} className="h-100 overflow-auto pt-3">
            <div className="d-flex justify-content-between">
              <p className="mb-0">
                { isPending ? "Generating groups..." : `${displayedAllocation?.allocation?.length ?? 0} groups generated` }
              </p>
              <p className="mb-0">
                { !isPending && `Overall allocation quality: ${((displayedAllocation?.fitness ?? 0) * 100).toFixed(1)}%`}
              </p>
            </div>
            
            { isPending ? Array.from({ length: 5 }, (_, index) => (
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
            )) : displayedAllocation?.allocation?.map((group, index) => (
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
          disabled={isPending || !displayedAllocation}
          className="d-flex align-items-center"
          onClick={confirmButtonHandler}
        >
          <CheckCircleFill className="me-2" /> Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PotentialGroupsModal;
