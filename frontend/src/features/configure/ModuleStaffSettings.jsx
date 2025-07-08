import SaveButton from "@/components/SaveButton";
import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  InputGroup,
  ListGroup,
  ListGroupItem,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { ShieldFillCheck, Trash2Fill, Trash3Fill, XLg } from "react-bootstrap-icons";
import toast from "react-hot-toast";
function ModuleStaffSettings({ unsaved, markUnsaved, markSaved }) {
  const { user } = useAuthStore();
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [moduleStaff, setModuleStaff] = useState([]);
  const [searchString, setSearchString] = useState("");
  
  const addPerson = () => {
    api.get(`/api/auth/search?string=${searchString}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        if (!data.users || data.users.length === 0)
          return toast.error("No matches found. Please make sure they've already logged in to create an account.");
        if (data.users.length > 1)
          return toast.error(`Multiple users matched ${searchString}. Please try their email address instead.`);
        const bestMatch = data.users[0];
        if (bestMatch.role === "student") {
          setSearchString("");
          return toast.error(`${bestMatch.displayName} is a student, not a member of staff.`);
        }
        if (moduleStaff.some(m => m._id === bestMatch._id)) {
          setSearchString("");
          return toast.error(`${bestMatch.displayName} is already a lecturer on this module.`);
        }
        setModuleStaff([...moduleStaff, bestMatch]);
        setSearchString("");
        toast.success(`${bestMatch.displayName} has been added as a lecturer on ${selectedAssignment.name}.`);
      });
  };
  
  useEffect(() => {
    setModuleStaff(selectedAssignment.lecturers);
  }, [selectedAssignment]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Module staff</h3>
      </div>
      <p className="text-muted">
        Adjust the list of teaching staff with access to {selectedAssignment.name}.
        To add another staff member, first make sure they've logged into the app
        before and then enter their email address below.
      </p>

      <InputGroup className="mb-3">
        <Form.Control
          placeholder="Email address or full name"
          type="email"
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
        />
        <Button
          onClick={addPerson}
          variant="primary"
          disabled={!searchString}
        >
          Add
        </Button>
      </InputGroup>

      <ListGroup>
      { moduleStaff.map((lecturer, idx) => (
        <ListGroup.Item
          key={lecturer._id}
          className="d-flex justify-content-between align-items-center"
        >
          <div>
            {lecturer.displayName}
            {lecturer.role === "admin" && (
              <OverlayTrigger
                placement="right"
                overlay={<Tooltip>Administrator</Tooltip>}
              >
                <span className="ms-2 text-secondary">
                  <ShieldFillCheck />
                </span>
              </OverlayTrigger>
            )}
            <br/>
            <span className="text-muted">{lecturer.email}</span>
          </div>
          <Button
            size="sm"
            variant="outline-danger"
            className="rounded-circle"
            disabled={lecturer._id === user.userId}
          >
            <XLg />
          </Button>
        </ListGroup.Item>
      ))}
      </ListGroup>
    </>
  );
}

export default ModuleStaffSettings;
