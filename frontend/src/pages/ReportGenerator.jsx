import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col, InputGroup, Form, Button } from "react-bootstrap";
import Select from "react-select";

import "./style/AssignmentOverview.css";
import { Controller, useForm, useFormState } from "react-hook-form";
import api from "@/services/apiMiddleware";
import { format, parseISO } from "date-fns";
import { Download } from "react-bootstrap-icons";
import toast from "react-hot-toast";

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function ReportGenerator() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [isLoading, setIsLoading] = useState(0); // 0 means loaded
  const [teamsList, setTeamsList] = useState([]);
  const [peerReviewsList, setPeerReviewsList] = useState([]);
  const [fullPeerReviews, setFullPeerReviews] = useState([]);
  
  // Add your comparison date here (replace with actual UTC string)
  const comparisonDateUTC = selectedAssignment?.createdAt || null; // Replace with your actual date
  
  const defaultValues = { 
    allTeams: true, 
    selectedTeam: null, 
    peerReview: null, 
    startDateDefault: true, 
    startDateCustom: null, 
    endDateDefault: true, 
    endDateCustom: null, 
  };

  const today = new Date().toISOString().split('T')[0];

  const { control, register, reset, getValues, watch, formState: { errors, isValid } } = useForm({
    defaultValues, 
    mode: "onTouched"
  });

  const allTeamsChecked = watch("allTeams");
  const startDateChecked = watch("startDateDefault");
  const endDateChecked = watch("endDateDefault");
  const startDateCustom = watch("startDateCustom");

  const submitForm = () => {
    const {allTeams, selectedTeam, peerReview, startDateDefault, startDateCustom, endDateDefault, endDateCustom} = getValues();
    let startDate;
    let endDate;
    const today = new Date();
    const selectedPeerReview = peerReviewsList.find(p => p._id == peerReview.value) ?? null;
    const peerReviewStart = selectedPeerReview ? new Date(selectedPeerReview?.periodStart) : null;
    const peerReviewEnd = selectedPeerReview ? new Date(selectedPeerReview?.periodEnd) : null;
    if (!allTeams && !selectedTeam) return toast.error("Please select a team to generate a report for.");
    if (!startDateDefault) {
      if (!startDateCustom) return toast.error("Please select a custom start date for the report.");
      startDate = new Date(startDateCustom);
      if (startDate >= today) return toast.error("The report start date must be in the past.");
      if (peerReviewStart && startDate >= peerReviewStart) return toast.error(`The report start date must be before the selected peer review started (${selectedPeerReview.periodStartFormatted}).`);
    }
    if (!endDateDefault) {
      if (!endDateCustom) return toast.error("Please select a custom end date for the report.");
      endDate = new Date(endDateCustom);
      if (endDate >= today) return toast.error("The report end date must be in the past.");
      if (peerReviewEnd && endDate <= peerReviewEnd) return toast.error(`The report end date must be after the selected peer review ended (${selectedPeerReview.periodEndFormatted}).`);
    }
    if (startDate && endDate && startDate >= endDate) return toast.error("The start date must be before the end date.");
    // Now actually generate the report
  };

  const refreshData = () => {
    if (isLoading !== 0) return;
    setIsLoading(2);
    reset(defaultValues);
    api
      .get(`/api/team/all?assignment=${selectedAssignment._id}&mode=simple`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const teamsOptions = data.teams.map(t => ({ value: t._id, label: `Team ${t.teamNumber}`}));
        setTeamsList(teamsOptions);
      })
      .finally(() => {
        setIsLoading(isLoading - 1);
      });
    api
      .get(`/api/peer-review?assignment=${selectedAssignment._id}&pastOnly=true&ignoreNone=true`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const existing = data?.peerReviews ?? [];
        const formatted = existing.map(p => {
          const startISO = parseISO(p.periodStart) ?? new Date();
          const endISO = parseISO(p.periodEnd) ?? new Date();
          return {...p, periodStartFormatted: format(startISO, "dd/MM/yyyy"), periodEndFormatted: format(endISO, "dd/MM/yyyy"), };
        });
        setPeerReviewsList(formatted);
        const fullReviews = formatted.filter(p => p.type == "full").map(p => ({ value: p._id, label: `${p.periodStartFormatted} - ${p.periodEndFormatted}`}));
        setFullPeerReviews(fullReviews);
        if (fullReviews.length > 0) {
          reset({ ...defaultValues, peerReview: fullReviews[fullReviews.length - 1] });
        }
      })
      .finally(() => {
        setIsLoading(isLoading - 1);
      });
  };

  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-2">
        <Col>
          <h1>Reports</h1>
          <p className="text-muted">
            Generate progress reports for teams on {selectedAssignment?.name}.
          </p>
        </Col>
      </Row>

      <Form.Group as={Row} className="mb-4">
        <Form.Label column sm={3} xl={2} className="pt-0">
          Select teams
        </Form.Label>
        <Col sm={9} md={6} xl={4}>
          <Controller
            name="allTeams"
            control={control}
            render={({ field }) => (
              <Form.Check
                type="checkbox"
                id="allTeamsCheckbox"
                checked={field.value}
                {...field}
                label="All teams"
              />
            )}
          />
          <div className="mt-2">
            <Controller
              name="selectedTeam"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={teamsList}
                  placeholder="Select a specific team"
                  isDisabled={allTeamsChecked}
                  className={errors.selectedTeam ? "is-invalid" : ""}
                />
              )}
            />
            {errors.selectedTeam && (
              <div className="invalid-feedback d-block">
                {errors.selectedTeam.message}
              </div>
            )}
          </div>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-4">
        <Form.Label column sm={3} xl={2}>
          Peer review point
        </Form.Label>
        <Col sm={9} md={6} xl={4}>
          <div className="mt-2">
            <Controller
              name="peerReview"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={fullPeerReviews}
                  placeholder="Select a peer review"
                  noOptionsMessage={() => "No peer reviews completed yet"}
                />
              )}
            />
          </div>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-4">
        <Form.Label column sm={3} xl={2} className="pt-0">
          Report start date
        </Form.Label>
        <Col sm={9} md={6} xl={4}>
          <Controller
            name="startDateDefault"
            control={control}
            render={({ field }) => (
              <Form.Check
                type="checkbox"
                id="startDateDefault"
                checked={field.value}
                {...field}
                label="Start of assignment"
              />
            )}
          />
          <div className="mt-2">
            <Form.Control
              type="date"
              id="startDateCustom"
              {...register("startDateCustom")}
              disabled={startDateChecked}
              max={today}
            />
          </div>
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-4">
        <Form.Label column sm={3} xl={2} className="pt-0">
          Report end date
        </Form.Label>
        <Col sm={9} md={6} xl={4}>
          <Controller
            name="endDateDefault"
            control={control}
            render={({ field }) => (
              <Form.Check
                type="checkbox"
                id="endDateDefault"
                checked={field.value}
                {...field}
                label="Today"
              />
            )}
          />
          <div className="mt-2">
            <Form.Control
              type="date"
              id="endDateCustom"
              {...register("endDateCustom")}
              disabled={endDateChecked}
              max={today}
            />
          </div>
        </Col>
      </Form.Group>

      <Button
        disabled={!isValid}
        variant="primary"
        className="d-flex align-items-center"
        onClick={submitForm}
      >
        <Download className="me-2" />
        { allTeamsChecked ?
          "Download .zip of reports"
        :
          "Download report"
        }
      </Button>
    </>
  );
}

export default ReportGenerator;
