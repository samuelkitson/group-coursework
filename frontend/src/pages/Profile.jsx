import SaveButton from "@/components/SaveButton";
import UnsavedChanges from "@/components/UnsavedChanges";
import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { ChevronRight } from "react-bootstrap-icons";

function Profile() {
  const { user } = useAuthStore();
  const [meetingPref, setMeetingPref] = useState(user.meetingPref ?? "either");
  const [bio, setBio] = useState(user.bio ?? "");
  const [unsaved, setUnsaved] = useState(false);
  const [pending, setPending] = useState(false);

  const updateMeetingPref = (newPref) => {
    setMeetingPref(newPref);
    setUnsaved(true);
  };

  const updateBio = (newBio) => {
    setBio(newBio);
    setUnsaved(true);
  };

  const submitProfileUpdates = () => {
    setPending(true);
    api
      .patch(`/api/student/profile`, { meetingPref, bio, }, { successToasts: true, })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setUnsaved(false);
      }).finally(() => {
        setPending(false);
      });
  };

  const refreshData = () => {
    if (user.role !== "student") return;
    // Get the user's latest bio and meeting preference
    api
      .get(`/api/student/profile`)
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        setBio(data.profile?.bio ?? "");
        setMeetingPref(data.profile?.meetingPref ?? "either");
        setUnsaved(false);
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [user]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col md={9}>
          <h1>
            My profile{" "}
            <UnsavedChanges unsaved={unsaved} />
          </h1>
          <p className="text-muted">
            { user.role === "student" ?  
            "Use this page to edit your personal details that are visible to other students and staff. Note that many of the details here aren't user editable."
            :
            "Here you can see your personal details that are visible to students and other staff. As a staff member, you can't edit any of the details here yourself."
            }
          </p>
        </Col>
        <Col xs={12} md={3} className="d-flex flex-column align-items-end mt-md-2">
          <SaveButton {...{ pending, unsaved, saveChanges: submitProfileUpdates, doNotHide: true }} />
        </Col>
      </Row>

      <Form.Group as={Row} className="mb-2 mb-md-3">
        <Form.Label column sm="2">
          Display name
        </Form.Label>
        <Col sm="10">
          <Form.Control disabled value={user.displayName ?? "Unknown"} />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-4">
        <Form.Label column sm="2">
          Email address
        </Form.Label>
        <Col sm="10">
          <Form.Control disabled value={user.email ?? "Unknown"} />
        </Col>
      </Form.Group>

      {user.role === "student" &&
        <>
          <Form.Group as={Row} className="mb-4">
            <Form.Label column sm="2">
              Bio
            </Form.Label>
            <Col sm="10">
              <Form.Control
                as="textarea"
                rows={3}
                value={bio ?? ""}
                onChange={e => updateBio(e.target.value)}
                disabled={pending}
                placeholder="Add a short intro for other students"
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-2 mb-md-3">
            <Form.Label column sm="2">
              Meeting preference
            </Form.Label>
            <Col sm="10">
              <Form.Select
                value={meetingPref}
                onChange={e => updateMeetingPref(e.target.value)}
                disabled={pending}
              >
                <option value="either">No preference</option>
                <option value="in-person">Prefer in-person</option>
                <option value="online">Prefer online</option>
              </Form.Select>
            </Col>
          </Form.Group>
        </>
      }
    </>
  );
}

export default Profile;
