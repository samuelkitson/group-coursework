import SaveButton from "@/components/SaveButton";
import UnsavedChanges from "@/components/UnsavedChanges";
import api from "@/services/apiMiddleware";
import { useAuthStore } from "@/store/authStore";
import React, { useEffect, useState } from "react";
import { useForm, useFormState } from "react-hook-form";
import { Col, Form, Row } from "react-bootstrap";
import { MortarboardFill, PersonBadge, PersonBadgeFill, QuestionCircleFill, ShieldCheck, ShieldFillCheck } from "react-bootstrap-icons";
import { useBoundStore } from "@/store/dataBoundStore";

function Profile() {
  const { user } = useAuthStore();
  const [isPending, setIsPending] = useState(false);
  const selectedAssignment = useBoundStore((state) =>
    state.getSelectedAssignment(),
  );

  const { control, register, reset, getValues, } = useForm({
    defaultValues: {
      bio: user.bio ?? "",
      meetingPref: user.meetingPref ?? "either",
    },
  });
  const { isDirty } = useFormState({ control });

  const submitProfileUpdates = () => {
    const { bio, meetingPref } = getValues();
    setIsPending(true);
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
        setIsPending(false);
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
            All of these details may be shown to other users. Greyed out details
            are synced with your University account.
          </p>
        </Col>
        <Col
          xs={12}
          md={3}
          className="d-flex flex-column align-items-end mt-md-2"
        >
          <SaveButton
            isPending={isPending}
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

      <p className="text-muted mt-5">
        The options below are shown to other people in your teams or any teams
        that you supervise.
      </p>

      <Form.Group as={Row} className="mb-4">
        <Form.Label column sm="2">Bio</Form.Label>
        <Col sm="10">
          <Form.Control
            as="textarea"
            rows={3}
            maxLength={200}
            placeholder="A short intro for other students. You could mention things that might make meetings tricky, e.g. I'm always busy on Tuesdays."
            {...register("bio")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
          />
        </Col>
      </Form.Group>

        <Form.Group as={Row} className="mb-2 mb-md-3">
          <Form.Label column sm="2">Meeting preference</Form.Label>
          <Col sm="10">
            <Form.Select {...register("meetingPref")}>
              <option value="either">No preference</option>
              <option value="in-person">Prefer in-person</option>
              <option value="online">Prefer online</option>
            </Form.Select>
          </Col>
        </Form.Group>
    </>
  );
}

export default Profile;
