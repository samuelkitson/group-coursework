import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Card, Button, Form, FloatingLabel, Collapse, InputGroup } from "react-bootstrap";
import { XLg, ChevronUp, ChevronDown, CardChecklist, QuestionCircle, Clipboard2Data, PersonArmsUp, Globe2, ArrowsCollapseVertical, PersonVideo3, GearWideConnected, DashLg, PlusLg } from "react-bootstrap-icons";
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
      return <GearWideConnected />;
  }
};

const getImportanceString = (importance) => {
  switch (importance) {
    case 0:
      return "Just tell me";
    case 1:
      return "Low importance";
    case 2:
      return "Medium importance";
    case 3:
      return "High importance";
    default:
      return "Rate importance";
  }
};

const textualOperations = [
  { value: "max_per_value", label: "Maximum per value", },
  { value: "min_per_value", label: "Minimum per value", },
  { value: "max_unique", label: "Maximum unique values", },
  { value: "min_unique", label: "Minimum unique values", },
];

const DealbreakerBlock = ({ index, remove, isFirst, isLast }) => {
  const { control, register } = useFormContext();
  const dealbreaker = useWatch({ name: `dealbreakers.${index}`, control });
  const [ expanded, setExpanded ] = useState(false);

  const hasOptions = dealbreaker?.options?.length > 0;

  return (
    <Card className="mb-3" border="danger">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          { hasOptions ?
            <div 
              className="flex-grow-1 cursor-pointer" 
              onClick={() => setExpanded(!expanded)}
              style={{ cursor: "pointer" }}
            >
              <Card.Title className="d-flex align-items-center mb-1">
                {getCategoryIcon(dealbreaker?.category)}
                <span className="ms-2">{dealbreaker?.name || "Unnamed deal-breaker"}</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 ms-2 text-primary small"
                >
                  {expanded ? <DashLg /> : <PlusLg />}
                </Button>
              </Card.Title>
              <Card.Text className="text-muted small mb-0">{dealbreaker?.description}</Card.Text>
            </div>
          :
            <div>
              <Card.Title className="d-flex align-items-center mb-1">
                {getCategoryIcon(dealbreaker?.category)}
                <span className="ms-2">{dealbreaker?.name || "Unnamed deal-breaker"}</span>
              </Card.Title>
              <Card.Text className="text-muted small mb-0">{dealbreaker?.description}</Card.Text>
            </div>
          } 
          <div className="d-flex flex-column ms-3">
            <Button
              variant="link"
              size="sm"
              style={{ color: "#dc3545" }}
              onClick={() => remove(index)}
              className="p-0 mb-1"
            >
              <XLg />
            </Button>
          </div>
        </div>

        <div className="d-flex align-items-center my-2">
          <Controller
            control={control}
            name={`dealbreakers.${index}.importance`}
            rules={{ required: `Please choose an importance level for deal-breaker ${index + 1}`,}}
            render={({ field }) => (
              <Form.Range
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                min={0}
                max={3}
                style={{ width: "100px" }}
                className="me-3"
              />
            )}
          />
          <span>{getImportanceString(dealbreaker?.importance)}</span>
        </div>

        {expanded && <hr className="my-3" />}
        <Collapse in={expanded}>
        <div>
          <div className="d-flex flex-column gap-3">
              {dealbreaker.options?.includes("field") && (
                <FloatingLabel label="Dataset field name">
                  <Form.Control
                    {...register(
                      `dealbreakers.${index}.field`, {
                      required: `Please enter a dataset field name for deal-breaker ${index + 1}`,
                    })}
                    placeholder=" "
                  />
                </FloatingLabel>
              )}

              {dealbreaker.options?.includes("operation") && (
                <InputGroup>
                  <Controller
                    control={control}
                    name={`dealbreakers.${index}.operator`}
                    render={({ field }) => (
                      <Form.Select 
                        {...field} 
                        style={{
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                          fontSize: "0.9rem"
                        }}
                      >
                        {textualOperations.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  <Controller
                    control={control}
                    name={`dealbreakers.${index}.operand`}
                    rules={{ 
                      required: "Value is required",
                      min: { value: 0, message: "Value must be non-negative" }
                    }}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="number"
                        placeholder="Enter value"
                        style={{
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          fontSize: '0.9rem',
                          maxWidth: '120px'
                        }}
                      />
                    )}
                  />
                </InputGroup>
              )}

              {dealbreaker.options?.includes("ignoreMissing") && (
                <Form.Check
                  type="switch"
                  label="Ignore missing values"
                  {...register(`dealbreakers.${index}.ignoreMissing`)}
                />
              )}
            </div>
          </div>
        </Collapse>
      </Card.Body>
    </Card>
  );
};

export default DealbreakerBlock;
