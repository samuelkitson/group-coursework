import React, { useEffect, useRef, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col, Card, OverlayTrigger, Tooltip, Spinner, ListGroup, Modal, Button, Form, InputGroup } from "react-bootstrap";
import Select from 'react-select';

import "./style/AssignmentOverview.css";
import { Envelope, HourglassSplit, InfoCircle, People, Shuffle, XCircle } from "react-bootstrap-icons";
import api from "@/services/apiMiddleware";
import PaginatedListGroup from "@/components/PaginatedListGroup";
import { Controller, useForm, useFormState } from "react-hook-form";
import toast from "react-hot-toast";

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function ReportGenerator() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = () => {
    setIsLoading(false);
  };

  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Reports</h1>
          <p className="text-muted">
            Generate progress reports for teams and students on {selectedAssignment?.name}.
          </p>
        </Col>
      </Row>
    </>
  );
}

export default ReportGenerator;
