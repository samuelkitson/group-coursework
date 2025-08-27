import SaveButton from "@/components/SaveButton";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Form,
  Button,
  ListGroup,
  InputGroup,
  Card,
  Container,
  AccordionContext,
  Spinner,
  Placeholder,
} from "react-bootstrap";
import { XLg } from "react-bootstrap-icons";
import toast from "react-hot-toast";

function SkillsConfigure({ eventKey, unsaved, markUnsaved, markSaved }) {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [isPending, setIsPending] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const { activeEventKey } = useContext(AccordionContext);
  const isExpanded = activeEventKey === eventKey;

  const refreshData = () => {
    if (!isExpanded || isLoaded) return;
    Promise.all([
      api.get(`/api/assignment/${selectedAssignment._id}/skills`),
    ])
      .then(([skillsResp]) => {
        const skillsData = skillsResp.data;

        setSkills(skillsData.skills ?? []);
        setIsLoaded(true);
      });
  };

  const addSkill = (name, description = null) => {
    if (isPending) return;
    // Don't allow duplicates or blanks
    if (name === "" || name == null) return;
    if (skills.some((s) => s.name === name))
      return toast.error(`${name} has already been added.`);
    skills.unshift({
      name: name,
      description: description ?? "",
    });
    setSkillSuggestions([]);
    setNewSkillName("");
    markUnsaved();
  };

  // Remove a specific skill from the list
  const handleDeleteSkill = (index) => {
    if (isPending) return;
    setSkills(skills.filter((_, i) => i !== index));
    markUnsaved();
  };

  // Edit a skill's description
  const handleEditDescription = (index, value) => {
    const updatedSkills = [...skills];
    updatedSkills[index].description = value;
    setSkills(updatedSkills);
    markUnsaved();
  };

  const saveChanges = async () => {
    setIsPending(true);
    const updateObj = {
      skills: skills,
    };
    api
      .patch(`/api/assignment/${selectedAssignment._id}/skills`, updateObj, { successToasts: true })
      .then(() => {
        markSaved();
        updateSelectedAssignment(updateObj);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [isExpanded]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Required skills</h3>
        <SaveButton {...{ isPending, unsaved, saveChanges, size: "sm" }} />
      </div>
      <p className="text-muted">
        Students will be asked to self-assess their abilities in these skills
        during the allocation questionnaire, and you can use that data to
        create the groups.
      </p>

      <InputGroup>
        <Form.Control
          placeholder="Enter skill name"
          value={newSkillName}
          onChange={(e) => {setNewSkillName(e.target.value)}}
          onKeyDown={(e) => {
            if (e.key === "Enter") addSkill(newSkillName);
          }}
        />
        <Button
          onClick={() => addSkill(newSkillName)}
          variant="primary"
          disabled={!newSkillName}
        >
          Add
        </Button>
      </InputGroup>

      {skillSuggestions.length > 0 && (
        <ListGroup className="rounded mb-3" variant="flush">
          {skillSuggestions.map((suggestion, idx) => (
            <ListGroup.Item
              key={idx}
              action
              variant="light"
              onClick={() => useSuggestion(suggestion.name)}
            >
              {suggestion.name}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <Container className="d-flex flex-column gap-2 mt-3 px-0">
        {!isLoaded &&
          <Placeholder animation="glow">
            <Placeholder xs={6} /><br />
            <Placeholder xs={4} /><br /><br />
          </Placeholder>
        }

        {skills.map((skill, index) => (
          <Container
            key={index}
            className="d-flex align-items-center justify-content-between p-3 bg-light rounded"
          >
            <div className="flex-grow-1 me-3">
              <strong>{skill.name}</strong>
              <Form.Control
                className="mt-2"
                type="text"
                placeholder="Optional details"
                value={skill.description || ""}
                onChange={(e) => handleEditDescription(index, e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline-danger"
              className="rounded-circle"
              onClick={() => handleDeleteSkill(index)}
            >
              <XLg />
            </Button>
          </Container>
        ))}
      </Container>
    </>
  );
}

export default SkillsConfigure;
