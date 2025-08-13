import React, { useState } from "react";
import { Button, Card, Modal, Stack } from "react-bootstrap";
import { EnvelopeCheckFill, EnvelopeFill } from "react-bootstrap-icons";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";

const StaffCheckInStatusCard = ({ data }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [reminderSent, setReminderSent] = useState(data.reminderSent);

  const assignment = useBoundStore.getState().getSelectedAssignment();

  if (!assignment) return null;

  const sendReminders = () => {
    setActiveModal(null);
    api
      .post(
        "/api/peer-review/reminders",
        { assignment: assignment._id, force: reminderSent },
        { successToasts: true }
      )
      .then((resp) => setReminderSent(resp?.data?.reminderSent ?? true));
  };

  return (
    <>
      <Card className="p-3 shadow h-100">
        <h5 className="text-center mb-3">Current check-in</h5>
        <Stack gap={3}>
          <Stack direction="vertical" className="align-items-center justify-content-center">
            <h2 className="display-6 text-primary mb-0">
              {data.submittedCount} / {data.totalStudents}
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
                {reminderSent ? "Reminders sent" : "No reminders sent"}
              </p>
            </div>

            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setActiveModal("confirm-checkin-reminders")}
              disabled={data.unsubmittedCount === 0}
            >
              {reminderSent ? "Resend reminders" : "Send reminders"}
            </Button>
          </div>
        </Stack>
      </Card>

      <Modal show={activeModal === "confirm-checkin-reminders"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Send reminders</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You're about to send reminder emails to the {data.unsubmittedCount} students
            on {assignment?.name} who haven't submitted this week's check-in yet.
          </p>
          {reminderSent && (
            <p>
              You've already sent a reminder this week. These students will receive a
              duplicate. Please be careful not to spam them.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => setActiveModal(null)}>
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

StaffCheckInStatusCard.loadData = async () => {
  const assignment = useBoundStore.getState().getSelectedAssignment();

  if (!assignment || assignment.role !== "lecturer") return null;

  try {
    const res = await api.get(
      `/api/peer-review/current-status?assignment=${assignment._id}`,
      { genericErrorToasts: false }
    );
    const data = res.data;

    if (!data?.type || data?.type === "disabled" || data?.type === "none") return null;

    return {
      reminderSent: data?.reminderSent ?? false,
      submittedCount: data?.submittedCount ?? 0,
      unsubmittedCount: data?.unsubmittedCount ?? 0,
      totalStudents: assignment?.students?.length ?? 0,
    };
  } catch (e) {
    return null;
  }
};

export default StaffCheckInStatusCard;
