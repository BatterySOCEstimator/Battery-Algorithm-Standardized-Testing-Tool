import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../auth-client.ts";

const useRequireAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // ← start as loading

  useEffect(() => {
    const checkSession = async () => {
      const { data: session, error } = await authClient.getSession();
      if (error || !session) {
        navigate("/login");
      } else {
        setLoading(false); // ← only stop loading if session exists
      }
    };
    checkSession();
  }, [navigate]);

  return { loading };
};

export default useRequireAuth;