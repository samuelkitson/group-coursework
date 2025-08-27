import { Card, Col, Container, Row, Spinner } from "react-bootstrap";

const AppLoading = () => {

  return (
    <Container style={{marginTop: "5em"}}>
      <Row className="d-flex justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow">
            <Card.Body className="p-4 text-center">
                <Spinner animation="border" className="me-3 my-2" />
                <h2>Loading...</h2>
                <p className="text-muted mt-3">
                  This might take a few moments.
                </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AppLoading;
