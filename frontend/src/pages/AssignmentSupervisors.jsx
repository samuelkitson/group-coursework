import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col, Card, OverlayTrigger, Tooltip, Spinner, ListGroup, Modal, Button, Form, InputGroup } from "react-bootstrap";

import "./style/AssignmentOverview.css";
import { Envelope, InfoCircle, XCircle } from "react-bootstrap-icons";
import api from "@/services/apiMiddleware";
import PaginatedListGroup from "@/components/PaginatedListGroup";
import { useForm, useFormState } from "react-hook-form";

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function AssignmentSupervisors() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const fetchAssignments = useBoundStore((state) => state.fetchAssignments);
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setIsPending] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const defaultValues = { newSupervisor: "" };
  const { control, register, reset, getValues, } = useForm({
    defaultValues, mode: "onTouched"
  });
  const { isValid, errors, } = useFormState({ control });

  const teamsHelpText = (teamsList) => {
    if (!teamsList || teamsList.length === 0)
      return (<span className="text-muted">Not supervising any teams</span>)
    const teamsString = teamsList.map(t => t.teamNumber.toString()).join(", ");
    return `Supervising Team${teamsList.length === 1 ? "" : "s"} ${teamsString}`
  };

  const showDeleteModal = (supervisor) => {
    setSupervisorToDelete(supervisor);
    setActiveModal("delete-supervisor");
  };

  const removeSupervisor = async () => {
    const newSupervisorsList = supervisorsList.filter(s => s._id !== supervisorToDelete._id);
    setIsLoading(true);
    api
      .delete(`/api/assignment/${selectedAssignment._id}/supervisors/${supervisorToDelete._id}`, { successToasts: true })
      .then((resp) => {
        setActiveModal(null);
        setSupervisorToDelete(null);
        // This will trigger a page reload to refresh the supervisors list
        updateSelectedAssignment({supervisors: newSupervisorsList});
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const addOneSupervisor = async () => {
    const { newSupervisor } = getValues();
    if (newSupervisor.trim() === "") return;
    setIsPending(true);
    const updateObj = { supervisor: newSupervisor.trim() };
    api
      .post(`/api/assignment/${selectedAssignment._id}/supervisors`, updateObj, { successToasts: true })
      .then((resp) => {
        fetchAssignments(true);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const refreshData = () => {
    setSupervisorsList([]);
    setIsLoading(true);
    reset(defaultValues);
    api
      .get(`/api/assignment/${selectedAssignment._id}/supervisors`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setSupervisorsList(data.supervisors);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Supervisors</h1>
          <p className="text-muted">
            Supervisors can view meeting minutes and insights data for teams
            they supervise. They can also add private notes about their progress
            to help you moderate marks later on.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8} sm={12}>
          <Card>
            <Card.Header>Supervisors</Card.Header>
            {isLoading ? (
              <Card.Body>
                <div className="d-flex">
                  <Spinner
                    animation="border"
                    variant="secondary"
                    className="me-3"
                  />
                  <Card.Text className="text-muted">Loading...</Card.Text>
                </div>
              </Card.Body>
            ) : supervisorsList.length == 0 ? (
              <Card.Body>
                <Card.Text className="text-muted">
                  No supervisors have been added to this assignment yet.
                </Card.Text>
              </Card.Body>
            ) : (
              <PaginatedListGroup itemsPerPage={10} variant="flush">
                {supervisorsList.map((supervisor, index) => (
                  <ListGroup.Item
                    key={supervisor._id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="text-break me-3">
                      <span className="fw-bold">{supervisor.displayName}</span>
                      <br />
                      {teamsHelpText(supervisor.teams)}
                    </div>
                    <div className="d-flex justify-content-end gap-3 align-items-center">
                      <a
                        href={`mailto:${supervisor.email}?subject=${selectedAssignment.name}`}
                        className="icon-button ms-auto d-flex align-items-center">
                        { <OverlayTrigger overlay={<Tooltip>Send email</Tooltip>} placement="top">
                          <Envelope size={24} />
                        </OverlayTrigger>}
                      </a>
                      <div
                        onClick={() => showDeleteModal(supervisor)}
                        className="icon-button ms-auto d-flex align-items-center text-danger">
                        { <OverlayTrigger overlay={<Tooltip>Remove supervisor</Tooltip>} placement="top">
                          <XCircle size={20} />
                        </OverlayTrigger>}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </PaginatedListGroup>
            )}
          </Card>
        </Col>
        <Col lg={4} sm={12}>
          <h3>Add supervisors</h3>
          <p>
            Add supervisors one at a time with their email addresses, or in bulk
            by uploading a text file with one email address per line.
          </p>

          <InputGroup>
            <Form.Control
              placeholder="Email address"
              className={errors?.newSupervisor && "border-danger"}
              disabled={pending}
              {...register("newSupervisor", {
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Enter a valid email address",
                }
              })}
            />
            <Button
              onClick={addOneSupervisor}
              variant="primary"
              disabled={pending || errors?.newSupervisor}
            >
              Add
            </Button>
          </InputGroup>
          <p className="mt-1 text-danger">{errors?.newSupervisor?.message}</p>
        </Col>
      </Row>

      <Modal show={activeModal === "delete-supervisor"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove supervisor</Modal.Title>
        </Modal.Header>
        { supervisorToDelete?.teams?.length === 0 ?
          <Modal.Body>
            Are you sure you want to remove {supervisorToDelete?.displayName}{" "}
            from {selectedAssignment.name}? They aren't currently supervising
            any teams.
          </Modal.Body>
        : 
          <Modal.Body>
            Are you sure you want to remove {supervisorToDelete?.displayName}{" "}
            from {selectedAssignment.name}?<br />
            They are currently supervising {supervisorToDelete?.teams?.length}{" "}
            team{supervisorToDelete?.teams?.length === 1 ? "" : "s"}. You should
            make sure to allocate a new supervisor to those teams if necessary.
          </Modal.Body>
        }
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={removeSupervisor} disabled={pending}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AssignmentSupervisors;
