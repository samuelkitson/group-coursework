import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
} from "react-bootstrap";
import { useBoundStore } from "@/store/dataBoundStore";
import api from "@/services/apiMiddleware";
import { Github, InfoCircle, Microsoft } from "react-bootstrap-icons";

import "./style/Login.css";

function Login() {
  const [ passwordLogin, setPasswordLogin ] = useState(false);
  const [ email, setEmail ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ isLoading, setIsLoading ] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuthStore();
  const resetDataStores = useBoundStore((state) => state.resetAll);

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    api
      .post("/api/auth/login", { email, password, }, { successToasts: true, })
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        resetDataStores();
        login(data.data);
        navigate("/dashboard");
      })
      .finally((error) => {
        setPassword("");
        setIsLoading(false);
      });
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    api
      .get("/api/auth/github/login")
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        window.location.href = data.authUrl;
      })
      .finally((error) => {
        setIsLoading(false);
      });
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    api
      .get("/api/auth/microsoft/login")
      .then((resp) => {
        return resp.data;
      })
      .then((data) => {
        window.location.href = data.authUrl;
      })
      .finally((error) => {
        setIsLoading(false);
      });
  };

  return (
    <Container className="mt-5">
      <Row className="d-flex justify-content-center">
        <Col md={8} lg={6} xl={5}>
          <Card>
            <Card.Body className="p-4 text-center">
              <h2>Welcome</h2>
              <p className="text-muted mb-0">
                This app is for staff and students within ECS.
              </p>
              <p className="text-muted">
                Please login with your Microsoft account to continue.
              </p>

              <Button
                variant="primary"
                onClick={handleMicrosoftLogin}
                disabled={isLoading}
                size="lg"
                className="mt-3 w-100 d-flex align-items-center justify-content-center uos-button"
              >
                <Microsoft className="me-2"/>
                Login with UoS
              </Button>

              <Button
                variant="dark"
                onClick={handleGitHubLogin}
                disabled={isLoading}
                size="lg"
                className="mt-3 w-100 d-flex align-items-center justify-content-center"
              >
                <Github className="me-2"/>
                Login with GitHub
              </Button>

              <Button variant="link" className="text-muted text-center mt-3" onClick={() => setPasswordLogin(true)}>
                Admin login
              </Button>

              {passwordLogin &&
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="my-3">
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100"
                    disabled={isLoading || !email || !password}
                  >
                    Sign in
                  </Button>
                </Form>
              }
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row>
        <p className="text-muted mt-3 mb-0 text-center" style={{fontSize: "0.75em"}}>
          <InfoCircle className="me-2" />
          This service is not provided or maintained by iSolutions.
        </p>
      </Row>
    </Container>
  );
}

export default Login;
