import api from '@/services/apiMiddleware';
import { useAuthStore } from '@/store/authStore';
import { useBoundStore } from '@/store/dataBoundStore';
import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const resetDataStores = useBoundStore((state) => state.resetAll);
  const [ tooLong, setTooLong ] = useState(false);
  let processing = false;

  useEffect(() => {
    const timer = setTimeout(() => setTooLong(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAuthCallback = async () => {
    // Stop API being called twice when running in dev mode
    if (processing) return;
    processing = true;
    // Extract query parameters from Microsoft
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");
    if (error) {
      toast.error(`Sorry, login failed. Please try again.`);
      console.error(`OAuth login error: ${error}`);
      return navigate("/login");
    }
    if (!code || !state) {
      toast.error("Login with Microsoft failed. Please try another method.");
      return navigate("/login");
    }
    // Start login flow
    api
      .post(`/api/auth/azure-callback`, { code, state, }, { successToasts: true, genericErrorToasts: true, })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        resetDataStores();
        login(data.data);
        navigate("/dashboard");
      })
      .catch((error) => {
        return navigate("/login");
      });
  };

  useEffect(() => {
    handleAuthCallback();
  }, [navigate]);

  return (
    <Container style={{marginTop: "5em"}}>
      <Row className="d-flex justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card className="shadow">
            <Card.Body className="p-4 text-center">
                <Spinner animation="border" className="me-3 my-2" />
                <h2>Signing you in...</h2>
                <p className="text-muted mt-3">
                  This might take a few moments.
                </p>
                { tooLong && 
                  <p className="text-muted">
                    If you think something's broken, click <a href="/login">here</a>{" "}
                    to go back and try logging in again.
                  </p>
                }
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthCallback;
