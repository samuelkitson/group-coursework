import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { nextAssignmentState } from "@/utility/helpers";
import React, { useState } from "react";
import { Card, Button, Modal } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";

const AdvanceAssignmentStateCard = ({ onAdvance }) => {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [showModal, setShowModal] = useState(false);
  const [pending, setPending] = useState(false);

  const nextState = nextAssignmentState(selectedAssignment.state);
  
  const helpText = ({
    "pre-allocation": "Click the button below to open the allocation questionnaire to students.",
    "allocation-questions": "Click the button below to close the allocation questionnaire and start allocation.",
    "allocation": "Finalise the teams on the allocation page to announce them to students and start the assignment.",
    "live": "Click the button below to lock the assignment and mark it as complete.",
    "closed": "All done! This assignment has been marked as closed",
  })[selectedAssignment.state] ?? "Your assignment is in an unknown state!";

  const buttonText = ({
    "pre-allocation": "Open questionnaire",
    "allocation-questions": "Close questionnaire",
    "allocation": null,
    "live": "Close assignment",
    "closed": null,
  })[selectedAssignment.state] ?? false; 

  const saveChanges = async () => {
    if (!nextState) return;
    setPending(true);
    const updateObj = {
      newState: nextState.id,
    };
    api
      .patch(`/api/assignment/${selectedAssignment._id}/state`, updateObj, {
        successToasts: true,
      })
      .then(() => {
        setPending(false);
        updateSelectedAssignment({ state: nextState.id });
      })
      .finally(() => {
        setPending(false);
        setShowModal(false);
      });
  };

  return (
    <Card className="p-3 mb-3">
      <Card.Body className="py-0">
        <h5 className="text-center mb-3">Assignment state</h5>
        <Card.Text className="mt-2 text-muted">
          {helpText}
        </Card.Text>
        {buttonText && <Button
          variant="primary"
          className="d-flex align-items-center"
          onClick={() => setShowModal(true)}
          disabled={pending}
        >
          {buttonText} <ChevronRight className="ms-2" />
        </Button>}
      </Card.Body>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to move this assignment to the state "
          {nextState?.staffName}"?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={saveChanges} disabled={pending}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AdvanceAssignmentStateCard;
