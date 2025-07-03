import { DashCircle, PlusCircle } from "react-bootstrap-icons";
import { Controller } from "react-hook-form";

import "./style/EffortBlobsInput.css";

const EffortBlobsInput = ({ name, control, defaultValue=4, maxValue=7, }) => {
  const decrement = (field) => {
    if (field.value > 1) field.onChange(field.value - 1);
  }

  const increment = (field) => {
    if (field.value < maxValue) field.onChange(field.value + 1);
  }

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      rules={{
        required: `Please select an effort points ratings`,
        min: { value: 1, message: `You must allocate at least one effort point to each person.`, },
        max: { value: maxValue, message: `You must allocate at most ${maxValue} effort points to each person.`, },
      }}
      render={({ field }) => (
        <div
          className="d-flex align-items-center justify-content-center justify-content-md-start"
          style={{ width: "fit-content"}}
        >
          <div
            onClick={() => decrement(field)}
            className={`icon-button d-flex align-items-center ${field.value <= 1 ? "opacity-25" : "text-danger"}`}
            bg="bs-primary"
          >
            <DashCircle className="me-4"/>
          </div>

          {Array.from({length: maxValue}, (_, i) => i + 1).map(i => (
            <span key={`${name}-${i}`} className={ i <= field.value ? "blob filled" : "blob"}></span>
          ))}

          <div
            onClick={() => increment(field)}
            className={`icon-button d-flex align-items-center ${field.value >= maxValue ? "opacity-25" : "text-success"}`}
            bg="bs-primary"
          >
            <PlusCircle className="ms-4"/>
          </div>
        </div>
      )}
    />
  );
};

export default EffortBlobsInput;
