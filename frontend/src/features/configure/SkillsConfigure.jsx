import SaveButton from "@/components/SaveButton";
import api from "@/services/apiMiddleware";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useEffect, useState } from "react";
import {
  Form,
  Button,
  ListGroup,
  InputGroup,
  Card,
  Container,
} from "react-bootstrap";
import { XLg } from "react-bootstrap-icons";
import toast from "react-hot-toast";

function SkillsConfigure({ unsaved, markUnsaved, markSaved }) {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const updateSelectedAssignment = useBoundStore(
    (state) => state.updateSelectedAssignment,
  );
  const [isPending, setIsPending] = useState(false);

  const [existingSkills, setExistingSkills] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);

  const refreshData = () => {
    setExistingSkills([]);
    // Get the current required skills
    api
      .get(`/api/assignment/${selectedAssignment._id}/skills`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setSkills(data?.skills ?? []);
      });
    // Get the suggested skills
    api
      .get("/api/questionnaire/existing-skills")
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setExistingSkills(data);
      });
  };

  const addSkill = (name, description = null) => {
    // Don't allow duplicates or blanks
    if (name === "" || name == null) return;
    if (skills.some((s) => s.name === name))
      return toast.error(`${name} has already been added.`);
    skills.unshift({
      name: name,
      description: description ?? "",
    });
    setNewSkillName("");
    setSkillSuggestions([]);
    markUnsaved();
  };

  // Handler for when the new skill name is edited, used to update the suggestions
  const handleSkillChange = (e) => {
    const value = e.target.value;
    setNewSkillName(value);
    const selectedSkillnames = skills.map((s) => s.name);
    setSkillSuggestions(
      value
        ? existingSkills
            .filter(
              (skill) =>
                skill.name
                  .toLowerCase()
                  .includes(value.toLowerCase()) &&
                !selectedSkillnames.includes(skill.name),
            )
            .slice(0, 5)
        : [],
    );
  };

  // Remove a specific skill from the list
  const handleDeleteSkill = (index) => {
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

  // Select a suggestion and add it to the skills list
  const useSuggestion = (suggestionname) => {
    const suggestion = existingSkills.find((s) => s.name === suggestionname);
    if (suggestion == undefined) return;
    addSkill(suggestion.name, suggestion.description, suggestion.name);
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
  useEffect(refreshData, [selectedAssignment]);

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
          onChange={handleSkillChange}
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
