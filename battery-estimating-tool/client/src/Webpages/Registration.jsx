import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import picture from "../assets/images/registrationpage.png"

const Registration = () => {
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
            <h2 className="fw-bold mb-4">Sign up</h2>
            <Form>
              {/* Name */}
              <Form.Group className="mb-3" controlId="formName">
                <div className="d-flex align-items-center border-bottom mb-2 pb-1">
                  <FaUser className="me-2 text-muted" />
                  <Form.Control
                    type="text"
                    placeholder="Your Name"
                    className="border-0 shadow-none"
                  />
                </div>
              </Form.Group>

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

              {/* Confirm Password */}
              <Form.Group className="mb-4" controlId="formConfirmPassword">
                <div className="d-flex align-items-center border-bottom mb-2 pb-1">
                  <FaLock className="me-2 text-muted" />
                  <Form.Control
                    type="password"
                    placeholder="Repeat your password"
                    className="border-0 shadow-none"
                  />
                </div>
              </Form.Group>

              {/* Terms Checkbox */}
              <Form.Group className="mb-4" controlId="formTerms">
                <Form.Check
                  type="checkbox"
                  label={
                    <>
                      I agree all statements in{" "}
                      <a href="#" className="text-decoration-none">
                        Terms of service
                      </a>
                    </>
                  }
                />
              </Form.Group>

              {/* Register Button */}
              <div className="d-grid mb-3">
                <Button variant="primary" size="lg">
                  Register
                </Button>
              </div>

              <div className="text-center">
                <small className="text-muted">
                  I am already member
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

export default Registration;
