import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col, Button, Spinner, Card, ButtonGroup, Stack, Modal } from "react-bootstrap";

import "./style/AssignmentOverview.css";
import api from "@/services/apiMiddleware";
import { ArrowLeftShort, CalendarEvent, Eyeglasses, Mortarboard, QuestionCircleFill, Trash3 } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";

function TeamObservations() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const selectedTeam = useBoundStore((state) => state.getSelectedTeam());
  const [observations, setObservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [obsToDelete, setObsToDelete] = useState(null);

  const showDeleteModal = (observationIdx) => {
    setObsToDelete(observations[observationIdx]);
    setActiveModal("delete-observation");
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
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col xs={12} className="mb-2">
          <Link as={Button} to="/assignment/teams" variant="link" className="p-0 d-flex align-items-center">
            <ArrowLeftShort size="25"/>
            Back to teams overview
          </Link>
        </Col>
        <Col md={9}>
          <h1>Observations (Team {selectedTeam?.teamNumber})</h1>
          <p className="text-muted">
            View observation notes added by staff and supervisors for Team {selectedTeam?.teamNumber}.
          </p>
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
                    <p className="mb-2">
                      {`"${observation?.comment}"`}
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
          <Modal.Title>Delete observation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete ths observation? You can't undo this
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
    </>
  );
}

export default TeamObservations;
