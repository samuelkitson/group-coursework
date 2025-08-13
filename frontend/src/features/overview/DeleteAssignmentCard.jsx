import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Modal } from "react-bootstrap";

const DeleteAssignmentCard = () => {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [pending, setPending] = useState(false);

  const confirmDelete = async () => {
    setPending(true);
    api
      .delete(`/api/assignment/${selectedAssignment._id}`, {
        successToasts: true,
      })
      .then(() => {
        setPending(false);
        navigate("/dashboard");
        updateSelectedAssignment(null);
      })
      .finally(() => {
        setPending(false);
        setActiveModal(null);
      });
  };

  return (
    <Card className="p-3 shadow h-100">
      <Card.Body className="py-0">
        <h5 className="text-center mb-3">Delete assignment</h5>
        <Card.Text className="mt-2 text-muted">
          This assignment hasn't been made public to students yet, so if you've
          made a mistake you can delete it.
        </Card.Text>
        <Button
          variant="danger"
          className="d-flex align-items-center"
          onClick={() => setActiveModal("confirm-delete")}
          disabled={pending}
        >
          Delete
        </Button>
      </Card.Body>

      <Modal show={activeModal === "confirm-delete"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the assignment "{selectedAssignment.name}"?
          This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={pending}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default DeleteAssignmentCard;
