import React, { useEffect, useState } from "react";
import { useBoundStore } from "@/store/dataBoundStore";
import { Row, Col, InputGroup, Form, Button } from "react-bootstrap";
import Select from "react-select";

import "./style/AssignmentOverview.css";
import { Controller, useForm, useFormState } from "react-hook-form";
import api from "@/services/apiMiddleware";
import { format, parseISO } from "date-fns";
import { BoxArrowUpRight, Download } from "react-bootstrap-icons";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

// Stepped progress bar inspired by https://www.geeksforgeeks.org/how-to-create-multi-step-progress-bar-using-bootstrap/

function ReportGenerator() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [teamsList, setTeamsList] = useState([]);
  const [peerReviewsList, setPeerReviewsList] = useState([]);
  const [fullPeerReviews, setFullPeerReviews] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  const submitForm = ({ attachment=true }) => {
    const {allTeams, selectedTeam, peerReview, startDateDefault, startDateCustom, endDateDefault, endDateCustom} = getValues();
    let startDate;
    let endDate;
    const today = new Date();
    const selectedPeerReview = peerReviewsList.find(p => p._id == peerReview?.value) ?? null;
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
    // Generate the report link
    let reportUrl = `/api/report/`;
    if (allTeams) {
      reportUrl += `assignment/${selectedAssignment._id}`;
    } else {
      reportUrl += `team/${selectedTeam.value}`;
    }
    const queryParams = [];
    if (selectedPeerReview) queryParams.push(`peerReview=${selectedPeerReview._id}`);
    if (startDate) queryParams.push(`periodStart=${format(startDate, "yyyy-MM-dd")}`);
    if (endDate) queryParams.push(`periodEnd=${format(endDate, "yyyy-MM-dd")}`);
    if (attachment) queryParams.push("attachment=true");
    if (queryParams.length > 0) reportUrl += "?" + queryParams.join("&");
    window.open(reportUrl, "_blank").focus();
  };

  const refreshData = () => {
    reset(defaultValues);
    const teamPromise = api
      .get(`/api/team/all?assignment=${selectedAssignment._id}&mode=simple`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const teamsOptions = data.teams.map(t => ({ value: t._id, label: `Team ${t.teamNumber}`}));
        setTeamsList(teamsOptions);
        return teamsOptions;
    });
    const peerReviewPromise = api
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
        const fullReviews = formatted.filter(p => p.type == "full").map(p => {
          const dateString = `${p.periodStartFormatted} - ${p.periodEndFormatted}`;
          const label = p?.name ? `${p?.name} (${dateString})` : dateString;
          return { value: p._id, label }
        });
        setFullPeerReviews(fullReviews);
        return fullReviews;
    });
    Promise.all([teamPromise, peerReviewPromise]).then(([teamData, fullReviews]) => {
      const resetData = { ...defaultValues };
      if (fullReviews.length > 0) {
        resetData.peerReview = fullReviews[fullReviews.length - 1];
      }
      if (searchParams.get("team")) {
        const matchedTeam = teamData.find(t => t.value == searchParams.get("team"));
        if (matchedTeam) {
          resetData.selectedTeam = matchedTeam;
          resetData.allTeams = false;
          setSearchParams({});
        }
      }
      if (selectedAssignment.role === "supervisor") {
        resetData.allTeams = false;
      }
      reset(resetData);
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
            disabled={selectedAssignment.role !== "lecturer"}
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

      <div className="d-flex align-items-center">
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
        { !allTeamsChecked &&
          <Button
            disabled={!isValid}
            variant="link"
            className="ms-2"
            onClick={()=> submitForm({ attachment: false })}
          >
            Preview in browser
          </Button>
        }
      </div>
      <Row>
        <Col md={6}>
          <p className="text-muted small mt-3">
            Reports are static HTML documents that can be saved locally, viewed
            and shared without logging in. You'll still need an internet
            connection. To view offline, open a report and print to a PDF.
          </p>
        </Col>
      </Row>
    </>
  );
}

export default ReportGenerator;
