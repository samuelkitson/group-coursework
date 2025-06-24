import DisputeMeetingModal from "@/features/meetings/DisputeMeetingModal";
import MeetingRecordCard from "@/features/meetings/MeetingRecordCard";
import NewMeetingModal from "@/features/meetings/NewMeetingModal";
import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import { hoursSince, timestampToHumanFriendly } from "@/utility/datetimes";
import React, { useEffect, useState } from "react";
import { Badge, Button, Card, Col, ListGroup, Row } from "react-bootstrap";
import { ArrowRightCircleFill, CalendarEvent, CheckCircleFill, PenFill, PinMapFill, PlusCircleFill, SlashCircleFill, XCircleFill } from "react-bootstrap-icons";

function TeamMeetings() {
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );
  const { user } = useAuthStore();

  const [activeModal, setActiveModal] = useState(null);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState({});
  const [disputeMeeting, setDisputeMeeting] = useState(null);

  const getLatestActions = () => {
    if (meetingHistory.length == 0) return [];
    return meetingHistory[0].newActions;
  };

  const submitMeetingRecord = (recordObj) => {
    api
      .post(`/api/meeting`, {...recordObj, team: selectedTeam._id})
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setActiveModal(null);
        refreshData();
      });
  };

  const attendanceBadgeColour = (rate) => {
    if (rate >= 80) return "success";
    if (rate > 50) return "warning";
    return "danger";
  };

  const showMeetingDispute = (meeting) => {
    setDisputeMeeting(meeting);
    setActiveModal("dispute-meeting");
  };

  const handleSubmitDispute = (disputeNotes) => {
    // TODO: actually submit the dispute
    console.log(disputeNotes);
    console.log(disputeMeeting._id);
    setActiveModal(null);
    setDisputeMeeting(null);
  };

  const refreshData = () => {
    // Get the meeting history for the team
    api
      .get(`/api/meeting?team=${selectedTeam._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setMeetingHistory(data.meetings);
        setAttendanceHistory(data.attendanceStats);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedTeam]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col md={9}>
          <h1>Meetings</h1>
          <p className="text-muted">Keep track of when you've met as a team, what you've agreed each
          meeting and who's turned up.</p>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          <Button
            variant="primary"
            className="d-flex align-items-center"
            onClick={(e) => (setActiveModal("new-meeting"))}
          >
            <PlusCircleFill className="me-2" />New meeting
          </Button>
        </Col>
      </Row>
      <Row className="mb-4 gy-4 gx-4">
        <Col lg={9} md={12}>
          { meetingHistory.length > 0 ? meetingHistory.map((meeting, meetingidx) => (
            <MeetingRecordCard
              meeting={meeting}
              key={meetingidx}
              meetingidx={meetingidx}
              editAllowed={hoursSince(meeting?.createdAt) < 1 && meeting.minuteTaker._id === user.userId}
              disputeAllowed={true}
              onEdit={(m) => console.log(m)}
              onDelete={(m) => console.log(m)}
              onDispute={(m) => showMeetingDispute(m)}
            />
          )) : 
            <Card className="shadow-sm">
              <Card.Body>
                <p className="text-muted">
                  No meeting records found.
                </p>
                <p className="text-muted mb-0">
                  When you meet for the first time, click the <PlusCircleFill />
                  {" "} button to add notes about what happened and the actions
                  you agreed.
                </p>
              </Card.Body>
            </Card>
          }
        </Col>
        <Col lg={3} md={12}>
          <h6>Attendance stats</h6>
            { meetingHistory.length > 0 ? <ListGroup variant="flush">
              {Object.entries(attendanceHistory).map(([student, attData]) => (
                <ListGroup.Item key={student} className="d-flex justify-content-between align-items-start">
                  {student}
                  <Badge bg={attendanceBadgeColour(attData.rate)}>{attData.rate}%</Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          :
            <p className="text-muted">This will be available after your first meeting.</p>
          }
        </Col>
      </Row>

      <NewMeetingModal
        showModal={activeModal==="new-meeting"}
        onHide={() => setActiveModal(null)} 
        teamMembers={selectedTeam.members}
        supervisors={selectedTeam.supervisors}
        previousActions={getLatestActions()}
        onSubmit={submitMeetingRecord}
      />

      <DisputeMeetingModal
        showModal={activeModal==="dispute-meeting"}
        onHide={() => setActiveModal(null)}
        onSubmit={handleSubmitDispute}
        hasSupervisor={selectedTeam?.supervisors?.length > 0}
        meeting={disputeMeeting}
      />
    </>
  );
}

export default TeamMeetings;
