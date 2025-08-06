import { Form, Modal, Table, Button } from "react-bootstrap";
import { CheckCircleFill, InfoCircleFill, QuestionCircle, XCircleFill, Upload, FileEarmarkText, ExclamationTriangleFill, Check2All, Download } from "react-bootstrap-icons";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { useBoundStore } from "@/store/dataBoundStore";

const columnDefinitions = {
  "email": "A student's unique email address. Provide this in the format aa1g25@soton.ac.uk.",
  "marks": "Historic marks for a student, provided as a number between 0 and 100.",
  "degree": "A student's degree programme, for example \"Computer Science BSc\". Ensure identical spellings for degrees that you want to group together/split up.",
  "enrolled": "Indicates whether a student has enrolled. Should be \"true\" or \"false\".",
  "international": "Idenfities home and international students. Should be \"true\" for international students and \"false\" otherwise.",
  "gender": "Represents a student's gender. Should be \"male\", \"female\" or \"other\". It's recommended to relabel any different values as \"other\".",
};

const DatasetUpload = ({ showModal, onHide, currentFileName, datasetColumns, requiredColumns, handleDatasetUpload }) => {
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields;
          // Check whether all required headers are present
          const requiredColsSet = new Set(requiredColumns);
          const datasetColsSet = new Set(headers);
          const colsDiff = requiredColsSet.difference(datasetColsSet);
          
          // Always update the dataset, regardless of missing columns
          handleDatasetUpload(selectedFile, headers);
          
          if (colsDiff.size === 0) {
            toast.success("Dataset uploaded successfully with all required columns.");
          } else {
            toast.error(`Dataset uploaded but is missing required columns: ${Array.from(colsDiff).join(", ")}.`);
          }
        },
      });
    }
    // Clear the file input so the same file can be re-selected if needed
    e.target.value = "";
  };

  // Calculate missing columns for display
  const getMissingColumns = () => {
    if (!requiredColumns || !datasetColumns) return [];
    const requiredColsSet = new Set(requiredColumns);
    const datasetColsSet = new Set(datasetColumns);
    return Array.from(requiredColsSet.difference(datasetColsSet));
  };

  const downloadTemplate = () => {
    if (!requiredColumns || requiredColumns.length <= 1) {
      toast.error("No template available - no required columns specified.");
      return;
    }

    // Create CSV content with headers
    const csvContent = Papa.unparse([requiredColumns]);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Student data template (${selectedAssignment.name}).csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Template CSV downloaded successfully.");
  };

  const missingColumns = getMissingColumns();

  return (
    <Modal show={showModal} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Additional student data</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="alert alert-warning d-flex align-items-center mb-3" role="alert">
          <InfoCircleFill className="me-2 flex-shrink-0" />
          <div>
            Select all of the criteria and deal-breakers you need before uploading a dataset.
          </div>
        </div>

        <div className="mb-3 p-3 bg-light rounded border">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center flex-grow-1 min-width-0">
              <FileEarmarkText className="me-2 text-primary flex-shrink-0" />
              <div className="min-width-0 flex-grow-1">
                <div className="fw-semibold">
                  {currentFileName ? `Current dataset: ${currentFileName}` : "No dataset uploaded"}
                </div>
                {missingColumns.length > 0 &&
                  <div className="text-danger small d-flex align-items-center">
                    <ExclamationTriangleFill className="me-1" />Missing required columns
                  </div>
                }
                {(missingColumns.length == 0 && requiredColumns?.length > 1 && currentFileName) &&
                  <div className="text-success small d-flex align-items-center">
                    <Check2All className="me-1" />All required columns present
                  </div>
                }
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 flex-shrink-0">
              { (requiredColumns && requiredColumns.length > 1) &&
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={downloadTemplate}
                >
                  <Download className="me-1" />
                  <span>Template</span>
                </Button>
              }
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => document.getElementById('file-upload').click()}
              >
                <Upload className="me-1" />
                <span className="d-none d-sm-inline">
                  {currentFileName ? "Replace" : "Upload"}
                </span>
                <span className="d-sm-none">
                  {currentFileName ? "Replace" : "Upload"}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <Form.Control 
          id="file-upload"
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {requiredColumns && requiredColumns.length > 1 ? ( <>
          <div className="mb-4">
            <p className="mb-0">
              Some criteria and deal-breakers require extra data. Provide this
              in a CSV with the columns below and a row for each student. For
              security, uploaded files will not be stored.
            </p>
          </div>

          <div className="table-responsive">
            <Table striped hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="fw-semibold">Column</th>
                  <th scope="col" className="fw-semibold">Information</th>
                  {datasetColumns && <th scope="col" className="fw-semibold" style={{ minWidth: "90px" }}>Status</th>}
                </tr>
              </thead>
              <tbody>
                {requiredColumns.map((col, idx) => (
                  <tr key={idx}>
                    <td className="fw-medium">{col}</td>
                    <td className="text-muted">
                      {columnDefinitions?.[col] ?? "This is a custom attribute."}
                    </td>
                    {datasetColumns && (datasetColumns.includes(col) ? 
                      <td className="text-success text-center align-middle">
                        <CheckCircleFill className="me-2" />
                        <span className="small">Present</span>
                      </td>
                    :
                      <td className="text-danger text-center align-middle">
                        <XCircleFill className="me-2" />
                        <span className="small">Missing</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </> ) : (
          <div className="">
            Some criteria and deal-breakers require you to upload extra data.
            However, you haven't selected any of these so you don't need to
            provide an additional dataset.
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default DatasetUpload;
