import SaveButton from "@/components/SaveButton";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
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
import { Trash3Fill, XLg } from "react-bootstrap-icons";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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

  const showConfirmation = () => {
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
        setIsPending(false);
        navigate("/dashboard");
        updateSelectedAssignment(null);
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
        variant="danger"
        className="d-flex align-items-center"
        onClick={showConfirmation}
        disabled={isPending}
      >
        <Trash3Fill className="me-2" /> Delete assignment
      </Button>

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
