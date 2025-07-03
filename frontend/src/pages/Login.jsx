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
  Alert,
} from "react-bootstrap";
import { useBoundStore } from "@/store/dataBoundStore";
import api from "@/services/apiMiddleware";
import { Github } from "react-bootstrap-icons";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
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
    setError("");

    try {
      const response = await api.post(
        "/api/auth/login",
        { email, password },
        { successToasts: true, genericErrorToasts: false },
      );
      if (response.status === 200) {
        resetDataStores();
        login(response.data.data);
        navigate("/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "An error occurred during login",
      );
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError("");
    const urlResponse = await api.get("/api/auth/github/login");
    window.location.href = urlResponse.data.authUrl;
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2>Welcome Back</h2>
                <p className="text-muted">Enter your credentials to continue</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
