import SaveButton from "@/components/SaveButton";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useState, useEffect } from "react";
import { Button, Col, Form, InputGroup, ListGroup, Modal, Row, ToggleButton, ToggleButtonGroup, } from "react-bootstrap";
import { startOfWeek, endOfWeek, isBefore, isAfter, isEqual, addWeeks, format, parseISO, addDays } from "date-fns";
import toast from "react-hot-toast";
import { CheckCircleFill, ExclamationTriangle, ExclamationTriangleFill, PencilSquare, PlusCircleFill, Trash3Fill, XCircle, XLg } from "react-bootstrap-icons";

function PeerReviewSettings({ unsaved, markUnsaved, markSaved }) {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [pending, setPending] = useState(false);

  const [peerReviewEnabled, setPeerReviewEnabled] = useState(false);
  const [peerReviews, setPeerReviews] = useState([]);
  const [overallPeriodStart, setOverallPeriodStart] = useState("");
  const [overallPeriodEnd, setOverallPeriodEnd] = useState("");
  const [questionsModalIndex, setQuestionsModalIndex] = useState(null);
  const [questionsModalList, setQuestionsModalList] = useState([]);

  const updatePeerReview = (index, updatedFields) => {
    setPeerReviews(prev =>
      prev.map((review, i) =>
        i === index ? { ...review, ...updatedFields } : review
      )
    );
    markUnsaved();
  };

  const setEnabled = (newState) => {
    markUnsaved();
    setPeerReviewEnabled(newState);
  };

  const editReviewQuestions = (index) => {
    setQuestionsModalIndex(index);
    setQuestionsModalList(peerReviews[index]?.questions ?? []);
  };

  const addQuestionToModal = () => {
    setQuestionsModalList(questionsModalList.filter(a => a.trim() != "").concat([""]));
  };

  const removeQuestionFromModal = (questionIdx) => {
    setQuestionsModalList(questionsModalList.filter((_, i) => i !== questionIdx));
  };

  const updateQuestionInModal = (questionIdx, newValue) => {
    setQuestionsModalList(questionsModalList.map((q, i) => (i === questionIdx ? newValue : q)));
  };

  const handleQuestionModalConfirm = () => {
    const questionsList = questionsModalList.filter(q => q.trim() != "");
    updatePeerReview(questionsModalIndex, {questions: questionsList});
    setQuestionsModalIndex(null);
    setQuestionsModalList([]);
  };

  const saveChanges = async () => {
    setPending(true);
    let updateObj = { assignment: selectedAssignment._id, };
    if (peerReviewEnabled) {
      updateObj.peerReviews = peerReviews;
    } else {
      updateObj.peerReviews = [];
    }
    api
      .put(`/api/peer-review`, updateObj, { successToasts: true })
      .then(() => {
        markSaved();
      })
      .finally(() => {
        setPending(false);
      });
  };

  const refreshData = () => {
    setPending(true);
    // Get the current setup
    api
      .get(`/api/peer-review?assignment=${selectedAssignment._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const existing = data?.peerReviews ?? [];
        let earliest = null;
        let latest = null;
        // Convert the data formats
        const formatted = existing.map(p => {
          const startISO = parseISO(p.periodStart) ?? new Date();
          const endISO = parseISO(p.periodEnd) ?? new Date();
          if (earliest == null || isBefore(startISO, earliest)) earliest = startISO;
          if (latest == null || isAfter(endISO, latest)) latest = endISO;
          return {...p, periodStart: format(startISO, "yyyy-MM-dd"), periodEnd: format(endISO, "yyyy-MM-dd"), };
        });
        setPeerReviews(formatted);
        if (formatted.length === 0) {
          setPeerReviewEnabled(false);
          setOverallPeriodStart(null);
          setOverallPeriodEnd(null);
        } else {
          setPeerReviewEnabled(true);
          setOverallPeriodStart(format(earliest, "yyyy-MM-dd"));
          setOverallPeriodEnd(format(latest, "yyyy-MM-dd"));
        }
        markSaved();
        setPending(false);
      });
  };

  useEffect(() => {
    if (!overallPeriodStart || !overallPeriodEnd) return;

    const start = parseISO(overallPeriodStart);
    const end = parseISO(overallPeriodEnd);

    if (isAfter(start, end)) {
      setOverallPeriodEnd(format(addDays(start, 6), "yyyy-MM-dd"));
      toast.error(`The end date must be after the start date.`);
      return;
    }

    const weekStart = startOfWeek(start, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(end, { weekStartsOn: 1 });       // Sunday

    const newReviews = [];
    let current = weekStart;
    while (!isAfter(current, weekEnd)) {
      const periodStart = format(current, "yyyy-MM-dd");
      const periodEnd = format(endOfWeek(current, { weekStartsOn: 1 }), "yyyy-MM-dd");

      // Try to find existing peer review for this period
      const existing = peerReviews.find(
        r => r.periodStart === periodStart && r.periodEnd === periodEnd
      );

      newReviews.push(existing ?? {
        periodStart,
        periodEnd,
        type: "simple",
        questions: [],
      });

      current = addWeeks(current, 1);
    }
    setPeerReviews(newReviews);
  }, [overallPeriodStart, overallPeriodEnd]);

  // Refresh data on page load
  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Peer reviews</h3>
        <SaveButton {...{ pending, unsaved, saveChanges, size: "sm" }} />
      </div>
      <p className="text-muted mb-1">
        These settings allow you to configure the weekly peer review feature.
        Each week can be in one of three modes:
      </p>
      <ul className="text-muted">
        <li>
          None: no peer review for the given week.
        </li>
        <li>
          Simple: students rate only the workload balance for that week.
        </li>
        <li>
          Full: workload balance, and individual skills ratings and review
          comments for each team member.
        </li>
      </ul>

      <Form className="mb-3">
        <Form.Check 
          type="switch"
          label="Enable peer reviews"
          checked={peerReviewEnabled}
          onChange={e => setEnabled(e.target.checked)}
        />
      </Form>

      { peerReviewEnabled &&
      <>
        <p className="text-danger d-flex align-items-center">
          <ExclamationTriangleFill className="me-2" />
          Don't edit historic peer reviews or disable them if students have
          started completing them. 
        </p>
        <Row className="mb-3 gy-3">
          <Col md={6}>
            <Form.Group className="form-floating">
              <Form.Control
                type="date"
                id="overallPeriodStart"
                value={overallPeriodStart}
                onChange={e => {setOverallPeriodStart(e.target.value); markUnsaved();}}
              />
              <Form.Label htmlFor="overallPeriodStart">First peer review</Form.Label>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="form-floating">
              <Form.Control
                type="date"
                id="overallPeriodEnd"
                value={overallPeriodEnd}
                onChange={e => {setOverallPeriodEnd(e.target.value); markUnsaved();}}
              />
              <Form.Label htmlFor="overallPeriodEnd">Last peer review</Form.Label>
            </Form.Group>
          </Col>
        </Row>
        <ListGroup>
        {peerReviews.map((peerReview, idx) => (
          <ListGroup.Item key={idx}>
            <Row className="gy-2 align-items-center">
              <Col md={4}>
                <p className="mb-0">Week {idx + 1}</p>
                <p className="mb-0 text-muted">
                  {format(parseISO(peerReview.periodStart), "d MMM")} - {format(parseISO(peerReview.periodEnd), "d MMM")}
                </p>
              </Col>
              <Col md={4}>
                <ToggleButtonGroup
                  type="radio"
                  name={`peer-review-type-${idx}`}
                  value={peerReview.type ?? "none"}
                  onChange={(t) => updatePeerReview(idx, { type: t })}
                >
                  <ToggleButton id={`none-${idx}`} value="none" variant="outline-secondary">
                    None
                  </ToggleButton>
                  <ToggleButton id={`simple-${idx}`} value="simple" variant="outline-primary">
                    Simple
                  </ToggleButton>
                  <ToggleButton id={`full-${idx}`} value="full" variant="outline-success">
                    Full
                  </ToggleButton>
                </ToggleButtonGroup>
              </Col>
              { peerReview.type === "full" &&
              <Col md={4}>
                <Button variant="link" className="p-0 mb-0" onClick={() => editReviewQuestions(idx)}>
                  <PencilSquare className="me-1" />
                  Edit questions
                </Button>
                {(peerReview?.questions ?? [])?.length === 0 ?
                  <p className="text-muted mb-0 td-italic">
                    None added yet
                  </p>
                :
                  <p className="text-muted mb-0">
                    {peerReview?.questions?.join(", ")}
                  </p>
                }
              </Col>
              }
            </Row>
          </ListGroup.Item>
        ))}
        </ListGroup>

        <Modal show={questionsModalIndex!==null} onHide={() => setQuestionsModalIndex(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Peer review questions</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              You're editing the questions for the peer review in the week
              beginning {format(parseISO(peerReviews[questionsModalIndex]?.periodStart ?? "2000-01-01"), "d MMM")}.
            </p>
            <p>
              Students will be asked to rate each of their team members against
              each of the following skill areas, using a scale of 1 to 5 stars.
              They will also be asked to provide a short explanation comment.
            </p>
            {questionsModalList.map((question, index) => (
              <Form.Group className="mb-2" key={index}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder={`Enter a skill, e.g. "Programming"`}
                    value={question}
                    onChange={(e) => updateQuestionInModal(index, e.target.value)}
                  />
                  <Button variant="outline-danger" className="d-flex align-items-center" onClick={() => removeQuestionFromModal(index)}>
                    <XLg />
                  </Button>
                </InputGroup>
              </Form.Group>
            ))}
            <Button
              variant="outline-primary"
              className="d-flex align-items-center"
              onClick={addQuestionToModal}
            >
              <PlusCircleFill className="me-2" />Add skill
            </Button>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <Button
              variant="secondary"
              className="d-flex align-items-center"
              onClick={() => setQuestionsModalIndex(null)}
            >
              <Trash3Fill className="me-2" /> Cancel
            </Button>
            <Button
              variant="success"
              className="d-flex align-items-center"
              onClick={handleQuestionModalConfirm}
            >
              <CheckCircleFill className="me-2" /> Confirm
            </Button>
          </Modal.Footer>
        </Modal>
      </>
      }
    </>
  );
}

export default PeerReviewSettings;
