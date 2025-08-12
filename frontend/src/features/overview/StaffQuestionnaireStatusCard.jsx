import React, { useState } from "react";
import { Button, Card, Modal, Stack } from "react-bootstrap";
import { EnvelopeCheckFill, EnvelopeFill } from "react-bootstrap-icons";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";

const StaffQuestionnaireStatusCard = ({ data }) => {
  const [showModal, setShowModal] = useState(false);
  const [reminderSent, setReminderSent] = useState(data?.reminderSent ?? false);

  const assignment = useBoundStore.getState().getSelectedAssignment();

  if (!assignment) return null;

  const sendReminders = () => {
    setShowModal(false);
    api
      .post(
        "/api/questionnaire/reminders",
        { assignment: assignment._id, force: reminderSent },
        { successToasts: true }
      )
      .then((resp) => setReminderSent(resp?.data?.reminderSent ?? true));
  };

  return (
    <>
      <Card className="p-3 shadow h-100">
        <h5 className="text-center mb-3">Skills questionnaire</h5>
        <Stack gap={3}>
          <Stack direction="vertical" className="align-items-center justify-content-center">
            <h2 className="display-6 text-primary mb-0">
              {data?.complete} / {data?.total}
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
              onClick={() => setShowModal(true)}
              disabled={data.incomplete === 0}
            >
              {reminderSent ? "Resend reminders" : "Send reminders"}
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
            You're about to send reminder emails to the {data.incomplete} students
            on {assignment?.name} who haven't submitted the skills questionnaire
            yet.
          </p>
          {reminderSent && (
            <p>
              You've already sent a reminder so these students will receive a
              duplicate. Please be careful not to spam them.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
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

StaffQuestionnaireStatusCard.loadData = async () => {
  const assignment = useBoundStore.getState().getSelectedAssignment();

  if (!assignment || assignment.role !== "lecturer") return null;

  try {
    const res = await api.get(
      `/api/stats/questionnaire-engagement?assignment=${assignment._id}`,
      { genericErrorToasts: false }
    );
    const data = res.data;

    return {
      complete: data?.complete ?? 0,
      incomplete: data?.incomplete ?? 0,
      total: data?.total ?? assignment?.students?.length,
    };
  } catch (e) {
    return null;
  }
};

export default StaffQuestionnaireStatusCard;
