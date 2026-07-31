import { Container, Row, Col, Form, Button, Card, Spinner } from "react-bootstrap";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import picture from "../assets/images/registrationpage.png"
import { useState } from "react";
import { login }  from "../auth-client.ts";
import { Link, useNavigate } from "react-router-dom";
import { getUserInfo } from "../auth-client.ts";
const Login = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEmail = (value) => value.includes("@");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      navigate("/login-error", {
        state: { message: "Please enter your email/username and password." },
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(
        isEmail(identifier)
          ? { email: identifier, password }
          : { username: identifier, password }
      );
      const userInfo = await getUserInfo();
      setUser(userInfo);
      navigate("/leaderboards");
    } catch (err) {
      navigate("/login-error", {
        state: { message: err?.message ?? "Login failed. Please try again." },
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Container
      fluid
      className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
    >
      <Card
        className="shadow-sm border-0 rounded-4 p-4"
        style={{ maxWidth: "900px", width: "100%" }}
      >
        <Row className="g-0 align-items-center">
          {/* Left side - Form */}
          <Col md={6} className="p-5">
            <h2 className="fw-bold mb-4">Sign in</h2>

            <Form onSubmit={handleSubmit} noValidate>
              {/* Email or Username */}
              <Form.Group className="mb-3" controlId="formIdentifier">
                <div className="d-flex align-items-center border-bottom mb-2 pb-1">
                  {isEmail(identifier) ? (
                    <FaEnvelope className="me-2 text-muted" />
                  ) : (
                    <FaUser className="me-2 text-muted" />
                  )}
                  <Form.Control
                    type="text"
                    placeholder="Email or Username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="border-0 shadow-none"
                    autoComplete="username"
                    disabled={isLoading}
                  />
                </div>
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3" controlId="formPassword">
                <div className="d-flex align-items-center border-bottom mb-2 pb-1">
                  <FaLock className="me-2 text-muted" />
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 shadow-none"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </div>
              </Form.Group>

              {/* Login Button */}
              <div className="d-grid mb-3">
                <Button variant="primary" size="lg" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Signing in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>

              <div className="text-center">
                <small className="text-muted">
                  <Link to="/registration" style={{ color: "inherit", textDecoration: "none" }}>
                    Create an account
                  </Link>
                </small>
              </div>
            </Form>
          </Col>

          {/* Right side - Illustration */}
          <Col
            md={6}
            className="d-none d-md-flex align-items-center justify-content-center"
          >
            <img
              src={picture}
              alt="Illustration"
              className="img-fluid p-4"
              style={{ maxHeight: "350px" }}
            />
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default Login;
