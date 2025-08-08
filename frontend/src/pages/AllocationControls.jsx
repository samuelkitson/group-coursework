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
  Table,
} from "react-bootstrap";
import {
  ArrowsCollapseVertical,
  CardChecklist,
  CheckCircleFill,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clipboard2Data,
  CloudUpload,
  CloudUploadFill,
  File,
  FiletypeCsv,
  Floppy2Fill,
  GearWideConnected,
  Globe2,
  HourglassSplit,
  PencilSquare,
  PersonArmsUp,
  PersonVideo3,
  PlusCircleFill,
  QuestionCircle,
  Upload,
  XLg,
} from "react-bootstrap-icons";

import "./style/AllocationControls.css";
import UnsavedChanges from "@/components/UnsavedChanges";
import PotentialGroupsModal from "@/features/allocate/PotentialGroupsModal";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Controller, FormProvider, useFieldArray, useForm, useFormState, useWatch } from "react-hook-form";
import CriterionBlock from "@/features/allocate/CriterionBlock";
import DealbreakerBlock from "@/features/allocate/DealbreakerBlock";
import DatasetUpload from "@/features/allocate/DatasetUpload";

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

  // Stores the current allocation setup (a React-Hook-Form to reduce renders)
  const defaultValues = {
    criteria: [],
    dealbreakers: [],
    groupSize: 5,
    surplusLargerGroups: false,
  };
  const formMethods = useForm(defaultValues);
  const { control, getValues, trigger, reset, register, } = formMethods;
  const { isDirty, dirtyFields } = useFormState({ control });
  const { fields: criteriaFields, append: appendCriterion, remove: removeCriterion, move: moveCriterion }
   = useFieldArray({ control, name: "criteria" });
  const { fields: dealbreakersFields, append: appendDealbreaker, remove: removeDealbreaker }
   = useFieldArray({ control, name: "dealbreakers" });

  const groupSize = useWatch({ name: "groupSize", control });

  const [pending, setPending] = useState(false);
  const [datasetFile, setDatasetFile] = useState(null);
  const [requiredColumns, setRequiredColumns] = useState(null);
  const [datasetColumns, setDatasetColumns] = useState(null);

  const [activeModal, setActiveModal] = useState(false);

  const [generatedAllocation, setGeneratedAllocation] = useState(null);

  const addNewCriterion = (newCriterion) => {
    newCriterion.expanded = false;
    // Add default values
    if (newCriterion?.options?.includes("goal")) {
      if (newCriterion?.type === "boolean") {
        newCriterion.goal = "proportional";
      } else {
        newCriterion.goal = "similar";
      }
    }
    if (newCriterion?.options?.includes("ignoreMissing"))
      newCriterion.ignoreMissing = true;
    if (newCriterion?.options?.includes("attribute"))
      newCriterion.attribute = "";
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
    newDealbreaker.expanded = false;
    // Add default values
    if (newDealbreaker?.options?.includes("operator")) {
      if (newDealbreaker.name.includes("boolean")) {
        newDealbreaker.operator = "max_true";
      } else {
        newDealbreaker.operator = "max_per_value";
      }
      newDealbreaker.operand = 1;
    }
    if (newDealbreaker?.options?.includes("ignoreMissing"))
      newDealbreaker.ignoreMissing = true;
    if (newDealbreaker?.options?.includes("attribute"))
      newDealbreaker.attribute = "";
    appendDealbreaker(newDealbreaker);
    setActiveModal(null);
    setTimeout(() => {
      const newIndex = dealbreakersFields.length;
      document
        .getElementById(`dealbreaker-${newIndex}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const getRequiredDatasetCols = () => {
    const requiredCols = new Set(["email"]);
    const { criteria, dealbreakers } = getValues();
    criteria.forEach(c => { if (c?.attribute) requiredCols.add(c.attribute); });
    dealbreakers.forEach(d => { if (d?.attribute) requiredCols.add(d.attribute); });
    let requiredColsArr;
    if (requiredCols.length === 1) {
      requiredColsArr = [];
    } else {
      requiredColsArr = Array.from(requiredCols);
    }
    setRequiredColumns(requiredColsArr);
    return requiredColsArr;
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
        // Load the returned data into the form
        reset(data);
      });
  };
  
  const startAllocation = () => {
    if (criteriaFields.length === 0) {
      toast.error("You must configure some allocation criteria first.");
      return;
    }
    const requiredCols = getRequiredDatasetCols();
    if (requiredCols.length > 1 && !datasetFile) {
      toast.error("You need to upload a dataset before starting allocation.");
      setActiveModal("dataset-upload");
      return;
    }
    // Add the dataset (if provided)
    const formData = new FormData();
    if (datasetFile) {
      formData.append("dataset", datasetFile);
    }
    setPending(true);
    api
      .post(`/api/allocation/${selectedAssignment._id}/run`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
      }})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setGeneratedAllocation(data);
        if (activeModal !== "allocation") setActiveModal("allocation");
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
      case "custom":
        return <PencilSquare />;
    }
  };

  const showDatasetUploadModal = () => {
    getRequiredDatasetCols();
    setActiveModal("dataset-upload");
  }

  const handleDatasetUpload = (file, columns) => {
    setDatasetFile(file);
    setDatasetColumns(columns);
  };

  const saveChanges = async () => {
    // Try to validate the form fields first
    const isValid = await trigger();
    if (!isValid)
      return toast.error("Please complete all fields before saving.");
    setPending(true);
    const { criteria, dealbreakers, groupSize, surplusLargerGroups } = getValues();
    const updateObj = {
      criteria: criteria.map(c => ({ name: c.name, goal: c?.goal, attribute: c?.attribute, ignoreMissing: c?.ignoreMissing, })),
      dealbreakers: dealbreakers.map(d => ({ name: d.name, importance: d.importance, attribute: d?.attribute, operator: d?.operator, operand: d?.operand, ignoreMissing: d?.ignoreMissing, })),
      groupSize,
      surplusLargerGroups
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
            <Col md={12} className="d-flex align-items-center flex-wrap">
              <span className="me-2">Create groups of</span>
              
              <Controller
                name="groupSize"
                control={control}
                defaultValue={5}
                render={({ field }) => (
                  <Dropdown className="me-1">
                    <Dropdown.Toggle variant="light" size="sm" className="border px-1 py-0">
                      <span className="me-1">{field.value || 5} students</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu style={{ maxHeight: '200px', overflowY: 'auto' }} >
                      {Array.from({ length: 19 }, (_, i) => i + 2).map(size => (
                        <Dropdown.Item 
                          key={size}
                          onClick={() => {
                            field.onChange(size);
                          }}
                        >
                          {size}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              />
              
              <span className="me-2">, allowing groups of</span>
              
              <Controller
                name="surplusLargerGroups"
                control={control}
                defaultValue={false}
                render={({ field }) => {
                  let alternativeSize = 0;
                  if (groupSize) {
                    alternativeSize = field.value 
                      ? parseInt(groupSize) + 1 
                      : parseInt(groupSize) - 1;
                  } else {
                    alternativeSize = field.value ? 6 : 4; // defaults based on default groupSize of 5
                  }
                  
                  return (
                    <Dropdown className="me-1">
                      <Dropdown.Toggle variant="light" size="sm" className="border px-1 py-0">
                        <span className="me-1">{alternativeSize} students</span>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => field.onChange(false)}>
                          {parseInt(groupSize || 5) - 1} (smaller groups)
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => field.onChange(true)}>
                          {parseInt(groupSize || 5) + 1} (larger groups)
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  );
                }}
              />
              
              <span>where necessary.</span>
            </Col>
          </Row>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end">
          <div className="d-grid gap-2">
            <Button
              className="d-flex align-items-center"
              onClick={showDatasetUploadModal}
            >
              <Upload className="me-2" />
              { datasetFile ? "Change dataset" : "Upload dataset" }
            </Button>
            { isDirty &&
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
            }
            { !isDirty &&
            <Button
              disabled={pending || isDirty}
              variant="success"
              className="d-flex align-items-center"
              onClick={startAllocation}
            >
              <CheckCircleFill className="me-2" /> Start allocation
            </Button>
            }
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
        requiredAttributes={requiredColumns}
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
      
      <DatasetUpload
       showModal={activeModal === "dataset-upload"}
       onHide={() => setActiveModal(null)}
       currentFileName={datasetFile?.name}
       datasetColumns={datasetColumns}
       requiredColumns={requiredColumns}
       handleDatasetUpload={handleDatasetUpload}
      />
    </FormProvider>
    </>
  );
}

export default AllocationControls;
