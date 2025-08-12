import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import "./style/Questionnaire.css";
import toast from "react-hot-toast";
import { EMOJI_RATINGS, toTitleCase } from "@/utility/helpers";
import { ChevronRight, Eye, InfoCircle, QuestionCircle, QuestionCircleFill } from "react-bootstrap-icons";

function Questionnaire() {
  const navigate = useNavigate();
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [skillsList, setSkillsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const refreshData = () => {
    setSkillsList([]);
    setIsLoading(true);
    api
      .get(`/api/questionnaire/skills?assignment=${selectedAssignment._id}`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setSkillsList(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const ratingDescription = (rating) => {
    if (rating >= 1 && rating <= 7) {
      return EMOJI_RATINGS[rating - 1];
    } else {
      return { emoji: "🫥", text: "Rate me!" };
    }
  };

  const handleSliderChange = (skillName, rating) => {
    rating = parseInt(rating);
    setSkillsList((skills) =>
      skills.map((skill) =>
        skill.name === skillName ? { ...skill, rating } : skill,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedSkills = {};
    for (const skill of skillsList) {
      if (typeof skill.rating !== "number") {
        return toast.error("Please rate all of the skills before saving.");
      }
      updatedSkills[skill.name] = skill.rating;
    }
    if (skillsList.length > 1 && Object.values(updatedSkills).every((val, i, arr) => val === arr[0])) {
      return toast.error("You can't give every skill the same score.");
    }
    // Send to the server
    setIsSaving(true);
    api
      .patch(
        `/api/questionnaire/skills`,
        { skills: updatedSkills },
        { successToasts: true },
      )
      .then(() => {
        navigate("/assignment/overview");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  useEffect(refreshData, [selectedAssignment]);

  if (!isLoading && skillsList?.length == 0) return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Skills questionnaire</h1>
          <p className="text-muted">
            The module team for {selectedAssignment.name} is getting ready to
            allocate teams. 
          </p>
        </Col>
      </Row>

      <Card className="shadow">
        <Card.Body>
          <Card.Title className="d-flex align-items-center">
            <QuestionCircleFill className="me-2" /> No questions found
          </Card.Title>
          <p className="text-muted mb-0">
            No questions have been configured for this assignment. If you think
            this is a mistake, please contact your lecturers.
          </p>
        </Card.Body>
      </Card>
    </>
  )

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Skills questionnaire</h1>
          <p className="text-muted">
            The allocation questionnaire for {selectedAssignment.name} is open!
            Please take 5 minutes to tell us how confident you are in each of
            these key skills.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <h6 className="d-flex align-items-center">
            <QuestionCircleFill className="me-1" />
            How is this data used?
          </h6>
          <p className="text-muted">
            Staff can use these ratings to make teams with good coverage of the
            key skills for this assignment. Your best skills will also be shown
            to your team, meaning you're more likely to be given tasks that suit
            you.
          </p>
          <p className="text-muted">
            <span className="fw-semibold">It's important to answer honestly</span>,
            otherwise you may be placed in a team that's missing key skills.
            Your responses will be visible to staff alongside your historic
            marks.
          </p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h3>
            Rate your skills
            <OverlayTrigger overlay={<Tooltip>Visible to module staff.<br />Top skill visible to your teammates.</Tooltip>}>
              <Eye className="ms-2" size={16} />
            </OverlayTrigger>
          </h3>
          <Form onSubmit={handleSubmit}>
            {skillsList.map((skill) => (
              <Form.Group
                key={skill.name}
                controlId={`skill-${skill.name}`}
                className="mb-4 mb-lg-3"
              >
                <Form.Label className="mb-0">
                  {skill.name}
                </Form.Label>
                {skill.description && (
                  <Form.Label className="d-block mb-0 text-muted">
                    {skill.description}
                  </Form.Label>
                )}
                <Row className="mt-2">
                  <Col xs={12} md={8}>
                    <Form.Control
                      as="input"
                      type="range"
                      min={1}
                      max={7}
                      value={skill.rating || 4} // Default if no rating exists
                      onChange={(e) =>
                        handleSliderChange(skill.name, e.target.value)
                      }
                    />
                  </Col>
                  <Col
                    xs={12}
                    md={4}
                    className="mt-2 mt-lg-0 d-flex align-items-center"
                  >
                    <h3 className="d-inline me-1 mb-0">
                      {ratingDescription(skill.rating).emoji}
                    </h3>
                    <span className="d-inline text-muted mb-0">
                      {ratingDescription(skill.rating).text}
                    </span>
                  </Col>
                </Row>
              </Form.Group>
            ))}
            <Button
              variant="primary"
              type="submit"
              className="mt-3 d-flex align-items-center"
              disabled={isSaving}
            >
              Save ratings
              <ChevronRight className="ms-2" />
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default Questionnaire;
