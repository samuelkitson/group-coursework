import StarRatingInput from "@/components/StarRatingInput";
import React, { forwardRef, memo, useEffect, useImperativeHandle, useState } from "react";
import { Accordion, Col, Form, Row } from "react-bootstrap";
import { Check2All, HourglassSplit, } from "react-bootstrap-icons";
import { useFieldArray, useForm, useFormState } from "react-hook-form";

const PeerReviewForm = forwardRef(({ index, recipient, questions }, ref) => {
  const [hoveredSkill, setHoveredSkill] = useState(null);

  const defaultValues = {
    recipientName: "",
    recipientId: null,
    skills: [],
    comment: "",
  };
  const { control, register, reset, getValues, formState, handleSubmit, trigger, } = useForm({ defaultValues, mode: "onTouched", });
  const { isValid, errors, } = useFormState({ control });
  const { fields: skillFields, } = useFieldArray({ control, name: "skills", });

  useImperativeHandle(ref, () => ({
    getValues,
    handleSubmit,
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    errors: formState.errors,
    validate: async () => {const result = await trigger(); return result;},
  }));

  useEffect(() => {
    const skillsObj = questions.map(q => ({ name: q, rating: 0, }));
    reset( {...defaultValues, recipientName: recipient.name, recipientId: recipient._id, skills: skillsObj, } );
  }, [index]);

  return (
    <Accordion.Item key={recipient._id} eventKey={recipient._id}>
      <Accordion.Header>
        { isValid ? 
          <Check2All className="me-2 text-success"/>
        :
          <HourglassSplit className="me-2 text-danger"/>
        }
        {recipient.name}
      </Accordion.Header>
      <Accordion.Body>
        {skillFields.map((field, index) => (
          <Form.Group key={field.id} as={Row} className="align-items-center">
            <Form.Label column md={4} className={`mb-md-2 py-1 ${hoveredSkill===field.name && "fw-bold"}`}>
              {field.name}
            </Form.Label>
            <Col
              md={8}
              onMouseEnter={() => setHoveredSkill(field.name)}
              onMouseLeave={() => setHoveredSkill(null)}
              className="mb-3 mb-md-2"
            >
              <StarRatingInput name={`skills.${index}.rating`} control={control} />
            </Col>
          </Form.Group>
        ))}
        <Form.Group className="mt-3">
          <Form.Label className="text-muted">
            Please give {recipient.name} some feedback about their recent work.
            What have they done well and how could they improve? Your comments
            will be moderated and shared with them anonymously.
          </Form.Label>
          <Form.Control
            as="textarea"
            name="comment"
            rows={3}
            className={errors?.comment && "border-danger"}
            {...register("comment", {
              required: `Please leave a review comment for ${recipient.name}.`,
              minLength: { value: 50, message: `Please leave a longer review comment for ${recipient.name}.`}
            })}
            placeholder="Review comments"
          />
          <p className="mt-2 text-danger">{errors?.comment?.message}</p>
        </Form.Group>
      </Accordion.Body>
    </Accordion.Item>
  );
});

export default PeerReviewForm;
