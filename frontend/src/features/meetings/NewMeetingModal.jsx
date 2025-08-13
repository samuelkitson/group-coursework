import { utcToSelectorFormat } from '@/utility/datetimes';
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { CheckCircleFill, Eyeglasses, InfoCircle, PlusCircle, SlashCircleFill, XCircleFill, XLg } from 'react-bootstrap-icons';
import { Controller, useFieldArray, useForm, useFormState, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import Select from 'react-select';

const attendanceIcon = (status) => {
  if (status === "attended") {
    return (<CheckCircleFill className="text-success"/>)
  } else if (status === "apologies") {
    return (<SlashCircleFill className="text-warning"/>)
  } if (status === "absent") {
    return (<XCircleFill className="text-danger"/>)
  }
}

const NewMeetingModal = ({ activeModal, onHide, teamMembers, supervisors, previousActions, onSubmit, existingMeeting }) => {
  const [editMode, setEditMode] = useState(false);

  const defaultValues = {
    location: "",
    dateTime: "",
    minutes: "",
    attendance: [],
    prevActions: [],
    newActions: [],
  };
  const { control, register, reset, getValues, } = useForm({ defaultValues });
  const { fields: attendanceFields, } = useFieldArray({ control, name: "attendance", });
  const { fields: prevActionsFields, } = useFieldArray({ control, name: "prevActions", });
  const { fields: newActionsFields, remove: newActionsRemove, append: newActionsAppend, } = useFieldArray({ control, name: "newActions", });
  const watchedAttendance = useWatch({ control, name: "attendance" });

  const teamMemberOptions = teamMembers.map(user => ({
    value: user._id,
    label: user.displayName,
  }));

  const handleSubmit = () => {
    const { location, dateTime, minutes, attendance, prevActions, newActions } = getValues();
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
    const newActionsObj = newActions.filter(a => a.action != "");
    onSubmit({location, dateTime: dateTimeUTC, discussion: minutes, attendance: attendanceObj, previousActions: prevActionsObj, newActions: newActionsObj});
  };

  useEffect(() => {
    setEditMode(existingMeeting ? true : false);
    if (activeModal) {
      if (existingMeeting) {
        // Helper function to get the attendance records
        const getAttendanceById = (userId) => {
          if (existingMeeting.attendance.attended.find(a => a._id === userId)) return "attended";
          if (existingMeeting.attendance.apologies.find(a => a._id === userId)) return "apologies";
          if (existingMeeting.attendance.absent.find(a => a._id === userId)) return "absent";
          return null;
        };
        const supervisorsMarked = supervisors.map(s => ({...s, supervisor: true}));
        const memberAttendance = JSON.parse(JSON.stringify(teamMembers)).map(user => ({ ...user, status: getAttendanceById(user._id) ?? "absent"}));
        const supervisorAttendance = JSON.parse(JSON.stringify(supervisorsMarked)).map(user => ({ ...user, status: getAttendanceById(user._id) ?? "notneeded" }));
        const newActionsAdj = existingMeeting.newActions.map(a => {return {...a, assignees: a.assignees.map(m => m._id)}});
        reset({...defaultValues,
          location: existingMeeting?.location ?? "",
          dateTime: utcToSelectorFormat(existingMeeting?.dateTime) ?? "",
          minutes: existingMeeting?.discussion ?? "",
          attendance: [...memberAttendance, ...supervisorAttendance],
          prevActions: existingMeeting?.previousActions ?? [],
          newActions: newActionsAdj ?? [],
        });
      } else {
        const supervisorsMarked = supervisors.map(s => ({...s, supervisor: true}));
        const memberAttendance = JSON.parse(JSON.stringify(teamMembers)).map(user => ({ ...user, status: "attended" }));
        const supervisorAttendance = JSON.parse(JSON.stringify(supervisorsMarked)).map(user => ({ ...user, status: "notneeded" }));
        const copiedPrevActions = JSON.parse(JSON.stringify(previousActions)).map(a => ({ ...a, complete: true }));
        reset( {...defaultValues, attendance: [...memberAttendance, ...supervisorAttendance], prevActions: copiedPrevActions, newActions: [{ action: '', assignees: [] }], });
      }
    }
  }, [activeModal]);

  return (
    <Modal show={activeModal} onHide={onHide} backdrop="static" keyboard={false} size="xl">
      <Modal.Header closeButton>
        { editMode ? 
          <Modal.Title>Edit meeting minutes</Modal.Title>
        :
          <Modal.Title>Record meeting minutes</Modal.Title>
        }
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row className="mb-3 gy-3">
            <Col md={6}>
              <Form.Group className="form-floating">
                <Form.Control type="text" id="location" placeholder="Location" {...register("location")} />
                <Form.Label htmlFor="location">Meeting location</Form.Label>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="form-floating">
                <Form.Control type="datetime-local" id="dateTime" {...register("dateTime")} />
                <Form.Label htmlFor="dateTime">Date and time</Form.Label>
              </Form.Group>
            </Col>
          </Row>

          <Form.Control className="mb-1" as="textarea" placeholder="Meeting minutes" rows={4} {...register("minutes")} />
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
          {attendanceFields.map((user, index) => (
            <Form.Group as={Row} className="mb-2 d-flex align-items-center" key={user._id}>
            <Col xs={12} md={8} className="d-flex justify-content-between align-items-center mb-1 mb-md-0">
              {user?.supervisor ? 
                <Form.Label className="mb-0 me-2 text-muted">
                  <Eyeglasses className="me-1" />{user.displayName}
                </Form.Label>
              : 
                <Form.Label className="mb-0 me-2">{user.displayName}</Form.Label>
              }
              {attendanceIcon(watchedAttendance?.[index]?.status)}
            </Col>
            <Col xs={12} md={4}>
              <Form.Select {...register(`attendance.${index}.status`)} size="sm" className="w-100">
                <option value="attended">Attended</option>
                <option value="apologies">Sent apologies</option>
                <option value="absent">Absent</option>
                {user?.supervisor && <option value="notneeded">Supervisor not invited</option>}
              </Form.Select>
            </Col>
          </Form.Group>
          ))}

          { prevActionsFields?.length > 0 && <>
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
                {prevActionsFields.map((action, index) => (
                  <tr key={action.id}>
                    <td>{action.action}</td>
                    <td>{action.assignees.map(a => a.displayName).join(', ')}</td>
                    <td className="text-center">
                      <Controller control={control} name={`prevActions.${index}.complete`} render={({ field }) => (
                        <Form.Check type="checkbox" {...field} checked={!!field.value} onChange={e => field.onChange(e.target.checked)} />
                      )}/>
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
              {newActionsFields.map((action, index) => (
                <tr key={action.id}>
                  <td>
                    <Form.Control
                      type="text"
                      {...register(`newActions.${index}.action`)} 
                      placeholder="What needs doing?"
                    />
                  </td>
                  <td>
                    <Controller
                      control={control}
                      name={`newActions.${index}.assignees`}
                      render={({ field: { onChange, value, ref } }) => (
                        <Select
                          inputRef={ref}
                          isMulti
                          options={teamMemberOptions}
                          placeholder="Who will do it?"
                          menuPlacement="top"
                          value={teamMemberOptions.filter(opt => value?.includes(opt.value))}
                          onChange={opts => onChange(opts.map(opt => opt.value))}
                        />
                      )}
                    />
                  </td>
                  <td className="text-center">
                    <Button variant="link" size="sm" style={{ color: "#dc3545" }} onClick={() => newActionsRemove(index)}>
                      <XLg />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <Button
                    variant="link"
                    className="d-flex align-items-center px-1"
                    onClick={() => newActionsAppend({action: "", assignees: []})}
                  >
                    <PlusCircle/>
                  </Button>
                </td>
                <td></td>
                <td></td>
              </tr>
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
