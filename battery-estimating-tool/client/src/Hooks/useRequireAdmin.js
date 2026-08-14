import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../auth-client.ts";

// Same shape as useRequireAuth, but also requires the admin role. Checks the
// session directly (rather than trusting a `user` prop that may still be
// loading) so a real admin never gets redirected by a race on first paint.
const useRequireAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: session, error } = await authClient.getSession();
      if (error || !session || session.user?.role !== "admin") {
        navigate("/");
      } else {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  return { loading };
};

export default useRequireAdmin;
