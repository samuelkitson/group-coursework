import { useState } from "react";
import { Star, StarFill } from "react-bootstrap-icons";
import { Controller } from "react-hook-form";

const StarRatingInput = ({ name, control, label, defaultValue=0, }) => {
  const [ hoverValue, setHoverValue ] = useState(null);

  const getStar = (value, starNumber) => {
    const compareValue = hoverValue ?? value;
    if (starNumber > compareValue) return [Star, "text-gray-400"];
    const Icon = (hoverValue && hoverValue != value) ? Star : StarFill;
    if (compareValue <= 1) return [Icon, "text-danger"];
    if (compareValue <= 3) return [Icon, "text-warning"];
    if (compareValue <= 5) return [Icon, "text-success"];
    return [Star, "text-gray-400"];
  };

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field }) => (
        <div
          className="flex items-center"
          style={{ width: "fit-content"}}
          onMouseLeave={() => setHoverValue(null)}
        >
          {[1, 2, 3, 4, 5].map((i) => {
            const [ StarIcon, starColour ] = getStar(field.value, i);
            return (
              <StarIcon
                key={i}
                size={24}
                className={`me-2 cursor-pointer transition-colors duration-200 ${starColour}`}
                role="button"
                onClick={() => field.onChange(i)}
                onMouseEnter={() => setHoverValue(i)}
              />
            );
          })}
        </div>
      )}
    />
  );
};

export default StarRatingInput;
