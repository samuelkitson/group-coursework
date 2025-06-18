import UnsavedChanges from "@/components/UnsavedChanges";
import AssignmentSettings from "@/features/configure/AssignmentSettings";
import SkillsConfigure from "@/features/configure/SkillsConfigure";
import { useBoundStore } from "@/store/dataBoundStore";
import React, { useState } from "react";
import { Row, Col } from "react-bootstrap";

function ConfigureAssignment() {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const [unsavedChanges, setUnsavedChanges] = useState({
    skills: false,
    questions: false,
  });

  const setSaveState = (target, unsavedChange) =>
    setUnsavedChanges((changes) => ({ ...changes, [target]: unsavedChange }));

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>
            Configure{" "}
            <UnsavedChanges
              unsaved={Object.values(unsavedChanges).some((x) => x)}
            />
          </h1>
          <p className="text-muted">
            Use the settings on this page to configure your assignment,{" "}
            {selectedAssignment.name}.
          </p>
        </Col>
      </Row>

      <Row className="mb-4 gy-4 gx-5">
        <Col lg={6} className="border-end">
          <AssignmentSettings
            unsaved={unsavedChanges.settings}
            markUnsaved={() => setSaveState("settings", true)}
            markSaved={() => setSaveState("settings", false)}
          />
        </Col>
        <Col lg={6}>
          <SkillsConfigure
            unsaved={unsavedChanges.skills}
            markUnsaved={() => setSaveState("skills", true)}
            markSaved={() => setSaveState("skills", false)}
          />
        </Col>
      </Row>
    </>
  );
}

export default ConfigureAssignment;
