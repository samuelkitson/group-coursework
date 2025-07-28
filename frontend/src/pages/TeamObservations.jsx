import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col, Button, Spinner, Card, ButtonGroup, Stack, Modal, Form } from "react-bootstrap";

import "./style/AssignmentOverview.css";
import api from "@/services/apiMiddleware";
import { ArrowLeftShort, CalendarEvent, Eyeglasses, Mortarboard, PlusCircle, QuestionCircleFill, Trash3 } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import toast from "react-hot-toast";

function TeamObservations() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const selectedTeam = useBoundStore((state) => state.getSelectedTeam());
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [obsToDelete, setObsToDelete] = useState(null);
  
  const teamMembers = selectedTeam?.members?.map(m => ({ value: m._id, label: m.displayName, })) ?? [];

  const defaultValues = {
    comment: "",
    students: [],
  };
  const { control, register, reset, getValues, } = useForm({ defaultValues, mode: "onTouched", });

  const showDeleteModal = (observationIdx) => {
    setObsToDelete(observations[observationIdx]);
    setActiveModal("delete-observation");
  };

  const showRecordModal = () => {
    reset(defaultValues);
    setActiveModal("record-observation");
  };

  const hideModal = () => {
    setActiveModal(null);
    setObsToDelete(null);
  };
  
  const handleSubmitDelete = () => {
    api
      .delete(`/api/observation/${obsToDelete._id}`, { successToasts: true, })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const updatedObsList = observations.filter(o => o._id != obsToDelete._id);
        setObservations(updatedObsList);
        hideModal();
      });
  };

  const handleSubmitObservation = () => {
    const { comment, students } = getValues();
    if (!comment) return toast.error("Please provide an observation comment.");
    const postObj = { team: selectedTeam._id, comment, students: students.map(s => s.value) };
    api
      .post("/api/observation", postObj, { successToasts: true })
      .then((resp) => {
        refreshData();
        hideModal();
      });
  };

  const refreshData = () => {
    setIsLoading(true);
    api
      .get(`/api/observation?team=${selectedTeam._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const fetchedObs = data?.observations ?? [];
        const formatted = fetchedObs.map(o => {
          const createdDate = format(parseISO(o.createdAt), "dd MMMM yyyy, HH:mm");
          return {...o, createdAt: createdDate, };
        });
        setObservations(formatted);
        console.log(formatted);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col xs={12} md={9} className="mb-2">
          <Link as={Button} to="/assignment/teams" variant="link" className="p-0 d-flex align-items-center">
            <ArrowLeftShort size="25"/>
            Back to teams overview
          </Link>
        </Col>
        <Col md={9}>
          <h1>Observations (Team {selectedTeam?.teamNumber})</h1>
          <p className="text-muted">
            Observation comments are used to assist marking and moderation, but
            aren't shared with students.
          </p>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              className="d-flex align-items-center"
              onClick={showRecordModal}
            >
              <PlusCircle className="me-2" />Record observation
            </Button>
          </div>
        </Col>
      </Row>

      { isLoading &&
        <div className="mt-4 d-flex align-items-center text-muted">
          <Spinner className="me-3" />
          Loading...
        </div>
      }

      { (!isLoading && observations.length === 0) && 
        <Card className="mt-2 shadow">
          <Card.Body>
            <Card.Title className="d-flex align-items-center">
              <QuestionCircleFill className="me-2" /> No observations
            </Card.Title>
            <p className="text-muted mb-0">
              No observations have been recorded about Team {selectedTeam?.teamNumber} yet.
            </p>
          </Card.Body>
        </Card>
      }

      <Row>
        <Col md={9}>
          { observations.map((observation, idx) => (
            <Card className="mt-2 mb-3 shadow" key={observation._id}>
              <Card.Body className="py-2">
                <Row>
                  <Col xs={10}>
                    <p className="mb-2" style={{ whiteSpace: "pre-wrap" }}>
                      {observation?.comment}
                    </p>
                    
                    {observation?.students?.length > 0 && (
                      <p className="text-muted small mb-0">
                        <Mortarboard className="me-2" />
                        {observation.students.map(s => s.displayName).join(", ")}
                      </p>
                    )}

                    <p className="text-muted small mb-0">
                      Recorded by {observation?.observer?.displayName} on {observation?.createdAt ?? "Unknown date"}
                    </p>
                  </Col>
                  <Col xs={2} className="d-flex align-items-center justify-content-end">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className=""
                      onClick={() => showDeleteModal(idx)}
                    >
                      <Trash3 />
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>

      <Modal show={activeModal === "delete-observation"} centered onHide={hideModal}>
        <Modal.Header closeButton>
          <Modal.Title>Delete observation?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this observation? You can't undo this
          action.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={hideModal}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmitDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === "record-observation"} centered size="lg" onHide={hideModal}>
        <Modal.Header closeButton>
          <Modal.Title>Record observation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Record a new observation about Team {selectedTeam?.teamNumber}. This
            will be visible to module staff and the team's supervisors, but not
            the students themselves. Your comments will be used to justify marks
            given to this team.
          </p>
          <div className="mt-2">
            <Form.Control
              as="textarea"
              name="comment"
              rows={3}
              {...register("comment")}
              placeholder="Observation comments"
            />
          </div>
          
          <div className="mt-2">
            <Form.Label>
              If this observation is about specific students, select them below:
            </Form.Label>
            <Controller
                name="students"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={teamMembers}
                    placeholder="Select students (optional)"
                    isMulti={true}
                  />
                )}
              />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={hideModal}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitObservation}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TeamObservations;
