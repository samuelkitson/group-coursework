import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  ListGroup,
  Form,
  InputGroup,
  Dropdown,
} from "react-bootstrap";
import {
  ArrowsCollapseVertical,
  CardChecklist,
  CheckCircleFill,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clipboard2Data,
  Floppy2Fill,
  Globe2,
  HourglassSplit,
  PersonArmsUp,
  PersonVideo3,
  PlusCircleFill,
  QuestionCircle,
  XLg,
} from "react-bootstrap-icons";

import "./style/AllocationControls.css";
import UnsavedChanges from "@/components/UnsavedChanges";
import PotentialGroupsModal from "@/features/allocate/PotentialGroupsModal";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function AllocationControls() {
  const navigate = useNavigate();
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );

  // Stores the different criteria/dealbreaker blocks the user can select
  const [criteriaOptions, setCriteriaOptions] = useState([]);
  const [dealbreakerOptions, setDealbreakerOptions] = useState([]);

  // Extra data used for some criteria block types
  const [requiredSkills, setRequiredSkills] = useState([]);

  // Stores the current allocation setup
  const [criteria, setCriteria] = useState([]);
  const [dealbreakers, setDealbreakers] = useState([]);
  const [groupSize, setGroupSize] = useState(5);
  const [surplusLargerGroups, setSurplusLargerGroups] = useState(false);

  const [pending, setPending] = useState(false);
  const [unsaved, setUnsaved] = useState(false);

  const [activeModal, setActiveModal] = useState(false);

  const [generatedAllocation, setGeneratedAllocation] = useState(null);

  const moveCriterion = (fromIndex, toIndex) => {
    const updatedCriteria = [...criteria];
    const [movedCriterion] = updatedCriteria.splice(fromIndex, 1);
    updatedCriteria.splice(toIndex, 0, movedCriterion);
    setCriteria(updatedCriteria);
    setUnsaved(true);
  };

  const handleRemoveCriterion = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
    setUnsaved(true);
  };

  const handleRemoveDealbreaker = (index) => {
    setDealbreakers(dealbreakers.filter((_, i) => i !== index));
    setUnsaved(true);
  };

  const handleValueChange = (index, newValue, optionName="value") => {
    const updatedCriteria = criteria.map((criterion, i) =>
      i === index ? { ...criterion, [optionName]: newValue } : criterion,
    );
    setCriteria(updatedCriteria);
    setUnsaved(true);
  };

  const updateDealbreakerImportance = (index, newImportance) => {
    const updatedDealbreakers = dealbreakers.map((dealbreaker, i) =>
      i === index
        ? { ...dealbreaker, importance: parseInt(newImportance) }
        : dealbreaker,
    );
    setDealbreakers(updatedDealbreakers);
    setUnsaved(true);
  };

  const handleMoveUp = (index) => {
    if (index > 0) moveCriterion(index, index - 1);
  };

  const handleMoveDown = (index) => {
    if (index < criteria.length - 1) moveCriterion(index, index + 1);
  };

  const renderControls = (index, criterion) => {
    if (criterion.tag === "specific-skill") {
      return (
        <Form.Select
          value={criterion.value}
          onChange={(e) => handleValueChange(index, e.target.value, "value")}
        >
          <option hidden>Select a skill</option>
          {requiredSkills.map((skill) => {
            return (
              <option key={skill.name} value={skill.name}>
                {skill.name}
              </option>
            );
          })}
        </Form.Select>
      );
    } else if (criterion.tag === "skill-coverage") {
      return (
        <Form.Check
          type="switch"
          label="Range of confidence levels within teams"
          checked={criterion.goal == "balance"}
          onChange={(e) => handleValueChange(index, e.target.checked ? "balance" : undefined, "goal")}
        />
      );
    } else if (criterion.tag === "past-performance") {
      return (
        <Form>
          <Form.Control
            value={criterion.value}
            className="mb-3"
            placeholder="Specific marks data (optional)"
            onChange={(e) => handleValueChange(index, e.target.value, "value")}
          >
          </Form.Control>
          <Form.Group>
            <Form.Check
              type="radio"
              label="Similar students together"
              value="similar"
              checked={criterion.goal === "similar"}
              onChange={(e) => handleValueChange(index, e.target.value, "goal")}
            />
            <Form.Check
              type="radio"
              label="Diverse students together"
              value="diverse"
              checked={criterion.goal === "diverse"}
              onChange={(e) => handleValueChange(index, e.target.value, "goal")}
            />
          </Form.Group>
        </Form>
      )
    } else if (criterion.type === "goals") {
      return (
        <Form>
          <Form.Check
            type="radio"
            label="Similar students together"
            value="similar"
            checked={criterion.value === "similar"}
            onChange={(e) => handleValueChange(index, e.target.value)}
          />
          <Form.Check
            type="radio"
            label="Diverse students together"
            value="diverse"
            checked={criterion.value === "diverse"}
            onChange={(e) => handleValueChange(index, e.target.value)}
          />
        </Form>
      );
    } else {
      return null;
    }
  };

  const addNewCriterion = (newCriterion) => {
    setCriteria((prevCriteria) => [...prevCriteria, newCriterion]);
    setActiveModal(null);
    setUnsaved(true);
    setTimeout(() => {
      document
        .getElementById(`criterion-${criteria.length}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const addNewDealbreaker = (newDealbreaker) => {
    newDealbreaker.importance = 2;
    setDealbreakers((prevDealbreakers) => [
      newDealbreaker,
      ...prevDealbreakers,
    ]);
    setActiveModal(null);
    setUnsaved(true);
  };

  const splitIntoCategories = (options) => {
    let categorised = {};
    options.forEach((o) => {
      if (o.category in categorised) {
        categorised[o.category].push(o);
      } else {
        categorised[o.category] = [o];
      }
    });
    return categorised;
  };

  const updateGroupSize = (newSize) => {
    setGroupSize(newSize);
    setUnsaved(true);
  };

  const updateSurplusLarger = (allocateUpwards) => {
    setSurplusLargerGroups(allocateUpwards);
    setUnsaved(true);
  };

  const refreshData = () => {
    setCriteriaOptions([]);
    api
      .get(`/api/allocation/${selectedAssignment._id}/options`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setCriteriaOptions(data?.criteria ?? []);
        setDealbreakerOptions(data?.dealbreakers ?? []);
        setRequiredSkills(data?.skills ?? []);
      });
    api
      .get(`/api/allocation/${selectedAssignment._id}/setup`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setCriteria(data?.criteria ?? []);
        setDealbreakers(data?.dealbreakers ?? []);
        setGroupSize(data?.groupSize ?? 5);
        setSurplusLargerGroups(data?.surplusLargerGroups ?? false);
      });
  };
  
  const startAllocation = () => {
    if (criteria.length === 0) {
      toast.error("You must configure some allocation criteria first.");
      return;
    }
    setPending(true);
    api
      .post(`/api/allocation/${selectedAssignment._id}/run`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setGeneratedAllocation(data);
        setActiveModal("allocation");
      })
      .finally(() => {
        setPending(false);
      });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "skills":
        return <CardChecklist />;
      case "questions":
        return <QuestionCircle />;
      case "data":
        return <Clipboard2Data />;
      case "personal":
        return <PersonArmsUp />;
      case "language":
        return <Globe2 />;
      case "clash":
        return <ArrowsCollapseVertical />;
      case "meetings":
        return <PersonVideo3 />;
      default:
        return <PersonArmsUp />;
    }
  };

  const getImportanceString = (importance) => {
    switch (importance) {
      case 0:
        return "Just tell me";
      case 1:
        return "Low importance";
      case 2:
        return "Medium importance";
      case 3:
        return "High importance";
      default:
        return "Rate importance";
    }
  };

  const saveChanges = async () => {
    setPending(true);
    const updateObj = {
      groupSize: groupSize,
      surplusLargerGroups: surplusLargerGroups,
      criteria: criteria,
      dealbreakers: dealbreakers,
    };
    api
      .put(`/api/allocation/${selectedAssignment._id}/setup`, updateObj, {
        successToasts: true,
      })
      .then(() => {
        setUnsaved(false);
      })
      .finally(() => {
        setPending(false);
      });
  };

  const handleRejectAllocation = () => {
    setActiveModal(null);
  };

  const handleAcceptAllocation = () => {
    setActiveModal("release-allocation");
  };

  const handleReleaseAllocation = () => {
    const groupsList = generatedAllocation.allocation.map(group => group.members.map(student => student._id));
    setPending(true);
    const updateObj = {
      allocation: groupsList,
    };
    api
      .post(`/api/allocation/${selectedAssignment._id}`, updateObj, {
        successToasts: true,
      })
      .then(() => {
        setUnsaved(false);
        setActiveModal(null);
        updateSelectedAssignment({ state: "live" });
        navigate("/assignment/overview");
      })
      .finally(() => {
        setPending(false);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-4">
        <Col md={9} className="mb-3 mb-md-0">
          <h1>
            Allocation <UnsavedChanges unsaved={unsaved} />
          </h1>
          <p className="text-muted">
            It's time to create the group allocations for{" "}
            {selectedAssignment.name}.
          </p>
          <Row className="gy-2">
            <Col md={4}>
              <InputGroup size="sm" style={{maxWidth: "150px"}}>
                <InputGroup.Text>Group size</InputGroup.Text>
                <Form.Control
                  type="number"
                  min="2"
                  max="20"
                  value={groupSize}
                  onChange={(e) => updateGroupSize(+e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex align-items-center">
              <Dropdown>
                <Dropdown.Toggle variant="light" size="sm" className="border">
                  {surplusLargerGroups ? `Allow groups of ${groupSize + 1} ` : `Allow groups of ${groupSize - 1} `}
                </Dropdown.Toggle>
                <Dropdown.Menu size="sm">
                  <Dropdown.Item onClick={() => updateSurplusLarger(false)}>
                    Allow groups of {groupSize - 1}
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => updateSurplusLarger(true)}>
                    Allow groups of {groupSize + 1}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end">
          <div className="d-grid gap-2">
            <Button
              disabled={pending || !unsaved}
              onClick={saveChanges}
              className="d-flex align-items-center"
            >
              {pending ? (
                <>
                  <HourglassSplit className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Floppy2Fill className="me-2" />
                  Save changes
                </>
              )}
            </Button>
            <Button
              disabled={pending || unsaved}
              variant="success"
              className="d-flex align-items-center"
              onClick={startAllocation}
            >
              <CheckCircleFill className="me-2" /> Start allocation
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="mb-4 gy-4 gx-5">
        {/* Criteria column */}
        <Col lg={6} className="border-end">
          <div className="d-flex">
            <h3>Criteria</h3>
            <div
              onClick={() => setActiveModal("criteria")}
              className="icon-button ms-auto d-flex align-items-center"
              bg="bs-primary"
            >
              <PlusCircleFill className="text-primary" size={24} />
            </div>
          </div>
          <p className="me-3 text-muted">
            Use criteria blocks to describe the characteristics of the ideal
            allocation. Criteria are prioritised with the most important listed
            first.
          </p>
          {criteria.length === 0 ? (
            <p className="text-muted">
              Click the <PlusCircleFill /> button to add a new allocation
              criterion.
            </p>
          ) : (
            criteria.map((criterion, index) => (
              <Card className="mb-3" border="success" key={index}>
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title className="d-flex align-items-center">
                      {getCategoryIcon(criterion.category)}
                      <span className="ms-2">{criterion.title}</span>
                    </Card.Title>
                    <Card.Text>{criterion.description}</Card.Text>
                    {renderControls(index, criterion)}
                  </div>
                  <div className="d-flex flex-column align-items-end"></div>
                  <div className="d-flex flex-column">
                    <Button
                      variant="link"
                      size="sm"
                      style={{ color: "#dc3545" }}
                      onClick={() => handleRemoveCriterion(index)}
                    >
                      <XLg />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === criteria.length - 1}
                    >
                      <ChevronDown />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Col>

        {/* Dealbreakers column */}
        <Col lg={6}>
          <div className="d-flex">
            <h3>Deal-breakers</h3>
            <div
              onClick={() => setActiveModal("dealbreaker")}
              className="icon-button ms-auto d-flex align-items-center"
              bg="bs-primary"
            >
              <PlusCircleFill className="text-primary" size={24} />
            </div>
          </div>
          <p className="me-3 text-muted">
            Use deal-breakers to avoid specific group properties known to be
            problematic. If possible, the system won't create groups like this.
          </p>

          {dealbreakers.length === 0 ? (
            <p className="text-muted">
              Click the <PlusCircleFill /> button to add a new allocation
              dealbreaker.
            </p>
          ) : (
            dealbreakers.map((dealbreaker, index) => (
              <Card className="mb-3" border="danger" key={index}>
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title className="d-flex align-items-center">
                      {getCategoryIcon(dealbreaker.category)}
                      <span className="ms-2">{dealbreaker.title}</span>
                    </Card.Title>
                    <Card.Text>{dealbreaker.description}</Card.Text>
                    <div className="d-flex align-items-center">
                      <Form.Range
                        min={0}
                        max={3}
                        value={dealbreaker.importance ?? 2}
                        onChange={(e) =>
                          updateDealbreakerImportance(index, e.target.value)
                        }
                        style={{ width: "100px" }}
                        className="me-3"
                      />
                      <span>{getImportanceString(dealbreaker.importance)}</span>
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end">
                    <div className="d-flex flex-column">
                      <Button
                        variant="link"
                        size="sm"
                        style={{ color: "#dc3545" }}
                        onClick={() => handleRemoveDealbreaker(index)}
                      >
                        <XLg />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))
          )}
        </Col>
      </Row>

      <PotentialGroupsModal
        showModal={activeModal === "allocation" && generatedAllocation}
        handleCancel={handleRejectAllocation}
        handleConfirm={handleAcceptAllocation}
        allocation={generatedAllocation}
        regnerateAllocation={startAllocation}
        criteriaOptions={criteriaOptions}
        dealbreakerOptions={dealbreakerOptions}
      />

      <Modal show={activeModal === "release-allocation"} centered>
        <Modal.Header>
          <Modal.Title>Confirm Allocation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to confirm this allocation and release it to
          students on "
          {selectedAssignment?.name}"?
          Students will immediately be able to access their team details and
          start working.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setActiveModal("allocation")}
            disabled={pending}
          >
            Go Back
          </Button>
          <Button variant="primary" onClick={handleReleaseAllocation} disabled={pending}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal to add new criteria */}
      <Modal
        show={activeModal === "criteria"}
        size="lg"
        scrollable
        onHide={() => setActiveModal(null)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add a new criterion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {criteriaOptions.map((option, idx) => (
              <ListGroup.Item
                key={idx}
                action
                variant="light"
                onClick={() => addNewCriterion(option)}
                className="d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center">
                  {getCategoryIcon(option.category)}
                  <div className="ms-3">
                    <h6 className="mb-0">{option.title}</h6>
                    <p className="small text-muted mb-0">
                      {option.description}
                    </p>
                  </div>
                </div>
                <ChevronRight />
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
      </Modal>

      {/* Modal to add new dealbreaker */}
      <Modal
        show={activeModal === "dealbreaker"}
        size="lg"
        scrollable
        onHide={() => setActiveModal(null)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add a new deal-breaker</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {dealbreakerOptions.map((option, idx) => (
              <ListGroup.Item
                key={idx}
                action
                variant="light"
                onClick={() => addNewDealbreaker(option)}
                className="d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center">
                  {getCategoryIcon(option.category)}
                  <div className="ms-3">
                    <h6 className="mb-0">{option.title}</h6>
                    <p className="small text-muted mb-0">
                      {option.description}
                    </p>
                  </div>
                </div>
                <ChevronRight />
              </ListGroup.Item>
            ))}
          </ListGroup>
          <p className="text-muted mt-3 mb-0">
            Any pairing exclusions set in the students pane will be treated as a
            high importance deal-breaker.
          </p>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default AllocationControls;
