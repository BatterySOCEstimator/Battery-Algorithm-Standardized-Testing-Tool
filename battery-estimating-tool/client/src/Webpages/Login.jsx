// UI and auth imports for the login page
import { Card } from "#Components/ui/card";
import { Input } from "#Components/ui/input";
import { Button } from "#Components/ui/button";
import { Spinner } from "#Components/ui/spinner";
import { IconUser, IconMail, IconLock } from "@tabler/icons-react";
import picture from "../assets/images/registrationpage.png";
import { useState } from "react";
import { login } from "../auth-client.ts";
import { Link, useNavigate } from "react-router-dom";
import { getUserInfo } from "../auth-client.ts";
import StyledNavbar from "../Components/Navbar/StyledNavbar";

// Login page component
const Login = ({ user, setUser }) => {
  const navigate = useNavigate();
  // Form state for the user login fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Determine whether the entered value looks like an email
  const isEmail = (value) => value.includes("@");

  // Handle login form submission and redirect on success or failure
  const handleSubmit = async (e) => {
    //stop fields from clearing on submit
    e.preventDefault();

    // check for a username and password
    if (!identifier || !password) {
      navigate("/login-error", {
        state: { message: "Please enter your email/username and password." },
      });
      return;
    }
    // start loading spinner
    setIsLoading(true);

    // Try logging in redirect to leaderboards on success, remove spinner and set user in navbar.
    // Otherwise redirect to login error page.
    try {
      await login(
        isEmail(identifier)
          ? { email: identifier, password }
          : { username: identifier, password },
      );

      // Get the newly-created session/user BEFORE navigating
      getUserInfo().then((userInfo) => {
        setUser(userInfo);
        navigate("/");
      });
    } catch (err) {
      navigate("/login-error", {
        state: { message: err?.message ?? "Login failed. Please try again." },
      });
    } finally {
      setIsLoading(false);
      //getUserInfo().then(setUser); -- REMOVING TO TEST
    }
  };

  return (
    <>
      <StyledNavbar user={user} />

      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background px-4 py-8">
        <Card className="grid w-full max-w-4xl gap-0 overflow-hidden p-0 md:grid-cols-2">
          {/* Left side - Form */}
          <div className="p-8 sm:p-10">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">Sign in</h2>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Email or Username */}
              <div className="relative">
                {isEmail(identifier) ? (
                  <IconMail className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                ) : (
                  <IconUser className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                )}
                <Input
                  type="text"
                  placeholder="Email or Username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-9"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <IconLock className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              {/* Login Button */}
              <Button type="submit" size="lg" disabled={isLoading} className="mt-2 gap-1.5">
                {isLoading ? (
                  <>
                    <Spinner />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>

              <div className="text-center">
                <Link to="/registration" className="text-sm text-muted-foreground hover:text-foreground">
                  Create an account
                </Link>
              </div>
            </form>
          </div>

          {/* Right side - Illustration */}
          <div className="hidden items-center justify-center bg-muted p-8 md:flex">
            <img src={picture} alt="Illustration" className="max-h-87.5 w-full object-contain" />
          </div>
        </Card>
      </div>
    </>
  );
};

export default Login;
