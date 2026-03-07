import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import picture from "../assets/images/registrationpage.png"

import { Link } from "react-router-dom";
const Login = () => {
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
            <Form>
              
              {/* Email */}
              <Form.Group className="mb-3" controlId="formEmail">
                <div className="d-flex align-items-center border-bottom mb-2 pb-1">
                  <FaEnvelope className="me-2 text-muted" />
                  <Form.Control
                    type="email"
                    placeholder="Your Email"
                    className="border-0 shadow-none"
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
                    className="border-0 shadow-none"
                  />
                </div>
              </Form.Group>
 
              {/* Register Button */}
              <div className="d-grid mb-3">
                <Button variant="primary" size="lg">
                  Login
                </Button>
              </div>

              <div className="text-center">
                <small className="text-muted">
            <Link to="/registration" style={{ color: "inherit", textDecoration: "none" }}>Create an account</Link>
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
