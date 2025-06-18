import { Button } from "react-bootstrap";
import { Floppy2Fill, HourglassSplit } from "react-bootstrap-icons";

const SaveButton = ({ unsaved, pending, saveChanges, variant="primary", size="md", doNotHide=false }) => {
  if (!unsaved && !doNotHide) return null;

  return (
    <Button variant={variant} size={size} disabled={pending || !unsaved} onClick={saveChanges} className="d-flex align-items-center">
      {pending ? (
        <>
          <HourglassSplit className="me-2" />
          Saving...
        </>
      ) : (
        <>
          <Floppy2Fill className="me-2" />
          Save changes
        </>
      )}
    </Button>
  );
};

export default SaveButton;
