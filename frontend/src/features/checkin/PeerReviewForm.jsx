import React, { memo, useEffect, useState } from "react";
import { Accordion, Badge, Form } from "react-bootstrap";
import { Check, Check2, HourglassSplit } from "react-bootstrap-icons";

const PeerReviewForm = memo(({ index, answer, onChange }) => {
  const [BadgeIcon, setBadgeIcon] = useState(HourglassSplit);
  const [colour, setColour] = useState("danger");

  const handleAnswerChange = (event) => {
    const { name, value } = event.target;
    onChange(answer.recipient, name, value);
  };

  const handleSkillChange = (event) => {
    const { name, value } = event.target;
    const updatedSkills = {...answer.skills};
    updatedSkills[name] = value;
    onChange(answer.recipient, "skills", updatedSkills);
  }

  useEffect(() => {
    const blankRatings = Object.values(answer.skills).filter(s => !(s >= 1 && s <= 5));
    if (answer.comment != "" && blankRatings.length === 0) {
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
          <Form.Group>
            <Form.Label>
              {skillName}
            </Form.Label>
            <Form.Range
              min={1}
              max={5}
              name={skillName}
              value={skillValue}
              onChange={handleSkillChange}
              className="me-3"
            />
          </Form.Group>
        ))}
        <Form.Group className="mb-4">
          <Form.Label>
            Review comment
          </Form.Label>
          <Form.Control
            value={answer.comment}
            name="comment"
            onChange={handleAnswerChange}
          />
        </Form.Group>
      </Accordion.Body>
    </Accordion.Item>
  );
});

export default PeerReviewForm;
