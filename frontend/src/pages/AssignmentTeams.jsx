import MeetingRecordCard from "@/features/meetings/MeetingRecordCard";
import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import { daysSince } from "@/utility/datetimes";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, Col, Dropdown, ListGroup, Modal, OverlayTrigger, ProgressBar, Row, Tooltip } from "react-bootstrap";
import { ThreeDotsVertical, ArrowLeftRight, PersonVideo3, CardChecklist, CloudDownload, Dot, EmojiFrown, EmojiSmile, Envelope, EnvelopeFill, QuestionCircleFill, ExclamationTriangle, ExclamationTriangleFill, Eyeglasses, HandThumbsDownFill, HandThumbsUp, HandThumbsUpFill, InfoCircle, JournalText, GraphUp, ClipboardData, Download } from "react-bootstrap-icons";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip as ChartTooltip, Label, ReferenceArea } from "recharts";
import { useNavigate } from "react-router-dom";

function AssignmentTeams() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const { setSelectedTeam } = useBoundStore();
  const selectedTeam = useBoundStore((state) => state.getSelectedTeam());
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [meetingHistory, setMeetingHistory] = useState(null);
  const [checkinHistory, setCheckinHistory] = useState(null);
  const [checkinStudents, setCheckinStudents] = useState([]);
  const [moveMode, setMoveMode] = useState(null);
  const [studentToMove, setStudentToMove] = useState(null);
  const [showModal, setShowModal] = useState(null);

  const teamEmailLink = (groupidx) => {
    const emailAddresses = teams[groupidx].members.map(s => s.email).filter(e => e && e != user.email).join(";");
    let ccSection = "";
    if (teams[groupidx].supervisors?.length > 0) {
      ccSection = "&cc=" + teams[groupidx].supervisors.map(s => s.email).filter(e => e && e != user.email).join(";");
    }
    return `mailto:${emailAddresses}?subject=${selectedAssignment.name} - Team ${teams[groupidx].teamNumber}${ccSection}`;
  };

  const viewMeetingHistory = async (groupidx) => {
    await setSelectedTeam(teams[groupidx]);
    navigate("/assignment/meetings");
  };

  const viewPeerReviews = async (groupidx) => {
    await setSelectedTeam(teams[groupidx]);
    navigate("/assignment/peer-reviews");
  };

  const viewObservations = async (groupidx) => {
    await setSelectedTeam(teams[groupidx]);
    navigate("/assignment/observations");
  };

  const goToReportsPage = (groupid) => {
    navigate(`/assignment/reports?team=${groupid}`);
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
  
  // After the teams list has loaded, scroll to the selected team
  // useEffect(() => {
  //   if (selectedTeam) {
  //     const teamCard = document.getElementById(`team-card-${selectedTeam._id}`);
  //     if (teamCard) teamCard.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [teams]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col md={9}>
          {selectedAssignment.role === "supervisor" ? 
            <h1>Your teams</h1>
          :
            <h1>All teams</h1>
          }
          { selectedAssignment?.role === "lecturer" ? 
          <p className="text-muted">
            Here you can see an overview of the teams for {selectedAssignment.name}.
            {selectedAssignment?.supervisors?.length > 0 &&
            <><br />Supervisors are indicated using the <Eyeglasses /> symbol.</>
            }
          </p>
          :
          <p className="text-muted">
            Here you can see an overview of the teams that you're supervising for {selectedAssignment.name}.
            <br />Supervisors are indicated using the <Eyeglasses /> symbol.
          </p>
          }
          
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          { selectedAssignment.role === "lecturer" &&
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
          }
        </Col>
      </Row>

      <Row>
        <Col>
          {teams.length === 0 && 
            <Card className="my-3">
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <QuestionCircleFill className="me-2" /> No teams
                </Card.Title>
                <p className="text-muted mb-0">
                  No teams were found for {selectedAssignment.name}.<br />
                  {selectedAssignment.role === "supervisor" && 
                    "You probably haven't been added to any teams as a supervisor yet."
                  }
                </p>
              </Card.Body>
            </Card>
          }
          {teams.map((group, index) => (
            <Card key={index} className="my-3" id={`team-card-${group._id}`}>
              <Card.Body>
                <Card.Title className="mb-2 d-flex justify-content-between align-items-center">
                  { moveMode === 2 ? 
                    <a
                      key={group._id}
                      onClick={() => selectTeamMove(group)}
                      variant="link"
                      className="p-0 m-0"
                      role="button"
                    >Team {group.teamNumber}</a>
                  : 
                    <>
                      <span>Team {group.teamNumber}</span>
                      <Dropdown>
                        <Dropdown.Toggle variant="light" size="sm" disabled={moveMode > 0} className="no-caret">
                          <ThreeDotsVertical />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            className="d-flex align-items-center"
                            href={teamEmailLink(index)}>
                            <Envelope className="me-2" /> Email team
                          </Dropdown.Item>
                          <Dropdown.Item
                            className="d-flex align-items-center"
                            onClick={() => viewMeetingHistory(index)}>
                            <PersonVideo3 className="me-2" /> Meetings
                          </Dropdown.Item>
                          <Dropdown.Item
                            className="d-flex align-items-center"
                            onClick={() => viewPeerReviews(index)}>
                            <GraphUp className="me-2" /> Peer reviews
                          </Dropdown.Item>
                          <Dropdown.Item
                            className="d-flex align-items-center"
                            onClick={() => viewObservations(index)}>
                            <JournalText className="me-2" /> Observations
                          </Dropdown.Item>
                          <Dropdown.Item
                            className="d-flex align-items-center"
                            onClick={() => goToReportsPage(group._id)}>
                            <Download className="me-2" /> Progress report
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </>
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
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
      </Row>
    </>
  );
}

export default AssignmentTeams;
