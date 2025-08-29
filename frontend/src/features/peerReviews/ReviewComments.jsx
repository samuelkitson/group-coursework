import api from "@/services/apiMiddleware";
import { useState } from "react";
import { Button, ButtonGroup, Card, Col, Form, ListGroup, Modal, Row } from "react-bootstrap";
import { ExclamationTriangle, PencilSquare, PersonCircle, QuestionCircle, QuestionCircleFill, Trash3, XLg } from "react-bootstrap-icons";
import { useForm } from "react-hook-form";

const ReviewComments = ({peerReviewId, teamId, reviewComments, currentStudent, reloadReview}) => {
  if (!reviewComments || !currentStudent) {
    return (
      <Card className="shadow">
        <Card.Body>
          <Card.Title className="d-flex align-items-center">
            <QuestionCircleFill className="me-2" /> Workload balance only
          </Card.Title>
          <p className="text-muted mb-0">
            This week was configured as a "simple" check-in and students
            were only asked to rate the workload balance.
          </p>
        </Card.Body>
      </Card>
    );
  }

  const receivedComments = reviewComments.filter(c => c.forName === currentStudent);

  const [activeModal, setActiveModal] = useState(null);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  const defaultValues = { moderatedComment: "", };
  const { control, register, reset, getValues, } = useForm({ defaultValues });

  const showEditModal = (commentIdx) => {
    reset({ moderatedComment: receivedComments[commentIdx]?.comment ?? ""});
    setReviewToEdit(receivedComments[commentIdx]);
    setActiveModal("edit-comment");
  };

  const showDeleteModal = (commentIdx) => {
    setReviewToEdit(receivedComments[commentIdx]);
    setActiveModal("delete-comment");
  };

  const handleSubmitEdit = () => {
    const { moderatedComment } = getValues();
    const updateObj = {
      peerReview: peerReviewId,
      team: teamId,
      reviewer: reviewToEdit?.fromId,
      recipient: reviewToEdit?.forId,
      moderatedComment,
    }
    api
      .patch("/api/checkin/response", updateObj, {successToasts: true})
      .then((data) => {
        setReviewToEdit(null);
        setActiveModal(null);
        reset(defaultValues);
        reloadReview();
      });
  };

  const handleSubmitDelete = () => {
    const updateObj = {
      peerReview: peerReviewId,
      team: teamId,
      reviewer: reviewToEdit?.fromId,
      recipient: reviewToEdit?.forId,
    }
    api
      .patch("/api/checkin/response", updateObj, {successToasts: true})
      .then((data) => {
        setReviewToEdit(null);
        setActiveModal(null);
        reloadReview();
      });
  };

  return (
    <div>
      {receivedComments.length === 0 && <div className="d-flex align-items-center text-muted">
        <QuestionCircle className="me-2" />
        None of {currentStudent}'s team members submitted peer reviews.
      </div>}
      <ListGroup className="shadow">
        {receivedComments.map((comment, idx) => (
          <ListGroup.Item key={`review-comment-${idx}`}>
            <Row>
              <Col md={10}>
                { comment?.comment ? `"${comment.comment}"` : <span className="fst-italic">Comment removed</span> }<br/>
                <span className="text-muted" style={{fontSize: "0.9em"}}>
                  <PersonCircle className="me-1" />
                  {comment.fromName}
                </span>
                { comment?.originalComment && <span className="text-danger" style={{fontSize: "0.9em"}}>
                <ExclamationTriangle className="ms-2 me-1" />
                Moderated
                </span>}
              </Col>
              <Col md={2} className="d-flex align-items-center justify-content-end">
                <ButtonGroup>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => showEditModal(idx)}
                >
                  <PencilSquare />
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  className=""
                  onClick={() => showDeleteModal(idx)}
                >
                  <Trash3 />
                </Button>
                </ButtonGroup>
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <Modal show={activeModal === "edit-comment"} size="lg" centered>
        <Modal.Header>
          <Modal.Title>Moderate review comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You're editing the review comment that {reviewToEdit?.fromName} left
          for {reviewToEdit?.forName}. Their original comment will still be
          accessible to module staff and is shown below:<br />
          <p className="mt-2 fst-italic">
            {reviewToEdit?.originalComment ?? reviewToEdit?.comment}
          </p>
          <Form.Control
            as="textarea"
            name="moderatedComment"
            rows={3}
            {...register("moderatedComment")}
            placeholder="The comment has been deleted, but you can input a summary here."
          />
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitEdit}>
            Confirm edits
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={activeModal === "delete-comment"} size="lg" centered onHide={() => setActiveModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete review comment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You're about to delete the review comment that {reviewToEdit?.fromName}{" "}
          left for {reviewToEdit?.forName}. Their comment is shown below:<br />
          <p className="mt-2 fst-italic">
            {reviewToEdit?.originalComment ?? reviewToEdit?.comment}
          </p>
          Are you sure you want to delete this comment, rather than editing it?
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={() => setActiveModal(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmitDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
};

export default ReviewComments;
