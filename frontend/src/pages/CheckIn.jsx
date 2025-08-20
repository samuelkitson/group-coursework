import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Accordion, Button, Card, Col, Modal, OverlayTrigger, Row, Spinner, Tooltip } from "react-bootstrap";

import { Ban, CalendarEvent, Check2All, ChevronRight, DashCircle, ExclamationOctagonFill, ExclamationTriangle, Eye, EyeSlash, HourglassSplit, PlusCircle, QuestionCircle } from "react-bootstrap-icons";
import api from "@/services/apiMiddleware";
import PeerReviewForm from "@/features/checkin/PeerReviewForm";
import toast from "react-hot-toast";
import { reduceArrayToObject } from "@/utility/helpers";
import EffortBlobsInput from "@/components/EffortBlobsInput";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

function PointsBalanceIndicator({ control, expectedTotal }) {
  const workloadBalance = useWatch({ control, name: "workloadBalance" });
  const [ pointsImbalance, setPointsImbalance ] = useState(0);

  useEffect(() => {
    const pointsSum = workloadBalance?.reduce((acc, cur) => {return acc + cur.value}, 0) ?? 0;
    setPointsImbalance(expectedTotal - pointsSum);
  }, [workloadBalance]);

  if (pointsImbalance === 0) return (
    <div className="text-muted">
      <Check2All className="me-2"/>
      Points balanced
    </div>
  )

  return (
    <div className="text-danger d-flex align-items-center">
      <ExclamationTriangle className="me-2"/>
      { pointsImbalance > 0 ? 
        `Give out ${pointsImbalance} more point${pointsImbalance === 1 ? "" : "s"}`
      :
        `Take away ${0-pointsImbalance} more point${pointsImbalance === -1 ? "" : "s"}`
      }
    </div>
  )
};

