import SaveButton from "@/components/SaveButton";
import UnsavedChanges from "@/components/UnsavedChanges";
import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { Col, Form, Row } from "react-bootstrap";
import { MortarboardFill, PersonBadge, PersonBadgeFill, QuestionCircleFill, ShieldCheck, ShieldFillCheck } from "react-bootstrap-icons";

function Profile() {
  const { user } = useAuthStore();
  const [pending, setPending] = useState(false);

  const { control, register, reset, getValues, } = useForm({
    defaultValues: {
      bio: user.bio ?? "",
      meetingPref: user.meetingPref ?? "either",
    },
  });
  const { isDirty } = useFormState({ control });

  const submitProfileUpdates = () => {
    const { bio, meetingPref } = getValues();
    setPending(true);
    api
      .patch(
        `/api/student/profile`,
        { meetingPref, bio },
        { successToasts: true }
      )
      .then((resp) => resp.data)
      .then(() => {
        reset({ bio, meetingPref });
      })
      .finally(() => {
        setPending(false);
      });
  };

  const RoleHelper = () => {
    switch (user.role) {
      case "student":
        return (
          <Col sm="10" className="d-flex align-items-center">
            <MortarboardFill size={18} className="me-2" />
            <p className="mb-0">
              Student
            </p>
          </Col>
        )
      case "staff":
        return (
          <Col sm="10" className="d-flex align-items-center">
            <PersonBadgeFill size={18} className="me-2" />
            <p className="mb-0">
              Staff member
            </p>
          </Col>
        )
      case "admin":
        return (
          <Col sm="10" className="d-flex align-items-center">
            <ShieldFillCheck size={18} className="me-2" />
            <p className="mb-0">
              Administrator
            </p>
          </Col>
        )
      default:
        return (
          <Col sm="10" className="d-flex align-items-center">
            <QuestionCircleFill className="me-2" />
            <p className="mb-0">
              Unknown - please log in again
            </p>
          </Col>
        )
    }
  };

  const refreshData = () => {
    if (user.role !== "student") return;

    api
      .get(`/api/student/profile`)
      .then((resp) => resp.data)
      .then((data) => {
        reset({
          bio: data.profile?.bio ?? "",
          meetingPref: data.profile?.meetingPref ?? "either",
        });
      });
  };

  // Refresh data on page load
  useEffect(refreshData, [user]);

  return (
    <>
      <Row className="mb-3 mb-md-0">
        <Col md={9}>
          <h1>
            My profile <UnsavedChanges unsaved={isDirty} />
          </h1>
          <p className="text-muted">
            {user.role === "student"
              ? "Use this page to edit your personal details that are visible to other students and staff. Some are synced with your University account and can't be edited here."
              : "Here you can see your personal details that are visible to students and other staff. As a staff member, you can't edit any of the details here yourself."}
          </p>
        </Col>
        <Col
          xs={12}
          md={3}
          className="d-flex flex-column align-items-end mt-md-2"
        >
          <SaveButton
            pending={pending}
            unsaved={isDirty}
            saveChanges={submitProfileUpdates}
            doNotHide={true}
          />
        </Col>
      </Row>

      <Row className="mb-2 mb-md-3">
        <Form.Label column sm="2">Account type</Form.Label>
        <RoleHelper />
      </Row>

      <Form.Group as={Row} className="mb-2 mb-md-3">
        <Form.Label column sm="2">Display name</Form.Label>
        <Col sm="10">
          <Form.Control disabled value={user.displayName ?? "Unknown"} />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-4">
        <Form.Label column sm="2">Email address</Form.Label>
        <Col sm="10">
          <Form.Control disabled value={user.email ?? "Unknown"} />
        </Col>
      </Form.Group>

      {user.role === "student" && (
        <>
          <Form.Group as={Row} className="mb-4">
            <Form.Label column sm="2">Bio</Form.Label>
            <Col sm="10">
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add a short intro for other students"
                disabled={pending}
                {...register("bio")}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-2 mb-md-3">
            <Form.Label column sm="2">Meeting preference</Form.Label>
            <Col sm="10">
              <Form.Select disabled={pending} {...register("meetingPref")}>
                <option value="either">No preference</option>
                <option value="in-person">Prefer in-person</option>
                <option value="online">Prefer online</option>
              </Form.Select>
            </Col>
          </Form.Group>
        </>
      )}
    </>
  );
}

export default Profile;
