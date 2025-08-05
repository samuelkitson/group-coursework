import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Card, Button, Form, FloatingLabel } from "react-bootstrap";
import { XLg, ChevronUp, ChevronDown, CardChecklist, QuestionCircle, Clipboard2Data, PersonArmsUp, Globe2, ArrowsCollapseVertical, PersonVideo3, GearWideConnected } from "react-bootstrap-icons";

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
      return <GearWideConnected />;
  }
};

const CriterionBlock = ({ index, remove, move, isFirst, isLast }) => {
  const { control, register } = useFormContext();
  const criterion = useWatch({ name: `criteria.${index}`, control });

  return (
    <Card className="mb-3" border="success">
      <Card.Body className="d-flex justify-content-between align-items-center">
        <div>
          <Card.Title className="d-flex align-items-center">
            {getCategoryIcon(criterion.category)}
            <span className="ms-2">{criterion.name || "Unnamed Criterion"}</span>
          </Card.Title>
          <Card.Text>{criterion.description}</Card.Text>

          {criterion.options?.includes("field") && (
            <FloatingLabel label="Dataset field name">
              <Form.Control
                {...register(
                  `criteria.${index}.fieldName`, {
                  required: `Please enter a dataset field name for criterion ${index + 1}`,
                })}
                placeHolder=" "
                className="mb-2"
              />
            </FloatingLabel>
          )}

          {criterion.options?.includes("goal") && (
            <Form.Group className="mb-2">
              <Controller
                control={control}
                name={`criteria.${index}.goal`}
                rules={{ required: `Please choose a mode for criterion ${index + 1}`,}}
                render={({ field }) => (
                  <>
                    <Form.Check
                      type="radio"
                      label="Similar students together"
                      value="similar"
                      checked={field.value === "similar"}
                      onChange={() => field.onChange("similar")}
                    />
                    <Form.Check
                      type="radio"
                      label="Diverse students together"
                      value="diverse"
                      checked={field.value === "diverse"}
                      onChange={() => field.onChange("diverse")}
                    />
                  </>
                )}
              />
            </Form.Group>
          )}

          {criterion.options?.includes("missing") && (
            <Form.Check
              type="switch"
              label="Ignore missing values"
              {...register(`criteria.${index}.ignoreMissing`)}
              className="mb-2"
            />
          )}
        </div>

        <div className="d-flex flex-column">
          <Button
            variant="link"
            size="sm"
            style={{ color: "#dc3545" }}
            onClick={() => remove(index)}
          >
            <XLg />
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => move(index, index - 1)}
            disabled={isFirst}
          >
            <ChevronUp />
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => move(index, index + 1)}
            disabled={isLast}
          >
            <ChevronDown />
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CriterionBlock;
