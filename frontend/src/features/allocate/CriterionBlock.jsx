import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Card, Button, Form, FloatingLabel, Dropdown, Collapse, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { XLg, ChevronUp, ChevronDown, CardChecklist, QuestionCircle, Clipboard2Data, PersonArmsUp, Globe2, ArrowsCollapseVertical, PersonVideo3, GearWideConnected, ThreeDots, DashLg, PlusLg, PencilSquare } from "react-bootstrap-icons";
import { useState } from "react";

const getCategoryIcon = (category) => {
  switch (category) {
    case "skills":
      return <CardChecklist />;
    case "questions":
      return <QuestionCircle />;
    case "data":
      return <Clipboard2Data />;
    case "personal":
      return <PersonArmsUp />;
    case "language":
      return <Globe2 />;
    case "clash":
      return <ArrowsCollapseVertical />;
    case "meetings":
      return <PersonVideo3 />;
    case "custom":
    default:
      return <PencilSquare />;
  }
};

const getGoalOptions = (criterion) => {
  if (criterion?.type === "boolean") {
    if (criterion.name.startsWith("Custom")) {
      return {
        "proportional": "Match class-wide true/false split",
        "group-true": "Group together \"true\" values",
        "group-false": "Group together \"false\" values",
        "separate-true": "Separate \"true\" values",
        "separate-false": "Separate \"false\" values",
      };
    } else {
      return {
        "proportional": `Match class-wide ${criterion.attribute} proportion`,
        "group-true": `Group together ${criterion.attribute} students`,
        "group-false": `Group together not ${criterion.attribute} students`,
        "separate-true": `Separate ${criterion.attribute} students`,
        "separate-false": `Separate not ${criterion.attribute} students`,
      };
    }
    
  } else if (criterion?.type === "numeric") {
    return {
      "similar": "Similar students together",
      "diverse": "Diverse students together",
      "average": "Match class-wide average",
    };
  } else if (criterion?.type === "textual") {
    return {
      "similar": "Similar students together",
      "diverse": "Diverse students together",
    };
  } else {
    return {};
  }
};

const CriterionBlock = ({ index, remove, move, isFirst, isLast }) => {
  const { control, register, setValue } = useFormContext();
  const criterion = useWatch({ name: `criteria.${index}`, control });

  const goalOptions = getGoalOptions(criterion);
  const hasOptions = criterion?.options?.length > 0;

  let description = criterion.description;
  if (criterion?.fillerText && criterion?.goal) {
    description = `${criterion.goal == "similar" ? "Group together" : "Split up"} ${criterion.fillerText}`;
  }
  if (criterion?.name.startsWith("Custom") && criterion?.attribute && criterion?.goal) {
    description = `${criterion.goal == "similar" ? "Group together" : "Split up"} students who have matching "${criterion?.attribute}" attributes.`;
    if (criterion?.options.includes("ignoreMissing")) {
      description += (criterion?.ignoreMissing ? " Students without this attribute will be ignored." : " Students without this attribute will be treated as matching.");
    }
  }

  return (
  <Card className="mb-3" border="success">
    <Card.Body>
      <div className="d-flex justify-content-between align-items-center">
        { hasOptions ?
          <div 
            className="flex-grow-1 cursor-pointer" 
            onClick={() => setValue(`criteria.${index}.expanded`, !criterion.expanded)}
            style={{ cursor: "pointer" }}
          >
            <Card.Title className="d-flex align-items-center mb-1">
              {getCategoryIcon(criterion.category)}
              <span className="ms-2">{criterion.name || "Unnamed criterion"}</span>
              <OverlayTrigger
                placement="right"
                className="small"
                overlay={<Tooltip>{criterion.expanded ? "Hide" : "Show"} additional options</Tooltip>}
              >
                <Button
                  variant="link"
                  size="sm"
                  className={`p-0 ms-2 ${criterion.expanded ? "text-dark" : "text-secondary"}`}
                >
                  <GearWideConnected />
                </Button>
              </OverlayTrigger>
            </Card.Title>
            <Card.Text className="text-muted small mt-2 mb-0">{description}</Card.Text>
          </div>
        :
          <div>
            <Card.Title className="d-flex align-items-center mb-1">
              {getCategoryIcon(criterion.category)}
              <span className="ms-2">{criterion.name || "Unnamed criterion"}</span>
            </Card.Title>
            <Card.Text className="text-muted small mt-2 mb-0">{description}</Card.Text>
          </div>
        }
        
        <div className="d-flex flex-column ms-3">
          <Button
            variant="link"
            size="sm"
            style={{ color: "#dc3545" }}
            onClick={() => remove(index)}
            className="p-0"
          >
            <XLg />
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => move(index, index - 1)}
            disabled={isFirst}
            className="p-0"
          >
            <ChevronUp />
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => move(index, index + 1)}
            disabled={isLast}
            className="p-0"
          >
            <ChevronDown />
          </Button>
        </div>
      </div>

      <Collapse in={criterion.expanded}>
        <div>
          <hr className="my-3" />
          <div className="d-flex flex-column gap-3">
            {criterion.options?.includes("attribute") && (
              <FloatingLabel label="Dataset attribute (column name)">
                <Form.Control
                  {...register(`criteria.${index}.attribute`, {
                    required: `Please enter a dataset attribute name for criterion ${index + 1}`,
                  })}
                  placeholder=" "
                />
              </FloatingLabel>
            )}

            {criterion.options?.includes("goal") && (
              <Form.Group>
                <Controller
                  control={control}
                  name={`criteria.${index}.goal`}
                  rules={{ required: `Please choose a mode for criterion ${index + 1}` }}
                  render={({ field }) => (
                    <div className={Object.keys(goalOptions).length <= 2 ? "d-flex gap-4" : ""}>
                      { Object.keys(goalOptions).map((value, index) => (
                        <Form.Check
                          key={index}
                          type="radio"
                          label={goalOptions?.[value]}
                          value={value}
                          checked={field.value === value}
                          onChange={() => field.onChange(value)}
                        />
                      ))}
                    </div>
                  )}
                />
              </Form.Group>
            )}

            {criterion.options?.includes("ignoreMissing") && (
              <Form.Check
                type="switch"
                label="Ignore missing values"
                {...register(`criteria.${index}.ignoreMissing`)}
              />
            )}
          </div>
        </div>
      </Collapse>
    </Card.Body>
  </Card>
  );
};

export default CriterionBlock;
