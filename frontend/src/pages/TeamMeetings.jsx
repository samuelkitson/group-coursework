import DisputeMeetingModal from "@/features/meetings/DisputeMeetingModal";
import MeetingRecordCard from "@/features/meetings/MeetingRecordCard";
import NewMeetingModal from "@/features/meetings/NewMeetingModal";
import api from "@/services/apiMiddleware";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useBoundStore } from "@/store/dataBoundStore";
import { hoursSince, timestampToHumanFriendly } from "@/utility/datetimes";
import React, { useEffect, useState } from "react";
import { Badge, Button, Card, Col, ListGroup, Modal, Row } from "react-bootstrap";
import { ArrowLeftShort, ArrowRightCircleFill, CalendarEvent, CheckCircleFill, ChevronLeft, PenFill, PinMapFill, PlusCircleFill, SlashCircleFill, XCircleFill } from "react-bootstrap-icons";

function TeamMeetings() {
  const selectedTeam = useBoundStore((state) =>
    state.getSelectedTeam(),
  );
  const { getSelectedAssignment } = useBoundStore();
  const { user } = useAuthStore();

  const [activeModal, setActiveModal] = useState(null);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState({});
  const [disputeMeeting, setDisputeMeeting] = useState(null);
  const [deleteMeeting, setDeleteMeeting] = useState(null);
  const [editMeeting, setEditMeeting] = useState(null);
  const [currentEditLog, setCurrentEditLog] = useState(null);
  const assignmentClosed = getSelectedAssignment()?.state === "closed";
  
  const getLatestActions = () => {
    if (meetingHistory.length == 0) return [];
    return meetingHistory[0].newActions;
  };

  const meetingEditAllowed = (meeting) => {
    if (getSelectedAssignment().role === "student") {
      // Only allow edit if this is the minute taker, and we're within an hour.
      return hoursSince(meeting?.createdAt) < 1 && meeting.minuteTaker._id === user.userId;
    } else {
      // Lecturer or supervisor, so edit is always allowed.
      return true;
    }
  };

  const submitMeetingRecord = (recordObj) => {
    // Check if we're editing or uploading new minutes.
    if (editMeeting) {
      // Editing existing meeting
      api
        .put(`/api/meeting/${editMeeting._id}`, {...recordObj}, { successToasts: true, })
        .then((resp) => {
          return resp.data;
        })
        .then((data) => {
          setActiveModal(null);
          setEditMeeting(null);
          refreshData();
        });
    } else {
      // New meeting
      api
        .post(`/api/meeting`, {...recordObj, team: selectedTeam._id}, { successToasts: true, })
        .then((resp) => {
          return resp.data;
        })
        .then((data) => {
          setActiveModal(null);
          refreshData();
        });
    }
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
    api
      .post(`/api/meeting/${disputeMeeting._id}/dispute`,
        {notes: disputeNotes},
        {successToasts: true},
      )
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setActiveModal(null);
        setDisputeMeeting(null);
      });
  };

  const showDeleteConfirm = (meeting) => {
    setDeleteMeeting(meeting);
    setActiveModal("confirm-delete");
  };

  const handleDeleteMeeting = () => {
    api
      .delete(`/api/meeting/${deleteMeeting._id}`, {
        successToasts: true,
      })
      .then(() => {
        setMeetingHistory(mh => mh.filter(m => m._id !== deleteMeeting._id));
        setDeleteMeeting(null);
      })
      .finally(() => {
        setActiveModal(null);
      });
  };

  const startMeetingEdit = (meeting) => {
    setEditMeeting(meeting);
    setActiveModal("new-meeting");
  };

  const showEditLog = (editLog) => {
    setCurrentEditLog(editLog);
    setActiveModal("edit-log");
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
        { getSelectedAssignment().role !== "student" && 
          <Col xs={12} className="mb-2">
            <Link as={Button} to="/assignment/teams" variant="link" className="p-0 d-flex align-items-center">
              <ArrowLeftShort size="25"/>
              Back to teams overview
            </Link>
          </Col>
        }

        { getSelectedAssignment().role === "student" ? 
          <Col md={9}>
            <h1>Meetings</h1>
            <p className="text-muted">Keep track of when you've met as a team,
            what you've agreed each meeting and who's turned up.</p>
          </Col>
        :
          <Col md={9}>
            <h1>Meetings (Team {selectedTeam.teamNumber})</h1>
            <p className="text-muted">See an overview of Team {selectedTeam.teamNumber}'s{" "}
            meetings and attendance logs. Review any outstanding disputes and
            edit or delete meetings as appropriate.</p>
          </Col>
        }
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          { getSelectedAssignment().role === "student" &&
            <Button
              variant="primary"
              className="d-flex align-items-center"
              onClick={(e) => (setActiveModal("new-meeting"))}
              disabled={assignmentClosed}
            >
              <PlusCircleFill className="me-2" />New meeting
            </Button>
          }
        </Col>
      </Row>
      <Row className="mb-4 gy-4 gx-4">
        <Col lg={9} md={12}>
          { meetingHistory.length > 0 ? meetingHistory.map((meeting, meetingidx) => (
            <MeetingRecordCard
              meeting={meeting}
              key={meetingidx}
              meetingidx={meetingidx}
              editAllowed={meetingEditAllowed(meeting)}
              disputeAllowed={getSelectedAssignment().role === "student"}
              onEdit={(m) => startMeetingEdit(m)}
              onDelete={(m) => showDeleteConfirm(m)}
              onDispute={(m) => showMeetingDispute(m)}
              viewEdits={((editLog) => showEditLog(editLog))}
              assignmentClosed={assignmentClosed}
            />
          )) : 
            <Card className="shadow-sm">
              <Card.Body>
                <p className="text-muted">
                  No meeting records found.
                </p>
                { getSelectedAssignment().role === "student" &&
                <p className="text-muted mb-0">
                  When you meet for the first time, click the <PlusCircleFill />
                  {" "} button to add notes about what happened and the actions
                  you agreed.
                </p>
                }
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
        activeModal={activeModal==="new-meeting"}
        onHide={() => {setActiveModal(null); setEditMeeting(null); }} 
        teamMembers={selectedTeam.members}
        supervisors={selectedTeam.supervisors}
        previousActions={getLatestActions()}
        onSubmit={submitMeetingRecord}
        existingMeeting={editMeeting}
      />

      <DisputeMeetingModal
        activeModal={activeModal==="dispute-meeting"}
        onHide={() => setActiveModal(null)}
        onSubmit={handleSubmitDispute}
        hasSupervisor={selectedTeam?.supervisors?.length > 0}
        meeting={disputeMeeting}
      />

      <Modal show={activeModal === "confirm-delete"} centered onHide={() => setActiveModal(null)}>
        <Modal.Header>
          <Modal.Title>Delete meeting</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the meeting on {" "}
            {timestampToHumanFriendly(deleteMeeting?.dateTime ?? deleteMeeting?.createdAt)}?{" "}
            This cannot be undone.
          </p>
          {(["lecturer", "supervisor"].includes(getSelectedAssignment().role) && deleteMeeting?.disputes?.length > 0) && 
          <p>
            <span className="fw-semibold">This meeting has been disputed. </span>
            When a meeting is deleted, any linked disputes are lost. You should
            make a note of why you're deleting this meeting on the obvservations
            page.
          </p>
          }
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteMeeting}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === "edit-log"} centered onHide={() => setActiveModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Meeting edit log</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            The list below shows all edits made to this meeting's record:
          </p>
          <ul>
            {currentEditLog?.map((l) => (
              <li key={l.dateTime}>
                <strong>{l.editor.displayName}</strong> edited on {timestampToHumanFriendly(l.dateTime)}
              </li>
            ))}
          </ul>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default TeamMeetings;
