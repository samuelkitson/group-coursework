import React, { useEffect, useState } from "react";
import { Button, Card, Col, Modal, Row, Spinner, Stack } from "react-bootstrap";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { daysSince } from "@/utility/datetimes";
import { EnvelopeCheckFill, EnvelopeFill } from "react-bootstrap-icons";

const StaffCheckInStatusCard = () => {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const totalStudents = selectedAssignment?.students?.length ?? 0;
  const [peerReviewType, setPeerReviewType] = useState(null);
  const [reminderSent, setReminderSent] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(null);
  const [unsubmittedCount, setUnsubmittedCount] = useState(null);
  const [showModal, setShowModal] = useState(false);

  if (selectedAssignment == null || selectedAssignment.role != "lecturer") return <></>;

  const sendReminders = () => {
    setShowModal(false);
    api
      .post("/api/peer-review/reminders", { assignment: selectedAssignment._id, force: reminderSent }, {
        successToasts: true,
      })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setReminderSent(data?.reminderSent ?? true);
      });
  };
  
  const refreshData = () => {
    setLoading(true);
    api
      .get(`/api/peer-review/current-status?assignment=${selectedAssignment._id}`, {
        genericErrorToasts: false,
      })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setPeerReviewType(data?.type);
        if (!data?.type || data?.type === "disabled" || data?.type === "none") return setUnavailable(true);
        setReminderSent(data?.reminderSent ?? false);
        setSubmittedCount(data?.submittedCount ?? 0);
        setUnsubmittedCount(data?.unsubmittedCount ?? 0);
      })
      .catch(() => {
        setUnavailable(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [selectedAssignment]);

  if (unavailable) return <></>;

  if (loading)
    return (
      <Card className="p-3 shadow-sm">
        <Card.Body>
          <div className="d-flex align-items-center text-muted">
            <Spinner className="me-3" />
            Loading check-in stats...
          </div>
        </Card.Body>
      </Card>
    );

  return (
    <>
    <Card className="p-3 shadow-sm">
      <h5 className="text-center mb-3">Current check-in</h5>
      <Stack gap={3}>
        <Stack direction="vertical" className="align-items-center justify-content-center">
          <h2 className="display-6 text-primary mb-0">
            {submittedCount} / {totalStudents ?? 0}
          </h2>
          <p className="mb-0 text-muted">submitted so far</p>
        </Stack>

        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center justify-content-sm-between gap-2">
          <div className="d-flex align-items-center">
            {reminderSent ? (
              <EnvelopeCheckFill size={20} className="text-success me-2" />
            ) : (
              <EnvelopeFill size={20} className="text-secondary me-2" />
            )}
            <p className="mb-0 text-muted">
              {reminderSent ? 'Reminders sent' : 'No reminders sent'}
            </p>
          </div>
          
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowModal(true)}
            disabled={unsubmittedCount == 0}
          >
            {reminderSent ? 'Resend reminders' : 'Send reminders'}
          </Button>
        </div>
      </Stack>
    </Card>

    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Send reminders</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
        You're about to send reminder emails to the {unsubmittedCount} students
        on {selectedAssignment?.name} who haven't submitted this week's check-in
        yet.
        </p>
        { reminderSent && <p>You've already sent a reminder this week, so these
          students will receive a duplicate. Be careful not to spam students.  
        </p>}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setShowModal(false)}
        >
          Cancel
        </Button>
        <Button variant="primary" onClick={sendReminders}>
          Send
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default StaffCheckInStatusCard;
