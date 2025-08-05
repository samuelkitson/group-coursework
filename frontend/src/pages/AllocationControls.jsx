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
  FloatingLabel,
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
  GearWideConnected,
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
import { FormProvider, useFieldArray, useForm, useFormState } from "react-hook-form";
import CriterionBlock from "@/features/allocate/CriterionBlock";
import DealbreakerBlock from "@/features/allocate/DealbreakerBlock";

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
  const [groupSize, setGroupSize] = useState(5);
  const [surplusLargerGroups, setSurplusLargerGroups] = useState(false);

  // Stores the current allocation setup (a React-Hook-Form to reduce renders)
  const defaultValues = {
    criteria: [],
    dealbreakers: [],
  };
  const formMethods = useForm(defaultValues);
  const { control, getValues, trigger, reset, } = formMethods;
  const { isDirty, dirtyFields } = useFormState({ control });
  const { fields: criteriaFields, append: appendCriterion, remove: removeCriterion, move: moveCriterion }
   = useFieldArray({ control, name: "criteria" });
  const { fields: dealbreakersFields, append: appendDealbreaker, remove: removeDealbreaker }
   = useFieldArray({ control, name: "dealbreakers" });

  const [pending, setPending] = useState(false);

  const [activeModal, setActiveModal] = useState(false);

  const [generatedAllocation, setGeneratedAllocation] = useState(null);

  const addNewCriterion = (newCriterion) => {
    // Add default values
    if (newCriterion?.options?.includes("goal"))
      newCriterion.goal = "similar";
    appendCriterion(newCriterion);
    setActiveModal(null);
    setTimeout(() => {
      const newIndex = criteriaFields.length;
      document
        .getElementById(`criterion-${newIndex}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const addNewDealbreaker = (newDealbreaker) => {
    newDealbreaker.importance = 2;
    appendDealbreaker(newDealbreaker);
    setActiveModal(null);
    setTimeout(() => {
      const newIndex = dealbreakersFields.length;
      document
        .getElementById(`dealbreaker-${newIndex}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const updateGroupSize = (newSize) => {
    setGroupSize(newSize);
    // setUnsaved(true);
  };

  const updateSurplusLarger = (allocateUpwards) => {
    setSurplusLargerGroups(allocateUpwards);
    // setUnsaved(true);
  };

  const refreshData = () => {
    setCriteriaOptions([]);
    reset(defaultValues);
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
        // setCriteria(data?.criteria ?? []);
        // setDealbreakers(data?.dealbreakers ?? []);
        setGroupSize(data?.groupSize ?? 5);
        setSurplusLargerGroups(data?.surplusLargerGroups ?? false);
      });
  };
  
  const startAllocation = () => {
    if (criteriaFields.length === 0) {
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
      case "custom":
        return <GearWideConnected />;
      default:
        return <PersonArmsUp />;
    }
  };
  const saveChanges = async () => {
    // Try to validate the form fields first
    const isValid = await trigger();
    if (!isValid)
      return toast.error("Please complete all fields before saving.");
    setPending(true);
    const { criteriaFields } = getValues();
    const updateObj = {
      groupSize: groupSize,
      surplusLargerGroups: surplusLargerGroups,
      criteria: criteriaFields,
      dealbreakers: dealbreakersFields,
    };
    api
      .put(`/api/allocation/${selectedAssignment._id}/setup`, updateObj, {
        successToasts: true,
      })
      .then(() => {
        reset(getValues());
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
        // setUnsaved(false);
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
    <FormProvider {...formMethods}>
      <Row className="mb-4">
        <Col md={9} className="mb-3 mb-md-0">
          <h1>
            Allocation <UnsavedChanges unsaved={isDirty} />
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
              disabled={pending || !isDirty}
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
              disabled={pending || isDirty}
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
          {criteriaFields.length === 0 ? (
            <p className="text-muted">
              Click the <PlusCircleFill /> button to add a new allocation
              criterion.
            </p>
          ) : (
            criteriaFields.map((field, index) => (
              <CriterionBlock
                key={field.id}
                index={index}
                id={`criterion-${index}`}
                remove={removeCriterion}
                move={moveCriterion}
                isFirst={index === 0}
                isLast={index === criteriaFields.length - 1}
              />
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

          {dealbreakersFields.length === 0 ? (
            <p className="text-muted">
              Click the <PlusCircleFill /> button to add a new allocation
              dealbreaker.
            </p>
          ) : (
            dealbreakersFields.map((field, index) => (
              <DealbreakerBlock
                key={field.id}
                index={index}
                id={`dealbreaker-${index}`}
                remove={removeDealbreaker}
                isFirst={index === 0}
                isLast={index === dealbreakersFields.length - 1}
              />
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
                    <h6 className="mb-0">{option.name}</h6>
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
                    <h6 className="mb-0">{option.name}</h6>
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
    </FormProvider>
    </>
  );
}

export default AllocationControls;
