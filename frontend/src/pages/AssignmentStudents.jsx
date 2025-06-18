import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col, Card, ListGroup, Spinner, Button, Form, OverlayTrigger, Tooltip, Modal, Table } from "react-bootstrap";

import "./style/AssignmentOverview.css";
import PaginatedListGroup from "@/components/PaginatedListGroup";
import api from "@/services/apiMiddleware";
import toast from "react-hot-toast";
import { Envelope, InfoCircle, PersonFillSlash, PersonSlash, XCircle, XLg } from "react-bootstrap-icons";
import Select from 'react-select';

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function AssignmentStudents() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [studentsList, setStudentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);

  const [pairingExclusionsStudent, setPairingExclusionsStudent] = useState(null);
  const [pairingExclusionsOthers, setPairingExclusionsOthers] = useState([]);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setCsvFile(selectedFile);
    };
  };

  const confirmStudentModal = (student) => {
    setStudentToRemove(student);
    setShowModal("remove-student");
    setPending(false);
  };

  const allStudentIdsNames = studentsList.map(user => ({
    value: user._id,
    label: user.displayName,
  }));

  const showPairingExclusionModal = (student) => {
    setPairingExclusionsStudent(student);
    const otherStudents = allStudentIdsNames.filter(s => student.noPair.includes(s.value));
    setPairingExclusionsOthers(otherStudents);
    setShowModal("pairing-exclusions");
    setPending(false);
  };

  const submitPairingExclusions = () => {
    const reqObject = {
      student: pairingExclusionsStudent._id,
      others: pairingExclusionsOthers.map(s => s.value),
    };
    api
      .put("/api/student/exclusions", reqObject, {successToasts: true})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setPairingExclusionsOthers([]);
        setPairingExclusionsStudent(null);
        setShowModal(null);
        refreshData();
      }).finally(() => {
        setPending(false);
      });
  };

  const removeStudent = () => {
    const reqObject = {
      assignment: selectedAssignment._id,
      student: studentToRemove._id,
    }
    api
      .patch("/api/student/unenrol", reqObject, {successToasts: true})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setStudentsList(studentsList.filter(s => s._id !== studentToRemove._id));
        setShowModal(null);
      }).finally(() => {
        setPending(false);
      });
  };

  const handleSubmitFile = async () => {
    if (!csvFile) return;

    const formData = new FormData();
    formData.append("csv", csvFile);
    formData.append("assignment", selectedAssignment._id);

    await toast.promise(
      api.post("/api/student/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        genericError: true,
      }),
    {
      loading: "Uploading file. This may take a minute...",
      success: () => {
        refreshData();
        setCsvFile(null);
        return "File uploaded successfully!";
      },
    });
    
    setIsUploading(false);
  };

  const refreshData = () => {
    setStudentsList([]);
    setIsLoading(true);
    api
      .get(`/api/assignment/${selectedAssignment._id}/students`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setStudentsList(data);
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
          <h1>Enrolled students</h1>
          <p className="text-muted">
            This page helps you configure the students enrolled on your
            assignment. You can import a CSV of student data, remove students
            who have since left the module and manually add others.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8} sm={12}>
          <Card>
            <Card.Header>Enrolled students</Card.Header>
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
            ) : studentsList.length == 0 ? (
              <Card.Body>
                <Card.Text className="text-muted">
                  No students are enrolled on this assignment yet.
                </Card.Text>
              </Card.Body>
            ) : (
              <PaginatedListGroup itemsPerPage={10} variant="flush">
                {studentsList.map((student, index) => (
                  <ListGroup.Item
                    key={index}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div className="text-break me-3">
                      <span className="fw-bold">{student.displayName}</span>
                      <br />
                      {student.email}
                    </div>
                    <div className="d-flex justify-content-end gap-3 align-items-center">
                      <a
                        href={`mailto:${student.email}`}
                        className="icon-button ms-auto d-flex align-items-center">
                        { <OverlayTrigger overlay={<Tooltip>Send email</Tooltip>} placement="top">
                          <Envelope size={24} />
                        </OverlayTrigger>}
                      </a>
                      <div
                        onClick={() => showPairingExclusionModal(student)}
                        className={`icon-button ms-auto d-flex align-items-center ${student?.noPair?.length > 0 ? "text-warning" : "text-muted"}`}>
                        { <OverlayTrigger overlay={<Tooltip>Pairing exclusions</Tooltip>} placement="top">
                          <PersonSlash size={24} />
                        </OverlayTrigger>}
                      </div>
                      <div
                        onClick={() => confirmStudentModal(student)}
                        className="icon-button ms-auto d-flex align-items-center text-danger">
                        { <OverlayTrigger overlay={<Tooltip>Remove from assignment</Tooltip>} placement="top">
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
          <h3>Add students</h3>
          <p>Add and update student data by uploading a CSV file. Use email
          addresses to identify students.</p>

          <Form.Control type="file" accept=".csv" className="mb-3" onChange={handleFileUpload}/>

          <Button
            className="d-flex align-items-center mb-3 p-0"
            variant="link"
            onClick={() => setShowModal("csv-help")}
          >
            <InfoCircle className="me-2" />See help guide
          </Button>

          <Button variant="primary" disabled={uploading || !csvFile } onClick={handleSubmitFile}>
            {uploading ? "Uploading..." : "Upload CSV"}
          </Button>
        </Col>
      </Row>

      <Modal show={showModal === "csv-help"} onHide={() => setShowModal(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Uploading student data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            New accounts will be created for any students with email addresses
            not already in the system. Student data will be updated for those
            already registered.
          </p>
          <Table striped bordered>
            <thead>
              <tr>
                <th>CSV column name</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>email</td>
                <td>The user's email address, used to uniquely identify them. <b>Required.</b></td>
              </tr>
              <tr>
                <td>displayName</td>
                <td>The user's name as it will be shown to others. <b>Required for new students.</b></td>
              </tr>
              <tr>
                <td>international</td>
                <td>Set to true if they're an international student, or false if they're a home student.</td>
              </tr>
              <tr>
                <td>gender</td>
                <td>Can be any string. Use "male" and "female" where appropriate for consistency.</td>
              </tr>
              <tr>
                <td>marks.overall</td>
                <td>An integer from 0 to 100 representing average mark so far. To provide mark data for a specific module, use a column name like "marks.comp1234".</td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>

      <Modal show={showModal === "remove-student"} onHide={() => setShowModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove "{studentToRemove?.displayName}" from {selectedAssignment.name}?
          If teams have been allocated, they'll be removed and won't be replaced.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={removeStudent} disabled={pending}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showModal === "pairing-exclusions"} onHide={() => setShowModal(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Pairing exclusions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Use this popup to prevent{" "}
          <span className="fw-semibold">{pairingExclusionsStudent?.displayName}</span>{" "}
          being allocated into a group with specific students. Use this option
          if a student has reported another for bullying, for example. This
          applies to all assignments.</p>
          
          <p className="text-muted mb-1">Don't put in a group with:</p>
          <Select
            isMulti
            options={allStudentIdsNames}
            value={pairingExclusionsOthers}
            onChange={(selectedOptions) => setPairingExclusionsOthers(selectedOptions)}
            placeholder="No exclusions set"
            menuPlacement="top"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(null)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={submitPairingExclusions} disabled={pending}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AssignmentStudents;
