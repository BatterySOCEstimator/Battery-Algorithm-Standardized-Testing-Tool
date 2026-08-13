// UI components and router imports for the registration page
import { Card } from "#Components/ui/card";
import { Input } from "#Components/ui/input";
import { Button } from "#Components/ui/button";
import { Alert, AlertDescription } from "#Components/ui/alert";
import { cn } from "#Constants/cn";
import { IconUser, IconMail, IconLock, IconAt, IconSchool } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import picture from "../assets/images/registrationpage.png";
// Auth helper to create new user accounts
import { signUp } from "../auth-client.ts";
import StyledNavbar from "../Components/Navbar/StyledNavbar.jsx";

// A labeled input with a leading icon and inline validation error, used for
// every field on this form.
const FormField = ({ icon: Icon, error, ...inputProps }) => (
  <div>
    <div className="relative">
      <Icon className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input {...inputProps} className={cn("pl-9", error && "border-destructive")} />
    </div>
    {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
  </div>
);

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
    if (!values.lastName.trim()) newErrors.lastName = "Last name is required.";

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

    signUp({
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      username: values.username,
      academicAffiliation: values.academicAffiliation,
    });
  };

  // Success screen: show confirmation and link to login
  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-sm p-8 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-foreground">🎉 You're registered!</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Welcome, <strong className="text-foreground">{values.firstName}</strong>! Your account
            has been created successfully. Please validate your email before logging in.
          </p>
          <Link to="/login">
            <Button size="lg">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Main registration form with side-by-side layout
  return (
    <>
      <StyledNavbar />
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-8">
        <Card className="grid w-full max-w-4xl gap-0 overflow-hidden p-0 md:grid-cols-2">
          {/* Left side - Illustration */}
          <div className="hidden items-center justify-center bg-muted p-8 md:flex">
            <img src={picture} alt="Illustration" className="max-h-87.5 w-full object-contain" />
          </div>

          {/* Right side - Form */}
          <div className="p-8 sm:p-10">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">Sign up</h2>

            {/* Show validation error alert if submission attempted with errors */}
            {submitted && Object.keys(errors).length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>Please fix the errors below before continuing.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  icon={IconUser}
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={values.firstName}
                  onChange={handleInputChange}
                  error={errors.firstName}
                />
                <FormField
                  icon={IconUser}
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={values.lastName}
                  onChange={handleInputChange}
                  error={errors.lastName}
                />
              </div>

              {/* Username */}
              <FormField
                icon={IconAt}
                type="text"
                name="username"
                placeholder="Username"
                value={values.username}
                onChange={handleInputChange}
                error={errors.username}
              />

              {/* Email */}
              <FormField
                icon={IconMail}
                type="email"
                name="email"
                placeholder="Your Email"
                value={values.email}
                onChange={handleInputChange}
                error={errors.email}
              />

              {/* Academic Affiliation */}
              <FormField
                icon={IconSchool}
                type="text"
                name="academicAffiliation"
                placeholder="Academic Affiliation"
                value={values.academicAffiliation}
                onChange={handleInputChange}
                error={errors.academicAffiliation}
              />

              {/* Password */}
              <FormField
                icon={IconLock}
                type="password"
                name="password"
                placeholder="Password"
                value={values.password}
                onChange={handleInputChange}
                error={errors.password}
              />

              {/* Confirm Password */}
              <FormField
                icon={IconLock}
                type="password"
                name="confirmPassword"
                placeholder="Repeat your password"
                value={values.confirmPassword}
                onChange={handleInputChange}
                error={errors.confirmPassword}
              />

              {/* Register Button */}
              <Button type="submit" size="lg" className="mt-2">
                Register
              </Button>

              {/* Link to login page */}
              <div className="text-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  I am already a member
                </Link>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
};
export default Registration;
