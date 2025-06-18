import { timestampToHumanFriendly } from "@/utility/datetimes";
import React from "react";
import { Badge, Card, ListGroup } from "react-bootstrap";
import { ArrowRightCircleFill, CalendarEvent, CheckCircleFill, PenFill, PinMapFill, SlashCircleFill, XCircleFill } from "react-bootstrap-icons";

const MeetingRecordCard = ({ meeting, meetingidx }) => {
  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-2 d-flex align-items-center">
          <CalendarEvent />
          <span className="ms-2">{timestampToHumanFriendly(meeting.dateTime ?? meeting.createdAt)}</span>
        </Card.Title>

        <p className="mb-1 small "><PinMapFill className="me-1 fs-6" /> {meeting.location ?? "unknown"}</p>
        <p className="mb-2 small "><PenFill className="me-1 fs-6" /> Added by {meeting.minuteTaker.displayName ?? "unknown"}</p>

        <div className="mb-2 small">
          <div>
            <span className="text-success fw-semibold"><CheckCircleFill className="me-2 fs-6" />Attended: </span> 
            {meeting.attendance.attended.map((m) => m.displayName).join(", ")}
          </div>
          { meeting.attendance?.apologies?.length > 0 && <div>
            <span className="text-warning fw-semibold"><SlashCircleFill className="me-2 fs-6" />Apologies: </span> 
            {meeting.attendance.apologies.map((m) => m.displayName).join(", ")}
          </div>}
          { meeting.attendance?.absent?.length > 0 && <div>
            <span className="text-danger fw-semibold"><XCircleFill className="me-2 fs-6" />Absent: </span> 
            {meeting.attendance.absent.map((m) => m.displayName).join(", ")}
          </div>}
        </div>

        <p className="mb-2 text-muted">
        {meeting.discussion
          ? meeting.discussion.split("\n").map((line, lineidx) => (
              <React.Fragment key={`line-${meetingidx}-${lineidx}`}>
                {line}
                {lineidx < meeting.discussion.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))
        : "No discussion notes made."
        }
        </p>

        { meeting?.previousActions?.length > 0 && 
          <>
            <h6 className="mt-3 mb-0">Actions from last meeting:</h6>
            <ListGroup variant="flush">
              { meeting.previousActions.map((action, actionidx) => (
                <ListGroup.Item key={`action-${meetingidx}-${actionidx}`} className="d-flex justify-content-between align-items-center">
                <div>
                  {action.action}
                  <div className="small text-muted">
                    {action.assignees.map((person) => person.displayName).join(", ")}
                  </div>
                </div>
                { action.complete ? 
                  <Badge bg="success" className="d-flex align-items-center align-self-center">
                    <CheckCircleFill className="me-1" />
                    Done
                  </Badge>
                : 
                <Badge bg="danger" className="d-flex align-items-center align-self-center">
                  <ArrowRightCircleFill className="me-1" />
                  Ongoing
                </Badge>
                }
              </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        }

        { meeting?.newActions?.length > 0 && 
          <>
            <h6 className="mt-3 mb-0">Actions before next meeting:</h6>
            <ListGroup variant="flush">
              { meeting.newActions.map((action, actionidx) => (
                <ListGroup.Item key={`action-${meetingidx}-${actionidx}`} className="d-flex justify-content-between align-items-center">
                <div>
                  {action.action}
                  <div className="small text-muted">
                    {action.assignees.map((person) => person.displayName).join(", ")}
                  </div>
                </div>
              </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        }
      </Card.Body>
    </Card>
  )
};

export default MeetingRecordCard;
