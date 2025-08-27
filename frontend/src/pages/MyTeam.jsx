import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect, useState } from "react";
import { Button, Card, Col, ListGroup, OverlayTrigger, ProgressBar, Row, Tooltip } from "react-bootstrap";
import { PersonVideo3, EmojiFrown, EmojiSmile, Envelope, EnvelopeFill, HandThumbsDownFill, HandThumbsUp, HandThumbsUpFill, QuestionCircle, TrophyFill, Star } from "react-bootstrap-icons";

function MyTeam() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );
  const { user } = useAuthStore();

  const [teamNumber, setTeamNumber] = useState(selectedTeam?.teamNumber);
  const [teamMembers, setTeamMembers] = useState(selectedTeam?.members ?? []);
  const [teamSupervisors, setTeamSupervisors] = useState(selectedTeam?.supervisors ?? []);
  const [isLoading, setIsLoading] = useState(false);

  const teamEmailLink = () => {
    const otherEmails = teamMembers.map(s => s.email).filter(e => e && e != user.email).join(";");
    return `mailto:${otherEmails}?subject=${selectedAssignment.name} - Team ${teamNumber}`;
  };

  const meetingPreferenceString = (meetingPref) => {
    switch (meetingPref) {
      case "online": return "Prefers online meetings";
      case "in-person": return "Prefers in-person meetings";
      case "either": return "No meeting preference";
      default: return "No meeting preference set";
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    // Get the current required skills
    api
      .get(`/api/team/mine?assignment=${selectedAssignment._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        const teamData = data?.teams?.[0];
        setTeamNumber(teamData?.teamNumber);
        // Put the current user first
        const teamMembersTemp = teamData?.members;
        teamMembersTemp.sort((a, b) => (a.email === user.email ? -1 : b.email === user.email ? 1 : 0));
        setTeamMembers(teamMembersTemp ?? []);
        setTeamSupervisors(teamData?.supervisors ?? []);
      })
      .then(() => {
        setIsLoading(false);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedAssignment]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col md={9}>
          <h1>Team {teamNumber}</h1>
          <p className="text-muted">Get to know your team for {selectedAssignment.name}!<br/>
          { selectedAssignment?.skills?.length > 0 &&
          "The stars show what each team member is most confident doing."}
          </p>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          <Button
            variant="primary"
            className="d-flex align-items-center"
            as="a"
            href={teamEmailLink()}
          >
            <EnvelopeFill className="me-2" /> Email team
          </Button>
        </Col>
      </Row>

      <Row xs={1} sm={2} lg={3} className="g-3">
        {teamMembers.map((teamMember, index) => (
          <Col key={index}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <div className="d-flex just-content-between">
                  <Card.Title className="mb-2">{teamMember.displayName}</Card.Title>
                  <a
                    href={`mailto:${teamMember.email}`}
                    className="icon-button ms-auto d-flex align-items-center">
                    { teamMember.email != user.email && <OverlayTrigger overlay={<Tooltip>{teamMember.email}</Tooltip>}>
                      <Envelope size={24} />
                    </OverlayTrigger>}
                  </a>
                </div>
                {teamMember.intro ? 
                  <Card.Text>{teamMember?.intro ?? ""}</Card.Text>
                :
                  <Card.Text className="text-muted">{teamMember.bio || "Hi! I haven't added a bio yet."}</Card.Text>
                }
                { selectedAssignment?.skills?.length > 0 && (teamMember.skills?.strongest ?
                <div className="d-flex align-items-center text-success mb-1">
                  <Star className="me-2"/>
                  {teamMember.skills?.strongest}
                </div>
                :
                <div className="d-flex align-items-center text-muted mb-1">
                  <QuestionCircle className="me-2"/>
                  Didn't rate skills
                </div>
                )}
                <div className="d-flex align-items-center text-muted">
                  <PersonVideo3 className="me-2"/>
                  { meetingPreferenceString(teamMember.meetingPref) }
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {teamSupervisors.length > 0 && 
        <>
          <h3 className="mt-4">Your supervisor{teamSupervisors.length > 1 && "s"}</h3>
          <p className="text-muted">
            Supervisors meet with their teams regularly and help to make sure
            they're making good progress. They can see your meeting logs and
            data about how you're working as a team.
          </p>
          <Row xs={1} sm={2} lg={3} className="g-3">
          {teamSupervisors.map((supervisor, index) => (
            <Col key={index}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex just-content-between">
                    <Card.Title className="mb-2">{supervisor.displayName}</Card.Title>
                    <a
                      href={`mailto:${supervisor.email}`}
                      className="icon-button ms-auto d-flex align-items-center">
                      <OverlayTrigger overlay={<Tooltip>{supervisor.email}</Tooltip>}>
                        <Envelope size={24} />
                      </OverlayTrigger>
                    </a>
                  </div>
                  {supervisor.intro ? 
                    <Card.Text>{supervisor?.intro ?? ""}</Card.Text>
                  :
                    <Card.Text className="text-muted">{supervisor.bio || "Hi! I haven't added a bio yet."}</Card.Text>
                  }
                  <div className="d-flex align-items-center text-muted">
                    <PersonVideo3 className="me-2"/>
                    { meetingPreferenceString(supervisor.meetingPref) }
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        </>
      }
    </>
  );
}

export default MyTeam;
