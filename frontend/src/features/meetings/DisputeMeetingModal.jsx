import { timestampToHumanFriendly } from '@/utility/datetimes';
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { } from 'react-bootstrap-icons';

const DisputeMeetingModal = ({ activeModal, onHide, meeting, hasSupervisor, onSubmit, isPending }) => {
  const [disputeNotes, setDisputeNotes] = useState("");
  const staffString = hasSupervisor ? "supervisor/lecturer" : "lecturer";

  const handleSubmit = () => {
    onSubmit(disputeNotes);
  };

  useEffect(() => {
    if (activeModal) {
      setDisputeNotes("");
    }
  }, [activeModal]);

  return (
    <Modal show={activeModal} onHide={onHide} backdrop="static" keyboard={false} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Dispute meeting</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Please speak to {meeting?.minuteTaker?.displayName} first if you have
          questions about the minutes, attendance or actions they recorded for
          the meeting on {timestampToHumanFriendly(meeting?.dateTime ?? meeting?.createdAt)}.
        </p>
        <p>
          If you still disagree, please describe the problem below. Your {" "}
          {staffString} will read this and can edit or delete meetings. For
          minor edits such as typos, please ask them directly.
        </p>
        <Form.Control
          value={disputeNotes}
          as="textarea"
          className="mb-3"
          rows={3}
          placeholder={"Explain why you disagree and summarise your conversation with " + meeting?.minuteTaker?.displayName + "."}
          onChange={(e) => setDisputeNotes(e.target.value)}
        />
        <p className="mb-0">
          You might find{" "}
          <a href="https://library.soton.ac.uk/groupwork" target="_blank">this guide</a>{" "}
          about managing conflict in groups useful.
        </p>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={onHide} disabled={isPending}>Cancel</Button>
        <Button variant="danger" disabled={disputeNotes.length < 25 || isPending} onClick={handleSubmit}>Submit</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DisputeMeetingModal;
