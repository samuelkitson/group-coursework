import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { CheckCircleFill, Eyeglasses, InfoCircle, SlashCircleFill, XCircleFill, XLg } from 'react-bootstrap-icons';
import toast from 'react-hot-toast';
import Select from 'react-select';

const NewMeetingModal = ({ showModal, onHide, teamMembers, supervisors, previousActions, onSubmit }) => {
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [minutes, setMinutes] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [prevActions, setPrevActions] = useState([]);
  const [newActions, setNewActions] = useState([]);

  const teamMemberOptions = teamMembers.map(user => ({
    value: user._id,
    label: user.displayName,
  }));

  const handleAttendanceChange = (id, status) => {
    setAttendance(attendance.map(user => (user._id === id ? { ...user, status } : user)));
  };

  const attendanceIcon = (status) => {
    if (status === "attended") {
      return (<CheckCircleFill className="text-success"/>)
    } else if (status === "apologies") {
      return (<SlashCircleFill className="text-warning"/>)
    } if (status === "absent") {
      return (<XCircleFill className="text-danger"/>)
    }
  }

  const handleSetActionStatus = async (index, complete) => {
    setPrevActions(prev => prev.map((action, i) => i === index ? { ...action, complete } : action));
  };

  const handleActionChange = (index, field, value) => {
    const updated = [...newActions];
    updated[index][field] = value;
    setNewActions(updated);
  };
  
  // Called when the user has finished typing in an action field.
  const checkAddNewAction = (index, value) => {
    const updated = [...newActions];
    // If this isn't the last action, and it's empty, delete it
    if (index < updated.length - 1 && value.trim() == "") {
      return handleRemoveAction(index);
    }
    //If this is the last action field and it's not empty, add a new blank one.
    if (index === updated.length - 1 && value.trim() !== "") {
      updated.push({ action: "", assignees: [] });
      return setNewActions(updated);
    }
  };

  const handleRemoveAction = (index) => {
    setNewActions(prev => prev.filter((_, i) => i !== index));
  };

  const handleAssigneesChange = (index, selectedOptions) => {
    const assignees = selectedOptions.map(option => ({
      id: option.value,
      displayName: option.label,
    }));
    handleActionChange(index, "assignees", assignees);
  };

  const handleSubmit = () => {
    // Check if all fields are completed
    if (!location) return toast.error("Please add a meeting location.");
    if (!dateTime) return toast.error("Please add the meeting date and time.");
    if (!minutes) return toast.error("Please add some meeting minutes to summarise the discussions.");
    const actionWithoutAssignee = newActions.some(a => a.action && a.assignees.length === 0);
    if (newActions.length >= 2 && actionWithoutAssignee) return toast.error("Please assign at least one person to each new action.");
    const attendanceObj = {
      attended: attendance.filter(s => s.status === "attended").map(s => s._id),
      apologies: attendance.filter(s => s.status === "apologies").map(s => s._id),
      absent: attendance.filter(s => s.status === "absent").map(s => s._id),
    };
    // Convert timestamp to UTC
    const dateTimeUTC = new Date(dateTime).toISOString();
    const prevActionsObj = prevActions.map(a => ({action: a.action, complete: a.complete, assignees: a.assignees.map(s => s._id)}));
    const newActionsObj = newActions.slice(0, -1).map(a => ({action: a.action, assignees: a.assignees.map(s => s.id)}));
    onSubmit({location, dateTime: dateTimeUTC, discussion: minutes, attendance: attendanceObj, previousActions: prevActionsObj, newActions: newActionsObj});
  };

  useEffect(() => {
    if (showModal) {
      setLocation('');
      setDateTime('');
      setMinutes('');
      const supervisorsMarked = supervisors.map(s => ({...s, supervisor: true}));
      const memberAttendance = JSON.parse(JSON.stringify(teamMembers)).map(user => ({ ...user, status: "attended" }));
      const supervisorAttendance = JSON.parse(JSON.stringify(supervisorsMarked)).map(user => ({ ...user, status: "notneeded" }));
      setAttendance([...memberAttendance, ...supervisorAttendance]);
      const copiedPrevActions = JSON.parse(JSON.stringify(previousActions));
      setPrevActions(copiedPrevActions.map(a => ({ ...a, complete: true })));
      setNewActions([{ action: '', assignees: [] }]);
    }
  }, [showModal]);

  return (
    <Modal show={showModal} onHide={onHide} backdrop="static" keyboard={false} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Record meeting minutes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="mb-3 gy-3">
            <Col md={6}>
              <Form.Group className="form-floating">
                <Form.Control type="text" id="location" placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
                <Form.Label htmlFor="location">Meeting location</Form.Label>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="form-floating">
                <Form.Control type="datetime-local" id="dateTime" value={dateTime} onChange={e => setDateTime(e.target.value)} />
                <Form.Label htmlFor="dateTime">Date and time</Form.Label>
              </Form.Group>
            </Col>
          </Row>

          <Form.Control className="mb-1" as="textarea" placeholder="Meeting minutes" rows={4} value={minutes} onChange={e => setMinutes(e.target.value)} />
          <p className="mb-3 small text-muted">Meeting minutes should give a summary of everything that you discussed and agreed upon. Include enough detail that someone who didn't attend can understand what happened. Bullet points work well!</p>

          <h6>
            Attendance
            <OverlayTrigger overlay={<Tooltip>
              <span className="fw-semibold">Sent apologies</span> means they said they couldn't join.<br />
              <span className="fw-semibold">Absent</span> means they were expected but didn't show.
            </Tooltip>}>
              <InfoCircle className="ms-2" size={14} />
            </OverlayTrigger>
          </h6>
          {attendance.map(user => (
            <Form.Group as={Row} className="mb-2 d-flex align-items-center" key={user._id}>
            <Col xs={12} md={8} className="d-flex justify-content-between align-items-center mb-1 mb-md-0">
              {user?.supervisor ? 
                <Form.Label className="mb-0 me-2 text-muted">
                  <Eyeglasses className="me-1" />{user.displayName}
                </Form.Label>
              : 
                <Form.Label className="mb-0 me-2">{user.displayName}</Form.Label>
              }
              {attendanceIcon(user.status)}
            </Col>
            <Col xs={12} md={4}>
              <Form.Select
                value={user.status}
                onChange={(e) => handleAttendanceChange(user._id, e.target.value)}
                size="sm"
                className="w-100"
              >
                <option value="attended">Attended</option>
                <option value="apologies">Sent apologies</option>
                <option value="absent">Absent</option>
                {user?.supervisor && <option value="notneeded">Supervisor not invited</option>}
              </Form.Select>
            </Col>
          </Form.Group>
          ))}

          { prevActions?.length > 0 && <>
            <h6 className="mt-3">
              Previous actions
              <OverlayTrigger overlay={<Tooltip>
                This is what you agreed as a team last meeting. Ask everyone for
                an update on their actions.
              </Tooltip>}>
                <InfoCircle className="ms-2" size={14} />
              </OverlayTrigger>
            </h6>
            <Table bordered>
              <thead>
                <tr>
                  <th className="col-md-6">Action</th>
                  <th className="col-md-5">To be completed by</th>
                  <th className="col-md-1">Done?</th>
                </tr>
              </thead>
              <tbody>
                {prevActions.map((action, index) => (
                  <tr key={index}>
                    <td>{action.action}</td>
                    <td>{action.assignees.map(a => a.displayName).join(', ')}</td>
                    <td className="text-center">
                      <Form.Check type="checkbox" checked={action.complete} onChange={(e) => handleSetActionStatus(index, e.target.checked)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>}

          <h6 className="mt-3">
            New and ongoing actions
            <OverlayTrigger overlay={<Tooltip>
              These are the tasks that need to be completed by the next meeting.
            </Tooltip>}>
              <InfoCircle className="ms-2" size={14} />
            </OverlayTrigger>
          </h6>
          <Table bordered>
            <thead>
              <tr>
                <th className="col-md-6">Action</th>
                <th className="col-md-5">To be completed by</th>
                <th className="col-md-1">Delete</th>
              </tr>
            </thead>
            <tbody>
              {newActions.map((action, index) => (
                <tr key={index}>
                  <td>
                    <Form.Control
                      type="text"
                      value={action.action}
                      placeholder="What needs doing?"
                      onChange={(e) => handleActionChange(index, "action", e.target.value)}
                      onBlur={(e) => checkAddNewAction(index, e.target.value)}
                    />
                  </td>
                  <td>
                    {action.action.trim() && (
                      <Select
                        isMulti
                        options={teamMemberOptions}
                        placeholder="Who will do it?"
                        value={action.assignees.map(a => ({ value: a.id, label: a.displayName }))}
                        onChange={(selectedOptions) => handleAssigneesChange(index, selectedOptions)}
                        menuPlacement="top"
                      />
                    )}
                  </td>
                  <td className="text-center">
                    {action.action.trim() && (
                      <Button variant="link" size="sm" style={{ color: "#dc3545" }} onClick={() => handleRemoveAction(index)}>
                        <XLg />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <p className="text-muted">Editable for an hour after submitting</p>
        <Button variant="primary" onClick={handleSubmit}>Submit</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewMeetingModal;
