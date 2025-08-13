import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Card, Col, Dropdown, OverlayTrigger, Placeholder, Row, Spinner, Tooltip } from "react-bootstrap";
import { ThreeDotsVertical, ArrowLeftRight, PersonVideo3, CloudDownload, Envelope, QuestionCircleFill, ExclamationTriangleFill, Eyeglasses, HandThumbsUpFill, InfoCircle, JournalText, GraphUp, Download } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";

function AssignmentTeams() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const { setSelectedTeam } = useBoundStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [currentFilter, setCurrentFilter] = useState("none");
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [moveMode, setMoveMode] = useState(null);
  const [studentToMove, setStudentToMove] = useState(null);

  const teamEmailLink = (groupidx) => {
    const emailAddresses = filteredTeams[groupidx].members.map(s => s.email).filter(e => e && e != user.email).join(";");
    let ccSection = "";
    if (filteredTeams[groupidx].supervisors?.length > 0) {
      ccSection = "&cc=" + filteredTeams[groupidx].supervisors.map(s => s.email).filter(e => e && e != user.email).join(";");
    }
    return `mailto:${emailAddresses}?subject=${selectedAssignment.name} - Team ${filteredTeams[groupidx].teamNumber}${ccSection}`;
  };

  const viewMeetingHistory = async (groupidx) => {
    await setSelectedTeam(filteredTeams[groupidx]);
    navigate("/assignment/meetings");
  };

  const viewPeerReviews = async (groupidx) => {
    await setSelectedTeam(filteredTeams[groupidx]);
    navigate("/assignment/peer-reviews");
  };

  const viewObservations = async (groupidx) => {
    await setSelectedTeam(filteredTeams[groupidx]);
    navigate("/assignment/observations");
  };

  const goToReportsPage = (groupid) => {
    navigate(`/assignment/reports?team=${groupid}`);
  };

  const warningFlags = (flags) => {
    if (flags && flags.length > 0) {
      return (
        <OverlayTrigger overlay={<Tooltip style={{ whiteSpace: "pre-wrap" }}>
          { flags.join("\n") }
        </Tooltip>}>
          <InfoCircle className="ms-2 text-danger"/>
        </OverlayTrigger>
      )
    }
    return;
  };

  const getFilterText = (filter) => {
    switch (filter) {
      case "positive":
        return <span className="d-inline-flex align-items-center me-1">
          <HandThumbsUpFill className="me-2 text-success" />
          Teams with no alerts
        </span>;
      case "alerts":
        return <span className="d-inline-flex align-items-center me-1">
          <ExclamationTriangleFill className="me-2 text-warning" />
          Teams with alerts
        </span>;
      case "severe":
        return <span className="d-inline-flex align-items-center me-1">
          <ExclamationTriangleFill className="me-2 text-danger" />
          Teams with severe alerts
        </span>;
      case "none":
      default:
        return <span className="me-1">All teams</span>;
    }
  };

  const setFilter = (newFilter) => {
    if (!["none", "positive", "alerts", "severe"].includes(newFilter)) return;
    setCurrentFilter(newFilter);
    if (newFilter == "positive") {
      setFilteredTeams(teams.filter(t => !t.insights.some(i => ["warning", "severe"].includes(i.type))));
    } else if (newFilter == "alerts") {
      setFilteredTeams(teams.filter(t => t.insights.some(i => ["warning", "severe"].includes(i.type))));
    } else if (newFilter == "severe") {
      setFilteredTeams(teams.filter(t => t.insights.some(i => i.type == "severe")));
    } else {
      setFilteredTeams(teams);
    } 
  }

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
    if (moveMode === 2 && studentToMove) {
      if (team) {
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
      } else {
        // Add to a new empty team.
        setMoveMode(null);
        toast.dismiss();
        api
        .post(`/api/team/new`, { student: studentToMove._id, assignment: selectedAssignment._id, }, {
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
  }

  const refreshData = () => {
    // Get the teams on this assignment
    setIsLoading(true);
    api
      .get(`/api/team/all?assignment=${selectedAssignment._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setTeams(data.teams);
        setCurrentFilter("none");
        setFilteredTeams(data.teams);
      })
      .finally(() => {
        setIsLoading(false);
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
                disabled={isLoading}
              >
                <ArrowLeftRight className="me-2" />Move students
              </Button>
            </div>
          }
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Dropdown >
            <Dropdown.Toggle variant="light" size="sm" className="border" disabled={isLoading}>
              {getFilterText(currentFilter)}
            </Dropdown.Toggle>
            <Dropdown.Menu size="sm">
              <Dropdown.Item onClick={() => setFilter("none")}>
                {getFilterText(null)}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("positive")} className="d-flex align-items-center">
                {getFilterText("positive")}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("alerts")} className="d-flex align-items-center">
                {getFilterText("alerts")}
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilter("severe")} className="d-flex align-items-center">
                {getFilterText("severe")}
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>

      <Row>
        <Col>
          { isLoading && 
            <Card className="my-3">
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
            </Card>
          }
          {(!isLoading && teams.length === 0 && currentFilter == "none") && 
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
          {(!isLoading && filteredTeams.length === 0 && teams.length > 0) && 
            <Card className="my-3">
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <QuestionCircleFill className="me-2" /> No results
                </Card.Title>
                <p className="text-muted mb-0">
                  No teams match the selected filter.
                </p>
              </Card.Body>
            </Card>
          }
          { moveMode == 2 && 
          <div className="mt-2">
            <a
              onClick={() => selectTeamMove(null)}
              variant="link"
              className=""
              role="button"
            >Add to a new empty team</a>
          </div>
          }
          {!isLoading && filteredTeams.map((group, index) => (
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
                          { warningFlags(student?.flags) }
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
