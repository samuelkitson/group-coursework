import { Card, Col, ListGroup, Row } from "react-bootstrap";
import { PersonCircle, QuestionCircle, QuestionCircleFill } from "react-bootstrap-icons";

const ReviewComments = ({reviewComments, currentStudent}) => {
  if (!reviewComments || !currentStudent) {
    return (<Card>
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <QuestionCircleFill className="me-2" /> Workload balance only
                </Card.Title>
                <p className="text-muted mb-0">
                  This week was configured as a "simple" check-in and students
                  were only asked to rate the workload balance.
                </p>
              </Card.Body>
            </Card>);

    return (<>
    
      <p className="text-muted">
        This week was configured as a "simple" check-in, and students were only
        asked to rate the workload balance.
      </p>
    </>);
  }

  const receivedComments = reviewComments.filter(c => c.forName === currentStudent);

  return (
    <div>
      {receivedComments.length === 0 && <div className="d-flex align-items-center text-muted">
        <QuestionCircle className="me-2" />
        None of {currentStudent}'s team members submitted peer reviews.
      </div>}
      <ListGroup>
        {receivedComments.map((comment, idx) => (
          <ListGroup.Item key={`review-comment-${idx}`}>
            <Row>
              <Col md={10}>
                "{comment?.comment}"<br/>
                <span className="text-muted" style={{fontSize: "0.9em"}}>
                  <PersonCircle className="me-1" />
                  {comment.fromName}
                </span>
              </Col>
              <Col >

              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  )
};

export default ReviewComments;
