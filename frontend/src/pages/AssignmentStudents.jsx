import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import Papa from "papaparse";
import { Row, Col, Card, ListGroup, Spinner, Button, Form, OverlayTrigger, Tooltip, Modal, Table } from "react-bootstrap";

import "./style/AssignmentOverview.css";
import PaginatedListGroup from "@/components/PaginatedListGroup";
import api from "@/services/apiMiddleware";
import toast from "react-hot-toast";
import { Download, Envelope, InfoCircle, PersonFillSlash, PersonSlash, Trash3Fill, Upload, XCircle, XLg } from "react-bootstrap-icons";
import Select from 'react-select';

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function AssignmentStudents() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [studentsList, setStudentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [whileLiveNewGroup, setWhileLiveNewGroup] = useState(null);

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
    setActiveModal("remove-student");
    setIsPending(false);
  };

  const allStudentIdsNames = studentsList.map(user => ({
    value: user._id,
    label: user.displayName,
  }));

  const showPairingExclusionModal = (student) => {
    setPairingExclusionsStudent(student);
    const otherStudents = allStudentIdsNames.filter(s => student.noPair.includes(s.value));
    setPairingExclusionsOthers(otherStudents);
    setActiveModal("pairing-exclusions");
    setIsPending(false);
  };

  const submitPairingExclusions = () => {
    // First keep the excluded students who aren't on this module so we don't
    // overwrite their pairing exclusions by accident.
    const otherAssignmentExclusions = pairingExclusionsStudent?.noPair?.filter(n => allStudentIdsNames.find(s => s.value === n) == null);
    const exclusions = otherAssignmentExclusions.concat(pairingExclusionsOthers.map(s => s.value));
    const reqObject = {
      student: pairingExclusionsStudent._id,
      others: exclusions,
    };
    setIsPending(true);
    api
      .put("/api/student/exclusions", reqObject, {successToasts: true})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setPairingExclusionsOthers([]);
        setPairingExclusionsStudent(null);
        setActiveModal(null);
        refreshData();
      }).finally(() => {
        setIsPending(false);
      });
  };

  const showRemoveAllModal = () => {
    setActiveModal("remove-all");
  };

  const handleRemoveAll = () => {
    const reqObject = {
      assignment: selectedAssignment._id,
    };
    setIsPending(true);
    api
      .post("/api/student/unenrol-all", reqObject, { successToasts: true })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setStudentsList([]);
        setActiveModal(null);
        updateSelectedAssignment({ students: [] });
      }).finally(() => {
        setIsPending(false);
      });
  };

  const downloadCsvTemplate = () => {
    // Create CSV content with headers.
    const csvContent = Papa.unparse([["email", "name"], ["js1g25@soton.ac.uk", "John Smith"]]);
    // Create blob and download.
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Student template.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Template CSV downloaded successfully.");
  };

  const removeStudent = () => {
    const reqObject = {
      assignment: selectedAssignment._id,
      student: studentToRemove._id,
    }
    setIsPending(true);
    api
      .patch("/api/student/unenrol", reqObject, {successToasts: true})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const newStudentsList = studentsList.filter(s => s._id !== studentToRemove._id);
        setStudentsList(newStudentsList);
        setActiveModal(null);
        updateSelectedAssignment({ students: newStudentsList.map(s => s._id.toString()) });
      }).finally(() => {
        setIsPending(false);
      });
  };

  const handlePreSubmitFile = () => {
    setWhileLiveNewGroup(null);
    if (selectedAssignment.state === "live") {
      setActiveModal("upload-while-live");
    } else {
      handleSubmitFile();
    }
  }

  const handleSubmitFile = async () => {
    if (!csvFile) return;

    const formData = new FormData();
    formData.append("students", csvFile);
    formData.append("assignment", selectedAssignment._id);
    if (whileLiveNewGroup !== null) {
      formData.append("mode", whileLiveNewGroup);
    }
    setIsPending(true);
    api.post("/api/student/enrol", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        genericError: true,
      })
      .then((resp) => {
        const studentIds = resp?.data?.students ?? [];
        refreshData();
        setCsvFile(null);
        setActiveModal(null);
        updateSelectedAssignment({ students: studentIds });
      })
      .finally(() => {
        setIsPending(false);
      });
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
        setStudentsList(data?.students);
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

      <Row className="mb-4 gy-3">
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
          { selectedAssignment.state !== "closed" && <>
          <h3>Add students</h3>
          <p>Add students to the assignment by uploading a CSV below.</p>

          <Form.Control type="file" accept=".csv" className="mb-3" onChange={handleFileUpload}/>

          <div className="d-flex justify-content-between">
            <Button
              className="d-flex align-items-center"
              variant="secondary"
              onClick={() => setActiveModal("csv-help")}
            >
              <InfoCircle className="me-2" />Templates
            </Button>

            <Button
              variant="primary"
              disabled={isLoading || isPending || !csvFile } 
              onClick={handlePreSubmitFile}
              className="d-flex align-items-center"
            >
              <Upload className="me-2" />Upload
            </Button>
          </div>
          </>}

          { (selectedAssignment.state === "pre-allocation" && studentsList.length > 0) && <>
            <h3 className="mt-5">Start again</h3>
            <p>
              If you've made a mistake and want to clear the student list, click
              the button below.
            </p>
            <Button variant="outline-danger" className="d-flex align-items-center" onClick={showRemoveAllModal}>
              <Trash3Fill className="me-1" />
              Remove all students
            </Button>
          </>}
        </Col>
      </Row>

      <Modal show={activeModal === "csv-help"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Uploading student data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Identify students by their email addresses in a column called <code>email</code>.
            Some students may have multiple email addresses, but you must use
            the format "aa1g25@soton.ac.uk". 
          </p>
          <p>
            If possible, you should also provide student names in a column
            called <code>name</code>. Please use the students' first and
            surnames. When they log in for the first time, these names will
            automatically update from their University account.
          </p>
          <Button
            className="d-flex align-items-center"
            variant="primary"
            onClick={downloadCsvTemplate}
          >
            <Download className="me-2" />Download template CSV
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={activeModal === "remove-student"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove "{studentToRemove?.displayName}" from {selectedAssignment.name}?
          If teams have been allocated, they'll be removed and won't be
          replaced automatically.
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
            onClick={removeStudent}
            disabled={isPending}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === "remove-all"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove all students</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove all students from {selectedAssignment.name}?
          You should only do this if you've accidentally uploaded the wrong list
          of students and need to start again.
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
            onClick={handleRemoveAll}
            disabled={isPending}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === "upload-while-live"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Teams already allocated</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You're about to add students to an assignment where teams have
            already been allocated. Please confirm that you meant to do this and
            then decide how you want them to be added to teams.
          </p>
          <Form.Group>
            <Form.Check
              type="radio"
              label="Distribute new students among existing teams"
              checked={whileLiveNewGroup === "existing"}
              onChange={() => setWhileLiveNewGroup("existing")}
            />
            <Form.Check
              type="radio"
              label="Add new students to a single new team"
              checked={whileLiveNewGroup === "new"}
              onChange={() => setWhileLiveNewGroup("new")}
            />
          </Form.Group>
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
            onClick={handleSubmitFile}
            disabled={isPending || whileLiveNewGroup == null}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === "pairing-exclusions"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Pairing exclusions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Prevent <span className="fw-semibold">{pairingExclusionsStudent?.displayName}</span>{" "}
          from being placed in a group with specific students. Use this option
          if a student has reported another for bullying, for example. This
          applies to all assignments and will be visible to other staff.</p>
          
          <p className="text-muted mb-1">Don't put in a group with:</p>
          <Select
            isMulti
            options={allStudentIdsNames.filter(n => n.label != pairingExclusionsStudent?.displayName)}
            value={pairingExclusionsOthers}
            onChange={(selectedOptions) => setPairingExclusionsOthers(selectedOptions)}
            placeholder="No exclusions set"
            menuPlacement="top"
          />

          <p className="text-muted small mt-2 mb-0 d-flex align-items-center">
            <InfoCircle className="me-1" />Only students on this assignment are listed.
          </p>
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
            onClick={submitPairingExclusions}
            disabled={isPending}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AssignmentStudents;
