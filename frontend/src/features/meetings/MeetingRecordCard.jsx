import { timestampToHumanFriendly } from "@/utility/datetimes";
import React, { useEffect, useState } from "react";
import { Badge, Button, Card, Dropdown, DropdownButton, ListGroup } from "react-bootstrap";
import { ClockHistory, PencilSquare, Trash3Fill, ExclamationOctagonFill, ThreeDotsVertical, ArrowRightCircleFill, CalendarEvent, CheckCircleFill, PenFill, PinMapFill, SlashCircleFill, XCircleFill } from "react-bootstrap-icons";

import "../style/MeetingRecordCard.css";
import { toTitleCase } from "@/utility/helpers";
import api from "@/services/apiMiddleware";

const MeetingRecordCard = ({ meeting, meetingidx, editAllowed, disputeAllowed, onEdit, onDelete, onDispute, viewEdits, assignmentClosed }) => {
  const [disputeStates, setDisputeStates] = useState({});
  const [disputed, setDisputed] = useState(false);

  const disputeColour = (state) => {
    switch(state) {
      case "outstanding":
        return "primary";
      case "escalate":
        return "danger";
      case "resolved":
        return "success";
      case "ignore":
      default:
        return "secondary";
    } 
  };

  useEffect(() => {
    const checkActionable = Object.values(disputeStates).some(
      (status) => status === "outstanding" || status === "escalate"
    );
    setDisputed(checkActionable);
  }, [disputeStates]);

  useEffect(() => {
    const newStates = (meeting?.disputes ?? []).reduce((acc, dispute) => {
      acc[dispute._id] = dispute.status;
      return acc;
    }, {});
    setDisputeStates(newStates);
  }, [meeting]);

  const handleDisputeStateChange = async (dispute, newState) => {
    setDisputeStates((prevStates) => ({
      ...prevStates,
      [dispute]: newState,
    }));
    const updateObj = {
      dispute,
      status: newState,
    };
    await api.patch(`/api/meeting/${meeting._id}/dispute`, updateObj, { successToasts: true });
  };

  return (
    <Card className="mb-4 shadow-sm" border={disputed && "danger"}>
      <Card.Body>
        <Card.Title className="mb-2 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <CalendarEvent />
            <span className="ms-2">{timestampToHumanFriendly(meeting.dateTime ?? meeting.createdAt)}</span>
            { disputed &&
              <Badge
                pill
                bg="danger"
                className="ms-2"
                style={{ fontSize: "0.7rem", verticalAlign: "middle" }}>
                Disputed
              </Badge>
            }
          </div>

          { (editAllowed || disputeAllowed) &&
            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm" className="no-caret" disabled={assignmentClosed}>
                <ThreeDotsVertical />
              </Dropdown.Toggle>

              <Dropdown.Menu>
                { meeting?.editLog?.length > 0 &&
                  <Dropdown.Item
                    className="d-flex align-items-center"
                    onClick={() => viewEdits(meeting.editLog)}
                  >
                    <ClockHistory className="me-2" /> Edit log
                  </Dropdown.Item>
                }
                { editAllowed && <>
                  <Dropdown.Item
                    className="d-flex align-items-center"
                    onClick={() => onEdit(meeting)}
                  >
                    <PencilSquare className="me-2" /> Edit
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="d-flex align-items-center text-danger"
                    onClick={() => onDelete(meeting)}
                  >
                    <Trash3Fill className="me-2" /> Delete
                  </Dropdown.Item>
                </> }
                { disputeAllowed &&
                  <Dropdown.Item
                    className="d-flex align-items-center text-danger"
                    onClick={() => onDispute(meeting)}
                  >
                    <ExclamationOctagonFill className="me-2" /> Dispute
                  </Dropdown.Item>
                }
              </Dropdown.Menu>
            </Dropdown>
          }
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
                  <Badge pill bg="success" className="d-flex align-items-center align-self-center">
                    <CheckCircleFill className="me-1" />
                    Done
                  </Badge>
                : 
                <Badge pill bg="danger" className="d-flex align-items-center align-self-center">
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

        { meeting?.disputes?.length > 0 && 
          <>
            <h6 className="mt-3 mb-0 text-danger">Disputes:</h6>
            <ListGroup variant="flush">
              { meeting.disputes.map((dispute, disputeidx) => (
                <ListGroup.Item key={`dispute-${meetingidx}-${disputeidx}`} className="d-flex justify-content-between align-items-center">
                <div>
                  {dispute.complainant.displayName}
                  <div className="small text-muted">
                    {dispute.notes}
                  </div>
                </div>
                <Dropdown className="ms-2" onSelect={(eventKey)=> handleDisputeStateChange(dispute._id, eventKey)}>
                  <Dropdown.Toggle
                    variant={disputeColour(disputeStates[dispute._id])}
                    className="badge rounded-pill text-white border-0 no-caret"
                    style={{ cursor: "pointer" }}
                    id="dropdown-badge"
                  >
                    {toTitleCase(disputeStates[dispute._id] ?? "")} ▾
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="outstanding">Outstanding</Dropdown.Item>
                    <Dropdown.Item eventKey="escalate">Escalate</Dropdown.Item>
                    <Dropdown.Item eventKey="resolved">Resolved</Dropdown.Item>
                    <Dropdown.Item eventKey="ignore">Ignore</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
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
