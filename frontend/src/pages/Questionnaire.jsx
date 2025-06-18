import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import "./style/Questionnaire.css";
import toast from "react-hot-toast";
import { EMOJI_RATINGS, toTitleCase } from "@/utility/helpers";
import { InfoCircle } from "react-bootstrap-icons";

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

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Allocation Questionnaire</h1>
          <p className="text-muted">
            The allocation questionnaire for {selectedAssignment.name} is open!
            Please take 5 minutes to complete it accurately, as this will help
            make sure that group allocations are as fair as possible.
          </p>
        </Col>
      </Row>

      <Row>
        <Col>
          <h3>
            Skill Rating
            <OverlayTrigger overlay={<Tooltip>Visible to module staff and your teammates</Tooltip>}>
              <InfoCircle className="ms-3" size={16} />
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
              className="mt-3 w-100"
              disabled={isSaving}
            >
              Save Ratings
            </Button>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default Questionnaire;
