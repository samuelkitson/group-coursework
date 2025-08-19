import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import { nextAssignmentState } from "@/utility/helpers";
import React, { useState } from "react";
import { Card, Button, Modal } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";

const AdvanceAssignmentStateCard = () => {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [activeModal, setActiveModal] = useState(null);
  const [isPending, setIsPending] = useState(false);

  let nextState = nextAssignmentState(selectedAssignment.state)?.id;

  let helpText = `The assignment state is unknown. Please go to the Dashboard to
  refresh your account.`;
  let buttonText = null;
  let modalText = "Are you sure you want to change the assignment state?";
  let forceMove = false;

  if (selectedAssignment?.students?.length == 0) {
    helpText = `Start by adding some students. Just head to the "Students" page
    in the sidebar to upload a list of students.`;
  } else if (selectedAssignment.state === "pre-allocation" && selectedAssignment?.skills?.length == 0) {
    helpText = `If you want to use the allocation skills questionnaire, please
    add some required skills on the "Configure" page. You can also skip the
    questionnaire if you prefer.`;
    buttonText = "Skip questionnaire";
    modalText = `Are you sure you want to skip the allocation skills
    questionnaire? <b>This is not recommended.</b> You won't be able to allocate
    teams using skills data and students also won't see a breakdown of skills in
    their team.<br /><br />
    It's recommended to go back and set some basic skills such as
    "Communication", "Research" and "Leading meetings", then open the
    questionnaire.`;
    nextState = "allocation";
    forceMove = true;
  } else if (selectedAssignment.state === "pre-allocation") {
    helpText = `When you're ready, click the button below to open the allocation
    skills questionnaire to all ${selectedAssignment?.students?.length}
    students.`;
    buttonText = "Open questionnaire";
    modalText = `Please confirm that you've added all the students for ${selectedAssignment.name}.
    The skills questionnaire will ask about ${selectedAssignment?.skills?.length}
    skill${selectedAssignment?.skills?.length == 1 ? "" : "s"} and will be
    available to students immediately.<br /><br />You'll be able to send a
    reminder email to students on the next page.`;
  } else if (selectedAssignment.state === "allocation-questions") {
    helpText = `When enough students have answered the skills questionnaire,
    click the button below to close it. This will let you start the allocation
    process.`;
    buttonText = "Close questionnaire";
    modalText = `You're about to close the skills questionnaire. Students won't
    be able to change their answers beyond this point.`;
  } else if (selectedAssignment.state === "allocation") {
    helpText = `You're ready to run the allocation process. Head to the
    "Allocation" page in the sidebar to get started. Once you've confirmed an
    allocation there, the assignment will automatically be opened.`;
  } else if (selectedAssignment.state === "live") {
    helpText = `The assignment is currently live. When everyone's finished,
    click the button below to lock it and mark it as complete.`;
    buttonText = "Close assignment";
    modalText = `You're about to mark the assignment "${selectedAssignment.name}"
    as complete. This will place it in a read-only state where students won't be
    able to make any further changes, but they'll still be able to see their 
    meeting history.<br /><br />Please confirm this action below.`
  } else if (selectedAssignment.state === "closed") {
    helpText = `The assignment has been marked as complete. It's currently in a
    read-only state for students.`;
    buttonText = "Re-open assignment";
    modalText = `If you've accidentally marked this assignment as closed, you
    can go back and re-open it here. This will unlock it and all students will
    be able to record meetings and check-ins again. It will also re-appear on
    everyone's dashboard.<br /><br />Please confirm this action below.`;
    nextState = "live";
    forceMove = true;
  }

  const saveChanges = async () => {
    if (!nextState) return;
    setIsPending(true);
    const updateObj = {
      newState: nextState,
      force: forceMove,
    };
    api
      .patch(`/api/assignment/${selectedAssignment._id}/state`, updateObj, {
        successToasts: true,
      })
      .then(() => {
        setIsPending(false);
        updateSelectedAssignment({ state: nextState });
      })
      .finally(() => {
        setIsPending(false);
        setActiveModal(null);
      });
  };

  return (
    <Card className="p-3 shadow h-100">
      <Card.Body className="py-0">
        <h5 className="text-center mb-3">Assignment state</h5>
        <Card.Text className="mt-2 text-muted">
          {helpText}
        </Card.Text>
        {buttonText && <Button
          variant="primary"
          className="d-flex align-items-center"
          onClick={() => setActiveModal("confirm-state-change")}
          disabled={isPending}
        >
          {buttonText} <ChevronRight className="ms-2" />
        </Button>}
      </Card.Body>

      <Modal show={activeModal === "confirm-state-change"} onHide={() => setActiveModal(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Change assignment state</Modal.Title>
        </Modal.Header>
        <Modal.Body dangerouslySetInnerHTML={{ __html: modalText }}>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={saveChanges} disabled={isPending}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default AdvanceAssignmentStateCard;
