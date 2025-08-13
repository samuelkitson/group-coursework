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
} from "react-bootstrap";
import { XLg } from "react-bootstrap-icons";
import toast from "react-hot-toast";

function AssignmentSettings({ unsaved, markUnsaved, markSaved }) {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [isPending, setIsPending] = useState(false);

  const [assignmentName, setAssignmentName] = useState(selectedAssignment.name);
  const [assignmentDesc, setAssignmentDesc] = useState(selectedAssignment.description);

  const saveChanges = async () => {
    setIsPending(true);
    const updateObj = {
      name: assignmentName,
      description: assignmentDesc,
    };
    api
      .patch(`/api/assignment/${selectedAssignment._id}`, updateObj, { successToasts: true })
      .then(() => {
        markSaved();
        updateSelectedAssignment(updateObj);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const updateName = (newName) => {
    setAssignmentName(newName);
    markUnsaved();
  };

  const updateDesc = (newDesc) => {
    setAssignmentDesc(newDesc);
    markUnsaved();
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Basic settings</h3>
        <SaveButton {...{ isPending, unsaved, saveChanges, size: "sm" }} />
      </div>
      <p className="text-muted">
        Adjust the core assignment settings.
      </p>

      <Form.Group className="mb-4">
        <Form.Label>
          Assignment name
        </Form.Label>
        <Form.Control
          value={assignmentName}
          onChange={(e) => updateName(e.target.value)}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>
          Description
        </Form.Label>
        <Form.Control
          value={assignmentDesc}
          as="textarea"
          rows={4}
          onChange={(e) => updateDesc(e.target.value)}
        />
      </Form.Group>
    </>
  );
}

export default AssignmentSettings;