function CheckIn() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );
  const [ isPending, setIsPending ] = useState(false);
  const [ activeModal, setActiveModal ] = useState(null);
  const [ completionRate, setCompletionRate ] = useState({done: 0, outOf: 0});
  const [ checkInType, setCheckInType ] = useState(null);
  const [ peerReviewName, setPeerReviewName ] = useState(undefined);
  const [ checkInAvailable, setCheckInAvailable ] = useState(false);
  const [ peerReviewQuestions, setPeerReviewQuestions ] = useState([]);
  const [ peerReviewAnswers, setPeerReviewAnswers ] = useState([]);

  const { control, reset, getValues, } = useForm({ workloadBalance: [] });
  const { fields: workloadFields, } = useFieldArray({ control, name: "workloadBalance", });
  const expectedTotal = 4 * selectedTeam.members.length;

  const peerReviewRefs = useRef([]);

  const validatePointsBalance = () => {
    const currentWorkloadBalance = getValues("workloadBalance");
    const pointsSum = currentWorkloadBalance?.reduce((acc, cur) => { return acc + cur.value }, 0) ?? 0;
    return (expectedTotal - pointsSum) === 0;
  };

  const submitCheckIn = () => {
    if (!validatePointsBalance())
      return toast.error("The effort points you have allocated aren't balanced properly.");
    const ratingsObj = getValues().workloadBalance.reduce((acc, rating) => {
      acc[rating._id] = rating.value;
      return acc;
    }, {});
    let reviews = undefined;
    if (checkInType === "full") {
      // Add in reviews if this is a full peer review week
      const peerReviewData = [];
      for (const ref of peerReviewRefs.current) {
        if (ref) {
          const values = ref.getValues();
          if (!ref.isValid) {
            return toast.error(`Please complete the peer review for ${values?.recipientName ?? "each team member"}.`);
          }
          peerReviewData.push(values);
        }
      }
      reviews = peerReviewData.reduce((acc, answer) => {
        acc[answer.recipientId] = { skills: reduceArrayToObject(answer.skills), comment: answer.comment, };
        return acc;
      }, {});
    }
    const submitObj = {
      team: selectedTeam._id,
      effortPoints: ratingsObj,
      reviews,
    }
    setIsPending(true);
    api
      .post(`/api/checkin`, submitObj, { successToasts: true, })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setCheckInAvailable(false);
        setCompletionRate({...completionRate, done: completionRate.done + 1});
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const reportIssuesLink = () => {
    const staffEmails = selectedAssignment.lecturers.map(l => l.email).join(";");
    return `mailto:${staffEmails}?subject=${selectedAssignment.name} - Team ${selectedTeam.teamNumber}`;
  };

  const refreshData = () => {
    setCheckInAvailable(false);
    // Check whether this user's check-in is open
    api
      .get(`/api/checkin?team=${selectedTeam._id}`, {
        genericErrorToasts: false,
      })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setCheckInAvailable(data?.open ?? false);
        setCheckInType(data?.type);
        setCompletionRate(data?.completionRate ?? {done: 0, outOf: 0});
        setPeerReviewQuestions(data?.questions ?? []);
        setPeerReviewName(data?.name);
        if (data?.teamMembers) {
          const questionsMap = data?.questions.reduce((acc, q) => ({ ...acc, [q]: 0 }), {});
          setPeerReviewAnswers(data.teamMembers.map(m => {
            return {
              recipient: m._id,
              name: m.displayName,
              comment: "",
              skills: {...questionsMap},
            }
          }));
        } else {
          setPeerReviewAnswers([]);
        }
      });
  };

  useEffect(() => {
    refreshData();
    const workloadFieldsDefault = selectedTeam.members.map(member => {
      return { _id: member._id, displayName: member.displayName, value: 4, };
    });
    reset({ workloadBalance: workloadFieldsDefault, });
  }, [selectedAssignment]);

  return (
    <>
      <Row className="mb-3">
        <Col md={9}>
          <h1>Check-in</h1>
          <p className="text-muted">
            Complete a 2 minute check-in every week to reflect on how things are
            going. {peerReviewName && `This check-in is for ${peerReviewName}.`}
          </p>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          <Button
            variant="danger"
            className="d-flex align-items-center"
            onClick={() => setActiveModal("report-issues")}
          >
            <ExclamationOctagonFill className="me-2" />Report issues
          </Button>
        </Col>
      </Row>

      { checkInType === "disabled" && 
      <Card>
        <Card.Body>
          <Card.Text>
            <p>
              No check-ins are needed this week.
            </p>
            <p className="d-flex align-items-center text-muted mb-1">
              <QuestionCircle className="me-2" />
              Either this assignment hasn't been set up to use this feature, or
              you're not within the configured assignment dates.
            </p>
          </Card.Text>
        </Card.Body>
      </Card>
      }

      { checkInType === "none" && 
      <Card>
        <Card.Body>
          <Card.Text>
            <p>
              No check-ins are needed this week.
            </p>
            <p className="d-flex align-items-center text-muted mb-1">
              <Ban className="me-2" />
              Your module team has not requested any check-ins this week. Maybe
              it's a holiday, or you've got exams!
            </p>
          </Card.Text>
        </Card.Body>
      </Card>
      }

      { ["simple", "full"].includes(checkInType) && (
      checkInAvailable ?
      <>
        <h4>
          Workload balance
          <OverlayTrigger overlay={<Tooltip>
            Visible to module staff, but not shared with your team.
          </Tooltip>}>
            <EyeSlash className="ms-2" size={18} />
          </OverlayTrigger>
        </h4>
        <p className="text-muted">
          Has everyone done the same amount of work this week? Rebalance the
          points between team members to reflect individual effort.
        </p>
        <Row className="mb-4">
          <Col xs={12} md={8}>
            { workloadFields.map((field, index) => (
              <Row className={index === selectedTeam.members.length ? "mb-4 mb-md-0" : "mb-4 mb-md-3"} key={field.id}>
                <Col xs={12} md={5} className="mb-1 mb-md-0 text-center">
                  { field.displayName }
                </Col>
                <Col xs={12} md={7} className="d-flex align-items-center justify-content-center justify-content-md-start">
                  <EffortBlobsInput name={`workloadBalance.${index}.value`} control={control} />
                </Col>
              </Row>
            ))}
          </Col>
          <Col xs={12} md={4} className="d-flex align-items-center">
            <PointsBalanceIndicator control={control} expectedTotal={expectedTotal} />
          </Col>
        </Row>

        { checkInType === "full" && 
        <>
          <h4>
            Peer review
            <OverlayTrigger overlay={<Tooltip>
              Comments shared anonymously with your team. Skill ratings only
              shared with staff.
            </Tooltip>}>
              <Eye className="ms-2" size={18} />
            </OverlayTrigger>
          </h4>
          <p className="text-muted">
            Tell us a bit more about each of your team member's contributions
            towards the most recent deliverable. Your comments will help justify
            individual marks and will be shared with your team anonymously.
          </p>
          <Row>
            <Col xs={12}>
              <Accordion>
                {peerReviewAnswers.map((p, idx) => (
                  <PeerReviewForm
                    key={`peerreviewform-${idx}`}
                    index={idx}
                    ref={el => peerReviewRefs.current[idx] = el}
                    questions={peerReviewQuestions}
                    recipient={{_id: p.recipient, name: p.name, }}
                  />
                ))}
              </Accordion>
            </Col>
          </Row>
        </>
        }

        <Button
          variant="primary"
          className="d-flex align-items-center mt-3"
          onClick={submitCheckIn}
          disabled={isPending}
        >
          Submit check-in
          <ChevronRight className="ms-2" />
        </Button>
      </>
      : 
      <Card>
        <Card.Body>
          <Card.Text>
            <p>
              Your next check-in will be available on Monday.
            </p>
            { completionRate.done === completionRate.outOf ? 
              <p className="text-muted mb-1">
                <Check2All className="me-2" />
                Everyone in Team {selectedTeam.teamNumber} has completed this week's check-in. Nice work!
              </p>
            : 
            <p className="d-flex align-items-center text-muted mb-1">
              <HourglassSplit className="me-2" />
              {completionRate.outOf - completionRate.done} team member{completionRate.outOf - completionRate.done > 1 ? "s" : ""} still need{completionRate.outOf - completionRate.done > 1 ? "" : "s"} to complete this week's check-in.
            </p>
            }
          </Card.Text>
        </Card.Body>
      </Card>
      )}

      <Modal show={activeModal === "report-issues"} onHide={() => setActiveModal(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Report issues</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Small disagreements and issues with team dynamics are normal in
            group coursework. Most of the time, the best thing to do is bring
            this up in a team meeting and work together to find a solution.
          </p>
          <p>
            You might find{" "}
            <a href="https://library.soton.ac.uk/groupwork" target="_blank">this guide</a>{" "}
            about managing conflict in groups useful.
          </p>
          <p>
            If things are more serious (for example if someone is being bullied
            or discriminated against), or you've tried the steps in the guide
            and issues persist, you should contact your team supervisor or{" "}
            <a href={reportIssuesLink()}>the module team</a>{" "}
            for support.
          </p>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default CheckIn;
