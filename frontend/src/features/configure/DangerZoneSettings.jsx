import SaveButton from "@/components/SaveButton";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { ASSIGNMENT_STATES } from "@/utility/helpers";
import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  ListGroup,
  InputGroup,
  Container,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import { ArrowRepeat, CircleFill, Icon1Circle, Icon1CircleFill, Icon2CircleFill, Icon3CircleFill, Icon4CircleFill, Icon5CircleFill, Trash3Fill, XLg } from "react-bootstrap-icons";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const getCircleIcon = (number) => {
  switch (number) {
    case 1:
      return Icon1CircleFill;
    case 2:
      return Icon2CircleFill;
    case 3:
      return Icon3CircleFill;
    case 4:
      return Icon4CircleFill;
    case 5:
      return Icon5CircleFill;
    default:
      return CircleFill;
  }
}

function DangerZoneSettings() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
    const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [secondaryConfirmation, setSecondaryConfirmation] = useState(false);
  const [newState, setNewState] = useState(null);

  const showMoveStateModal = () => {
    setNewState(null);
    setActiveModal("change-state");
  }

  const showDeleteConfirmation = () => {
    setSecondaryConfirmation(false);
    setActiveModal("confirm-delete");
  }

  const confirmDelete = async () => {
    setIsPending(true);
    api
      .delete(`/api/assignment/${selectedAssignment._id}?force=${secondaryConfirmation.toString()}`, {
        successToasts: true,
      })
      .then(() => {
        navigate("/dashboard");
        updateSelectedAssignment(null);
      })
      .finally(() => {
        setIsPending(false);
        setActiveModal(null);
      });
  };

  const confirmMoveState = async () => {
    setIsPending(true);
    const updateObj = {
      newState,
      force: true,
    };
    api
      .patch(`/api/assignment/${selectedAssignment._id}/state`, updateObj, {
        successToasts: true,
      })
      .then(() => {
        updateSelectedAssignment({ state: newState });
      })
      .finally(() => {
        setIsPending(false);
        setActiveModal(null);
      });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Danger zone</h3>
      </div>
      <p className="text-muted">
        Be careful! The settings here shouldn't normally be needed and can be
        destructive.
      </p>

      <Button
        variant="primary"
        className="d-flex align-items-center mb-2"
        onClick={showMoveStateModal}
        disabled={isPending}
      >
        <ArrowRepeat className="me-2" /> Change assignment state
      </Button>

      <Button
        variant="danger"
        className="d-flex align-items-center mb-2"
        onClick={showDeleteConfirmation}
        disabled={isPending}
      >
        <Trash3Fill className="me-2" /> Delete assignment
      </Button>

      <Modal show={activeModal === "change-state"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change assignment state</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Use this menu to change the assignment to a state out of the normal
          order. Select the new state from the available options below and then
          click confirm.

          <div className="d-grid gap-2 mt-3">
            { ASSIGNMENT_STATES.map((state, index) => {
              const CircleIcon = getCircleIcon(index + 1);
              let variant = "outline-primary";
              let disabled = false;
              if (state.id === selectedAssignment.state) {
                variant = "outline-primary";
                disabled = true;
              } else if (state.id === newState) {
                variant = "primary";
                disabled = false;
              } else if (state.id === "live" && "closed" !== selectedAssignment.state) {
                variant = "outline-secondary";
                disabled = true;
              } else if (state.id === "closed" && selectedAssignment.state !== "live") {
                variant = "outline-secondary";
                disabled = true;
              } 
              return (
               <Button
                key={index}
                className="d-flex align-items-center"
                variant={variant}
                disabled={disabled}
                onClick={() => {setNewState(state.id)}}
              >
                <CircleIcon className="me-2" />
                {state.name}{state.id === selectedAssignment.state && " (current)"}
              </Button>
            )})}
          </div>
          
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={confirmMoveState}
            disabled={isPending || !newState}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === "confirm-delete"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the assignment "{selectedAssignment.name}"?
          This cannot be undone.

          <Form.Check
            label="I definitely want to delete this assignment."
            checked={secondaryConfirmation}
            onChange={(e) => setSecondaryConfirmation(e.target.checked)}
            className="mt-3"
          />
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={isPending || !secondaryConfirmation}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default DangerZoneSettings;
