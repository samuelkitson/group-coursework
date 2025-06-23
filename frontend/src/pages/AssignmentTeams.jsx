import MeetingRecordCard from "@/features/meetings/MeetingRecordCard";
import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import { daysSince } from "@/utility/datetimes";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, Col, ListGroup, Modal, OverlayTrigger, ProgressBar, Row, Tooltip } from "react-bootstrap";
import { ArrowLeftRight, PersonVideo3, CardChecklist, CloudDownload, Dot, EmojiFrown, EmojiSmile, Envelope, EnvelopeFill, ExclamationTriangle, ExclamationTriangleFill, Eyeglasses, HandThumbsDownFill, HandThumbsUp, HandThumbsUpFill, InfoCircle, InfoCircleFill, InfoLg } from "react-bootstrap-icons";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltip, Label, ReferenceArea } from "recharts";
import { chartColours } from "@/utility/helpers";

function AssignmentTeams() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const { user } = useAuthStore();

  const [teams, setTeams] = useState([]);
  const [meetingHistory, setMeetingHistory] = useState(null);
  const [checkinHistory, setCheckinHistory] = useState(null);
  const [checkinStudents, setCheckinStudents] = useState([]);
  const [moveMode, setMoveMode] = useState(null);
  const [studentToMove, setStudentToMove] = useState(null);
  const [showModal, setShowModal] = useState(null);

  const teamEmailLink = (groupidx) => {
    const emailAddresses = teams[groupidx].members.map(s => s.email).filter(e => e && e != user.email).join(";");
    return `mailto:${emailAddresses}?subject=${selectedAssignment.name} - Team ${teams[groupidx].teamNumber}`;
  };

  const viewMeetingHistory = (groupid) => {
    api
      .get(`/api/meeting?team=${groupid}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setMeetingHistory(data.meetings);
        setShowModal("meeting-history");
      });
  };

  const viewCheckinHistory = (groupid) => {
    api
      .get(`/api/checkin/history?team=${groupid}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const checkinData = data.checkins.map(c => {
          const startDate = new Date(c.periodStart);
          const niceStartDate = startDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
          return {periodStart: niceStartDate, ...c.netScores,}
        });
        setCheckinHistory(checkinData);
        if (checkinData.length > 0) {
          setCheckinStudents(Object.keys(checkinData[0]).filter(k => k !== "periodStart"));
        }
        setShowModal("checkins");
      });
  };

  const warningFlags = (student) => {
    let highSeverity = false;
    let warnings = [];
    if (student.meetingAttendance.rate < 40) {
      highSeverity = true;
      warnings.push(`Very low meeting attendance: ${student.meetingAttendance.rate}%`);
    } else if (student.meetingAttendance.rate < 70) {
      warnings.push(`Low meeting attendance: ${student.meetingAttendance.rate}%`);
    }
    if (student?.checkinNetScore <= -4 ) {
      highSeverity = true;
      warnings.push(`Check-ins indicate low effort`);
    }
    
    if (warnings.length > 0) {
      return (
        <OverlayTrigger overlay={<Tooltip>
          {warnings.map((warning, index) => (
            <React.Fragment key={index}>
              <Dot /> {warning}
              {index < warnings.length - 1 && <br />}
            </React.Fragment>
          ))}
        </Tooltip>}>
          <InfoCircle className="ms-2 text-danger"/>
        </OverlayTrigger>
      )
    }
    return;
  };

  const generateInsights = (insights) => {
    return (
      <ul className="list-unstyled">
      { insights.map(insight => {
        if (insight.type === "positive") {
          return (
            <li className="d-flex align-items-center">
              <HandThumbsUpFill className="me-2 text-success"/>
              { insight.text }
            </li>
          )
        } else if (insight.type === "warning") {
          return (
            <li className="d-flex align-items-center">
              <ExclamationTriangleFill className="me-2 text-warning"/>
              { insight.text }
            </li>
          )
        } else if (insight.type === "severe") {
          return (
            <li className="d-flex align-items-center text-danger fw-semibold">
              <ExclamationTriangleFill className="me-2 text-danger"/>
              { insight.text }
            </li>
          )
        }
      }) }
      </ul>
    )
  };

  const togglemoveMode = () => {
    setStudentToMove(null);
    toast.dismiss();
    if (moveMode) {
      setMoveMode(null);
      toast.error("Cancelled student move.");
    } else {
      toast("Click the name of the student to be moved to a new team. Click the \"Move students\" button again to cancel.", { icon: "ℹ️", duration: Infinity, });
      setMoveMode(1);
    }
  }

  const selectStudentMove = (student) => {
    if (moveMode === 1 && student) {
      setStudentToMove(student);
      toast.dismiss();
      setMoveMode(2);
      toast(`Now click ${student.displayName}'s new team.`, { icon: "ℹ️", duration: Infinity, });
    }
  }

  const selectTeamMove = (team) => {
    if (moveMode === 2 && studentToMove && team) {
      setMoveMode(null);
      toast.dismiss();
      api
      .post(`/api/team/${team._id}/new-member`, { student: studentToMove._id, }, {
        successToasts: true,
      })
      .then(() => {
        // Refresh the teams list
        refreshData();
      })
      .catch(() => {
        setMoveMode(2);
        toast(`Now click ${studentToMove.displayName}'s new team.`, { icon: "ℹ️", duration: Infinity, });
      });
    }
  }

  const refreshData = () => {
    // Get the teams on this assignment
    api
      .get(`/api/team/all?assignment=${selectedAssignment._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setTeams(data.teams);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedAssignment]);

  // Remove lefover toasts when the page is unloaded
  useEffect(() => {return toast.dismiss}, []);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col md={9}>
          <h1>All teams</h1>
          <p className="text-muted">
            Here you can see an overview of the teams for {selectedAssignment.name}.
            {selectedAssignment?.supervisors?.length > 0 &&
            <><br />Supervisors are indicated using the <Eyeglasses /> symbol.</>
            }
          </p>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              className="d-flex align-items-center"
              href={`/api/team/csv?assignment=${selectedAssignment._id}`}
              target="blank"
            >
              <CloudDownload className="me-2" />Export teams
            </Button>
            <Button
              variant={moveMode ? "danger" : "primary"}
              className="d-flex align-items-center"
              onClick={togglemoveMode}
            >
              <ArrowLeftRight className="me-2" />Move students
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          {teams.map((group, index) => (
            <Card key={index} className="my-3">
              <Card.Body>
                <Card.Title className="mb-2">
                  { moveMode === 2 ? 
                    <a
                      key={group._id}
                      onClick={() => selectTeamMove(group)}
                      variant="link"
                      className="p-0 m-0"
                      role="button"
                    >Team {group.teamNumber}</a>
                  : 
                    <span>Team {group.teamNumber}</span>
                  }
                </Card.Title>
                <Row>
                  <Col md={5}>
                    <ul className="list-unstyled">
                      {group.members.map((student, i) => ( <div className="d-flex align-items-center">
                        { moveMode === 1 ? 
                        <>
                          <a
                            key={student._id}
                            onClick={() => selectStudentMove(student)}
                            variant="link"
                            className="p-0 m-0"
                            role="button"
                          >{student.displayName}</a>
                        </>
                        :
                        <>
                          <li key={student._id}>{student.displayName}</li>
                          { warningFlags(student) }
                        </>
                        }
                      </div>))}
                    </ul>
                    <ul className="list-unstyled mb-0">
                      {(group?.supervisors ?? []).map((supervisor, i) => ( <div className="d-flex align-items-center text-muted">
                        <li key={supervisor._id}><Eyeglasses /> {supervisor.displayName}</li>
                      </div>))}
                    </ul>
                  </Col>
                  <Col xs={8} md={6}>
                    { generateInsights(group?.insights ?? []) }
                  </Col>
                  {moveMode == null && <Col xs={4} md={1} className="d-flex flex-column justify-content-start gap-3">
                    <a
                      href={teamEmailLink(index)}
                      className="icon-button ms-auto d-flex align-items-center">
                      { <OverlayTrigger overlay={<Tooltip>Email team members</Tooltip>} placement="left">
                        <Envelope size={24} />
                      </OverlayTrigger>}
                    </a>
                    <a
                      onClick={() => viewMeetingHistory(group._id)}
                      className="icon-button ms-auto d-flex align-items-center"
                      role="button">
                      { <OverlayTrigger overlay={<Tooltip>View meeting minutes</Tooltip>} placement="left">
                        <PersonVideo3 size={24} />
                      </OverlayTrigger>}
                    </a>
                    <a
                      onClick={() => viewCheckinHistory(group._id)}
                      className="icon-button ms-auto d-flex align-items-center"
                      role="button">
                      { <OverlayTrigger overlay={<Tooltip>View check-in data</Tooltip>} placement="left">
                        <CardChecklist size={24} />
                      </OverlayTrigger>}
                    </a>
                  </Col>}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>

      <Modal show={showModal === "meeting-history"} size="xl" onHide={() => setShowModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Meeting history</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        { meetingHistory?.length > 0 ? meetingHistory?.map((meeting, meetingidx) => (
            <MeetingRecordCard meeting={meeting} key={meetingidx} meetingidx={meetingidx} />
          )) : 
            <p className="text-muted">
              No meeting records found for this team.
            </p>
          }
        </Modal.Body>
      </Modal>

      <Modal show={showModal === "checkins"} size="xl" onHide={() => setShowModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Check-in data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { checkinHistory?.length > 0 ?
            <>
            <p className="text-muted">
              This chart shows how students in this team perceive the workload
              balance. A score of 0 is ideal and means that student is seen to
              be doing their fair share. A high score means they're doing more,
              and a low score may indicate free-riding.
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={checkinHistory}
                margin={{
                  left: 50,
                  bottom: 50,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodStart">
                  <Label offset={20} position="bottom" value="Weeks" />
                </XAxis>
                <YAxis>
                  <Label position="left" angle={-90} value="Relative workload" />
                </YAxis>
                <ReferenceArea y1={-4} y2={4} fill="#71d97f" opacity={0.3} alwaysShow />
                <ChartTooltip />
                <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: "20px" }} />
                {checkinStudents.map((student, index) => (
                  <Line type="monotone" dataKey={student} stroke={chartColours[index % chartColours.length]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            </>
            :
            <p className="text-muted">
              This team doesn't have any check-in data to show yet.
            </p>
          }
        </Modal.Body>
      </Modal>
    </>
  );
}

export default AssignmentTeams;
