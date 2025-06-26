import UnsavedChanges from "@/components/UnsavedChanges";
import AssignmentSettings from "@/features/configure/AssignmentSettings";
import SkillsConfigure from "@/features/configure/SkillsConfigure";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useState } from "react";
import { Row, Col, Accordion, Badge } from "react-bootstrap";

function ConfigureAssignment() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );

  const settingsPanes = [
    {
      name: "Basic settings",
      key: "settings",
      component: AssignmentSettings,
    },{
      name: "Skills questionnaire",
      key: "skills-questionnaire",
      component: SkillsConfigure,
    },
  ];

  const [unsavedChanges, setUnsavedChanges] = useState(settingsPanes.reduce((acc, p) => {
    acc[p.key] = false;
    return acc;
  }, {}));

  const setSaveState = (target, unsavedChange) =>
    setUnsavedChanges((changes) => ({ ...changes, [target]: unsavedChange }));

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>
            Configure
          </h1>
          <p className="text-muted">
            Use the settings on this page to configure your assignment,{" "}
            {selectedAssignment.name}.
          </p>
        </Col>
      </Row>

      <Row className="mb-4 gy-4 gx-5">
        <Accordion className="mt-0">
          { settingsPanes.map(p => (
            <Accordion.Item key={p.key} eventKey={p.key}>
              <Accordion.Header>
                {p.name}
                <UnsavedChanges
                  unsaved={unsavedChanges[p.key]}
                  className="ms-2"
                />
              </Accordion.Header>
              <Accordion.Body>
                <p.component
                  unsaved={unsavedChanges[p.key]}
                  markUnsaved={() => setSaveState(p.key, true)}
                  markSaved={() => setSaveState(p.key, false)}
                />
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </Row>
    </>
  );
}

export default ConfigureAssignment;
