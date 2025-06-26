import { useEffect } from "react";
import { Badge } from "react-bootstrap";

const UnsavedChanges = ({ unsaved, className} ) => {
  useEffect(() => {
    // If there are unsaved changes, prevent navigating away
    const handleBeforeUnload = (e) => {
      if (unsaved) e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    // Clean up and remove the handler
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unsaved]);

  if (!unsaved) return null;

  return (
    <>
      <Badge
        pill
        bg="danger"
        style={{ fontSize: "0.7rem", verticalAlign: "middle" }}
        className={className}
      >
        Unsaved changes
      </Badge>
    </>
  );
};

export default UnsavedChanges;
