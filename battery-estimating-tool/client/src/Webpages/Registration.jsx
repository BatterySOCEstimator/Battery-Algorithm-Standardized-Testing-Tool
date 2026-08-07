// Bootstrap UI components and router imports for the registration page
import { Container, Row, Col, Form, Button, Card, Alert } from "react-bootstrap";
import { FaUser, FaEnvelope, FaLock, FaAt, FaUniversity } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState } from "react";
import picture from "../assets/images/registrationpage.png";
// Auth helper to create new user accounts
import { signUp } from "../auth-client.ts";

// User registration form with validation
const Registration = () => {
  // Form field values
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    academicAffiliation: "",
    password: "",
    confirmPassword: "",
  });

  // Validation error messages per field
  const [errors, setErrors] = useState({});
  // Flag indicating form submission was attempted
  const [submitted, setSubmitted] = useState(false);
  // Flag indicating successful registration
  const [success, setSuccess] = useState(false);

  // Handle input changes; clear errors for the field as user types
  const handleInputChange = (e) => {
    // set the value of the field in the state
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear the error for this field as the user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate all form fields; return object of errors (empty if all valid)
  const validate = () => {
    // initialize an empty object to hold validation errors
    const newErrors = {};

    // Validate first name
    if (!values.firstName.trim())
      newErrors.firstName = "First name is required.";

    // Validate last name
    if (!values.lastName.trim())
      newErrors.lastName = "Last name is required.";

    // Validate username: 5-20 chars, alphanumeric + underscores
    if (!values.username.trim()) {
      newErrors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]{5,20}$/.test(values.username)) {
      newErrors.username =
        "Username must be 5–20 characters and contain only letters, numbers, or underscores.";
    }

    // Validate email format
    if (!values.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Validate academic affiliation
    if (!values.academicAffiliation.trim())
      newErrors.academicAffiliation = "Academic affiliation is required.";

    // Validate password: minimum 8 characters
    if (!values.password) {
      newErrors.password = "Password is required.";
    } else if (values.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    // Validate password confirmation
    if (!values.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  // Handle form submission: validate fields and call signUp if valid
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    // Check for validation errors
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // No errors — proceed with registration
    setErrors({});
    setSuccess(true);

    // TODO: call your API here, e.g.:
    // await registerUser(values);
    signUp({email: values.email, password: values.password, firstName: values.firstName, lastName: values.lastName, username: values.username, academicAffiliation: values.academicAffiliation });
  };

  // Success screen: show confirmation and link to login
  if (success) {
    return (
      <Container
        fluid
        className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
      >
        <Card
          className="shadow-sm border-0 rounded-4 p-5 text-center"
          style={{ maxWidth: "480px", width: "100%" }}
        >
          <h2 className="fw-bold mb-3">🎉 You're registered!</h2>
          <p className="text-muted mb-4">
            Welcome, <strong>{values.firstName}</strong>! Your account has been
            created successfully. Please validate your email before logging in.
          </p>
          <Link to="/login">
            <Button variant="primary" size="lg">
              Go to Login
            </Button>
          </Link>
        </Card>
      </Container>
    );
  }

  // Main registration form with side-by-side layout
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
          {/* Left side - Illustration */}
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

          {/* Right side - Form */}
          <Col md={6} className="p-5">
            <h2 className="fw-bold mb-4">Sign up</h2>

            {/* Show validation error alert if submission attempted with errors */}
            {submitted && Object.keys(errors).length > 0 && (
              <Alert variant="danger" className="mb-3">
                Please fix the errors below before continuing.
              </Alert>
            )}

            <Form onSubmit={handleSubmit} noValidate>
              {/* First Name & Last Name */}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formFirstName">
                    <div
                      className={`d-flex align-items-center border-bottom mb-1 pb-1 ${
                        errors.firstName ? "border-danger" : ""
                      }`}
                    >
                      <FaUser className="me-2 text-muted" />
                      <Form.Control
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={values.firstName}
                        onChange={handleInputChange}
                        className="border-0 shadow-none"
                        isInvalid={!!errors.firstName}
                      />
                    </div>
                    <Form.Control.Feedback type="invalid" className="d-block">
                      {errors.firstName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="formLastName">
                    <div
                      className={`d-flex align-items-center border-bottom mb-1 pb-1 ${
                        errors.lastName ? "border-danger" : ""
                      }`}
                    >
                      <FaUser className="me-2 text-muted" />
                      <Form.Control
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={values.lastName}
                        onChange={handleInputChange}
                        className="border-0 shadow-none"
                        isInvalid={!!errors.lastName}
                      />
                    </div>
                    <Form.Control.Feedback type="invalid" className="d-block">
                      {errors.lastName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              {/* Username */}
              <Form.Group className="mb-3" controlId="formUsername">
                <div
                  className={`d-flex align-items-center border-bottom mb-1 pb-1 ${
                    errors.username ? "border-danger" : ""
                  }`}
                >
                  <FaAt className="me-2 text-muted" />
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={values.username}
                    onChange={handleInputChange}
                    className="border-0 shadow-none"
                    isInvalid={!!errors.username}
                  />
                </div>
                <Form.Control.Feedback type="invalid" className="d-block">
                  {errors.username}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Email */}
              <Form.Group className="mb-3" controlId="formEmail">
                <div
                  className={`d-flex align-items-center border-bottom mb-1 pb-1 ${
                    errors.email ? "border-danger" : ""
                  }`}
                >
                  <FaEnvelope className="me-2 text-muted" />
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={values.email}
                    onChange={handleInputChange}
                    className="border-0 shadow-none"
                    isInvalid={!!errors.email}
                  />
                </div>
                <Form.Control.Feedback type="invalid" className="d-block">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Academic Affiliation */}
              <Form.Group className="mb-3" controlId="formAcademicAffiliation">
                <div
                  className={`d-flex align-items-center border-bottom mb-1 pb-1 ${
                    errors.academicAffiliation ? "border-danger" : ""
                  }`}
                >
                  <FaUniversity className="me-2 text-muted" />
                  <Form.Control
                    type="text"
                    name="academicAffiliation"
                    placeholder="Academic Affiliation"
                    value={values.academicAffiliation}
                    onChange={handleInputChange}
                    className="border-0 shadow-none"
                    isInvalid={!!errors.academicAffiliation}
                  />
                </div>
                <Form.Control.Feedback type="invalid" className="d-block">
                  {errors.academicAffiliation}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3" controlId="formPassword">
                <div
                  className={`d-flex align-items-center border-bottom mb-1 pb-1 ${
                    errors.password ? "border-danger" : ""
                  }`}
                >
                  <FaLock className="me-2 text-muted" />
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={values.password}
                    onChange={handleInputChange}
                    className="border-0 shadow-none"
                    isInvalid={!!errors.password}
                  />
                </div>
                <Form.Control.Feedback type="invalid" className="d-block">
                  {errors.password}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group className="mb-4" controlId="formConfirmPassword">
                <div
                  className={`d-flex align-items-center border-bottom mb-1 pb-1 ${
                    errors.confirmPassword ? "border-danger" : ""
                  }`}
                >
                  <FaLock className="me-2 text-muted" />
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat your password"
                    value={values.confirmPassword}
                    onChange={handleInputChange}
                    className="border-0 shadow-none"
                    isInvalid={!!errors.confirmPassword}
                  />
                </div>
                <Form.Control.Feedback type="invalid" className="d-block">
                  {errors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Register Button */}
              <div className="d-grid mb-3">
                <Button type="submit" variant="primary" size="lg">
                  Register
                </Button>
              </div>

              {/* Link to login page */}
              <div className="text-center">
                <small className="text-muted">
                  <Link
                    to="/login"
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    I am already a member
                  </Link>
                </small>
              </div>
            </Form>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};
export default Registration;
// import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
// import { FaUser, FaEnvelope, FaLock, FaAt, FaUniversity } from "react-icons/fa";
// import { Link } from "react-router-dom";
// import { useState } from "react";
// import picture from "../assets/images/registrationpage.png"
// const Registration = () => {
//   const [values, setValues] = useState({
//     firstName: "",
//     lastName: "",
//     email: ""
//   });

//   const handleInputChange = (event) => {
//     event.preventDefault();

//     const { name, value } = event.target;
//     setValues((values) => ({
//       ...values,
//       [name]: value
//     }));
//   };

//   const [submitted, setSubmitted] = useState(false);
//   const [valid, setValid] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (values.firstName && values.lastName && values.email) {
//       setValid(true);
//     }
//     setSubmitted(true);
//   };
//   return (
// <Container
//   fluid
//   className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
// >
//   <Card
//     className="shadow-sm border-0 rounded-4 p-4"
//     style={{ maxWidth: "900px", width: "100%" }}
//   >
//     <Row className="g-0 align-items-center">
//       {/* Left side - Illustration */}
//       <Col
//         md={6}
//         className="d-none d-md-flex align-items-center justify-content-center"
//       >
//         <img
//           src={picture}
//           alt="Illustration"
//           className="img-fluid p-4"
//           style={{ maxHeight: "350px" }}
//         />
//       </Col>

//       {/* Right side - Form */}
//       <Col md={6} className="p-5">
//         <h2 className="fw-bold mb-4">Sign up</h2>
//         <Form onSubmit={handleSubmit}>
//           {/* First Name & Last Name */}
//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3" controlId="formFirstName">
//                 <div className="d-flex align-items-center border-bottom mb-2 pb-1">
//                   <FaUser className="me-2 text-muted" />
//                   <Form.Control
//                     type="text"
//                     placeholder="First Name"
//                     className="border-0 shadow-none"
//                   />
//                 </div>
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3" controlId="formLastName">
//                 <div className="d-flex align-items-center border-bottom mb-2 pb-1">
//                   <FaUser className="me-2 text-muted" />
//                   <Form.Control
//                     type="text"
//                     placeholder="Last Name"
//                     className="border-0 shadow-none"
//                   />
//                 </div>
//               </Form.Group>
//             </Col>
//           </Row>

//           {/* Username */}
//           <Form.Group className="mb-3" controlId="formUsername">
//             <div className="d-flex align-items-center border-bottom mb-2 pb-1">
//               <FaAt className="me-2 text-muted" />
//               <Form.Control
//                 type="text"
//                 placeholder="Username"
//                 className="border-0 shadow-none"
//               />
//             </div>
//           </Form.Group>

//           {/* Email */}
//           <Form.Group className="mb-3" controlId="formEmail">
//             <div className="d-flex align-items-center border-bottom mb-2 pb-1">
//               <FaEnvelope className="me-2 text-muted" />
//               <Form.Control
//                 type="email"
//                 placeholder="Your Email"
//                 className="border-0 shadow-none"
//               />
//             </div>
//           </Form.Group>

//           {/* Academic Affiliation */}
//           <Form.Group className="mb-3" controlId="formAcademicAffiliation">
//             <div className="d-flex align-items-center border-bottom mb-2 pb-1">
//               <FaUniversity className="me-2 text-muted" />
//               <Form.Control
//                 type="text"
//                 placeholder="Academic Affiliation"
//                 className="border-0 shadow-none"
//               />
//             </div>
//           </Form.Group>

//           {/* Password */}
//           <Form.Group className="mb-3" controlId="formPassword">
//             <div className="d-flex align-items-center border-bottom mb-2 pb-1">
//               <FaLock className="me-2 text-muted" />
//               <Form.Control
//                 type="password"
//                 placeholder="Password"
//                 className="border-0 shadow-none"
//               />
//             </div>
//           </Form.Group>

//           {/* Confirm Password */}
//           <Form.Group className="mb-4" controlId="formConfirmPassword">
//             <div className="d-flex align-items-center border-bottom mb-2 pb-1">
//               <FaLock className="me-2 text-muted" />
//               <Form.Control
//                 type="password"
//                 placeholder="Repeat your password"
//                 className="border-0 shadow-none"
//               />
//             </div>
//           </Form.Group>

     

//           {/* Register Button */}
//           <div className="d-grid mb-3">
//             <Button variant="primary" size="lg">
//               Register
//             </Button>
//           </div>

//           <div className="text-center">
//             <small className="text-muted">
//               <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>
//                 I am already a member
//               </Link>
//             </small>
//           </div>
//         </Form>
//       </Col>
//     </Row>
//   </Card>
// </Container>
//   );
// };

// export default Registration;
