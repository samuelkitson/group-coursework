import React, { memo, useEffect, useState } from "react";
import { Accordion, Badge, Col, Form, Row } from "react-bootstrap";
import { Check, Check2, HourglassSplit, Star, StarFill } from "react-bootstrap-icons";

const PeerReviewForm = memo(({ index, answer, onChange }) => {
  const [BadgeIcon, setBadgeIcon] = useState(HourglassSplit);
  const [colour, setColour] = useState("danger");
  const [hoveredSkill, setHoveredSkill] = useState(null);

  const handleAnswerChange = (event) => {
    const { name, value } = event.target;
    onChange(answer.recipient, name, value);
  };

  const handleSkillChange = (name, value) => {
    const updatedSkills = {...answer.skills};
    updatedSkills[name] = value;
    onChange(answer.recipient, "skills", updatedSkills);
  };

  const getStarColour = (value, starNumber) => {
    if (starNumber > value) return "secondary";
    if (value <= 1) return "danger";
    if (value <= 3) return "warning"
    if (value <= 5) return "success";
    return "secondary";
  };

  useEffect(() => {
    const blankRatings = Object.values(answer.skills).filter(s => !(s >= 1 && s <= 5));
    if (answer.comment.length > 50 && blankRatings.length === 0) {
      setBadgeIcon(Check2);
      setColour("success");
    } else {
      setBadgeIcon(HourglassSplit);
      setColour("danger");
    }
  }, [answer]);

  return (
    <Accordion.Item key={answer.recipient} eventKey={answer.recipient}>
      <Accordion.Header>
        <BadgeIcon className={`me-2 text-${colour}`}/>
        {answer.name}
      </Accordion.Header>
      <Accordion.Body>
        {Object.entries(answer.skills).map(([skillName, skillValue]) => (
          <Form.Group as={Row} className="align-items-center">
            <Form.Label column md={4} className={`mb-md-2 py-1 ${hoveredSkill===skillName && "fw-bold"}`}>
              {skillName}
            </Form.Label>
            <Col
              md={8}
              onMouseEnter={() => setHoveredSkill(skillName)}
              onMouseLeave={() => setHoveredSkill(null)}
              className="mb-3 mb-md-2"
            >
              {[1, 2, 3, 4, 5].map((i) => {
                const filled = i <= (skillValue);
                const StarIcon = filled ? StarFill : Star;
                return (
                  <StarIcon
                    key={i}
                    size={24}
                    className={`me-2 text-${getStarColour(skillValue, i)}`}
                    role="button"
                    onClick={() => handleSkillChange(skillName, i)}
                  />
                );
              })}
            </Col>
          </Form.Group>
        ))}
        <Form.Group className="mt-3">
          <Form.Label className="text-muted">
            Please give {answer.name} some feedback about their recent work.
            What have they done well and how could they improve? Your comments
            will be moderated and shared with them anonymously.
          </Form.Label>
          <Form.Control
            as="textarea"
            name="comment"
            rows={3}
            value={answer.comment}
            onChange={handleAnswerChange}
            placeholder="Review comments"
          />
        </Form.Group>
      </Accordion.Body>
    </Accordion.Item>
  );
});

export default PeerReviewForm;
