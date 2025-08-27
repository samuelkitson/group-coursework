import { useAuthStore } from "@/store/authStore";
import React from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Col, Row } from "react-bootstrap";
import { ChevronRight, CodeSlash, Eyeglasses, FastForwardCircleFill, InfoCircleFill, PersonRaisedHand, QuestionCircle, QuestionCircleFill, RocketTakeoffFill } from "react-bootstrap-icons";
import { useBoundStore } from "@/store/dataBoundStore";

function Help() {
  const user = useAuthStore((state) => state.user);
  const isSupervising = useBoundStore((state) => state.assignments).some(a => a.role === "supervisor");

  return (
    <div>
      <h1>Help & support</h1>
      <p>
        {user?.role === "student" ? (
          <span>
            Your lecturers should give you an introduction to the system.
            Please contact them if you run into problems you can't solve
            with these guides.
          </span>
        ) : (
          <span>
            Please take time to read through the help guides linked below.
            These explain how to use the more advanced features.
          </span>
        )}
      </p>

      <Row>
        <Col>
          <h3 className="mb-3">Resources</h3>
        </Col>
      </Row>
      
      <Row className="gy-3">
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="d-flex align-items-center mb-3">
                <RocketTakeoffFill className="me-2 text-primary" />
                Quick start guide
              </Card.Title>
              <Card.Text className="flex-grow-1 text-muted">
                In a rush? This guide for {user?.role === "student" ? "students" : "staff members"}{" "}
                introduces you to the basics of the system in 5 minutes or less.
              </Card.Text>
              <Button
                href={`https://github.com/samuelkitson/group-coursework/tree/main/docs/help/${user?.role === "student" ? "students" : "staff"}/QuickStart.md`}
                variant="primary"
                className="d-flex align-items-center justify-content-center mt-auto"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open guide
                <ChevronRight className="ms-2" />
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="d-flex align-items-center mb-3">
                <QuestionCircleFill className="me-2 text-primary" />
                Help guides
              </Card.Title>
              <Card.Text className="flex-grow-1 text-muted">
                Access comprehensive guides to help you make the most of the system. 
                These resources are tailored specifically for {user?.role === "student" ? "students" : "staff members"}.
              </Card.Text>
              <Button
                href={`https://github.com/samuelkitson/group-coursework/tree/main/docs/help/${user?.role === "student" ? "students" : "staff"}`}
                variant="primary"
                className="d-flex align-items-center justify-content-center mt-auto"
                target="_blank"
                rel="noopener noreferrer"
              >
                View {user?.role === "student" ? "student" : "staff"} help guides
                <ChevronRight className="ms-2" />
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <Card.Title className={`d-flex align-items-center mb-3 text-${isSupervising ? "dark" : "secondary"}`}>
                <Eyeglasses className={`me-2 text-${isSupervising ? "primary" : "secondary"}`} />
                Supervisor help
              </Card.Title>
              <Card.Text className="flex-grow-1 text-muted">
                If you're supervising teams using the system, please have a read
                through the guides below which will help you get started.
              </Card.Text>
              <Button
                href={`https://github.com/samuelkitson/group-coursework/tree/main/docs/help/supervisors`}
                variant={isSupervising ? "primary" : "secondary"}
                className="d-flex align-items-center justify-content-center mt-auto"
                target="_blank"
                rel="noopener noreferrer"
              >
                View supervisor help guides
                <ChevronRight className="ms-2" />
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="text-secondary">
        <h6 className="mt-4 d-flex align-items-center">
          <CodeSlash className="me-1" /> Open source
        </h6>
        <p className="small">
          Not supported or provided by iSolutions. This project is open-source and can be found <a href="https://github.com/samuelkitson/group-coursework" target="_blank">on GitHub</a>.<br/>
          Feel free to improve the help guides, report & fix bugs and build new features.
        </p>
      </div>

      <div className="text-secondary">
        <h6 className="mt-4 d-flex align-items-center">
          <PersonRaisedHand className="me-1" /> Acknowledgements
        </h6>
        <p className="small">
          Designed and built by Sam Kitson as an ECS final year project & summer internship.<br />
          Many thanks to Richard Gomer, Adriana Wilde, Josh Curry and everyone else who contributed for their help.
        </p>
      </div>
      
    </div>
  );
}

export default Help;
