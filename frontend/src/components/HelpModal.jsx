import { useBoundStore } from "@/store/dataBoundStore";
import { pageMap } from "@/utility/assignmentPageMapping";
import { Modal } from "react-bootstrap";
import { useLocation } from "react-router-dom";

const HelpModal = ({show, onHide}) => {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );
  const location = useLocation();
  const pageInfo = pageMap.find(p => p.link === location.pathname);
  if (!pageInfo) {
    onHide();
    return null;
  }
  
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        Help for {pageInfo?.label}
      </Modal.Header>
      <Modal.Body>

      </Modal.Body>
    </Modal>
  )

}

export default HelpModal;
