import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col } from "react-bootstrap";

import "./style/AssignmentOverview.css";
import {  } from "react-bootstrap-icons";

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function AssignmentSupervisors() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(null);

  const refreshData = () => {
    setSupervisorsList([]);
    setIsLoading(true);
    // api
    //   .get(`/api/assignment/${selectedAssignment._id}/supervisors`)
    //   .then((resp) => {
    //     return resp.data;
    //   })
    //   .then((data) => {
    //     setSupervisorsList(data);
    //   })
    //   .finally(() => {
    //     setIsLoading(false);
    //   });
  };

  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Supervisors</h1>
          <p className="text-muted">
            Supervisors can view meeting minutes and insights data for teams
            they supervise. They can also add private notes about their progress
            to help you moderate marks later on.
          </p>
        </Col>
      </Row>
    </>
  );
}

export default AssignmentSupervisors;
