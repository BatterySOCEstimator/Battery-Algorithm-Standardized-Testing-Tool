// React hooks
import { useState, useEffect } from "react";
// Router components for defining app routes
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Top-level pages / components used by routes
import Heropage from "./App";
import Help from "./Webpages/Help";
import Leaderboard from "./Webpages/Leaderboard.jsx";
import Registration from "./Webpages/Registration";
import Submissions from "./Webpages/Submissions";
import SubmitModel from "./Webpages/SubmitModel";
import Login from "./Webpages/Login";
import ModelComparison from "./Webpages/ModelComparison";
import LoginError from "./Webpages/LoginError";
import HelpTopic from "./Webpages/HelpTopic";
import AdminUsers from "./Webpages/AdminUsers";
import NotFound from "./Webpages/NotFound";
import { getUserInfo } from "./auth-client.ts";

const AppRouter = () => {
  // Lifted state shared across route components
  const [user, setUser] = useState(null); // current logged-in user info

  useEffect(() => {
    getUserInfo().then(setUser);
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Heropage user={user} />} />
        <Route path="/help" element={<Help user={user} />}>
          <Route path=":topic" element={<HelpTopic />} />
        </Route>
        <Route path="/leaderboard" element={<Leaderboard user={user} />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/submissions" element={<Submissions user={user} />} />
        <Route path="/submit-model" element={<SubmitModel user={user} />} />
        <Route
          path="/model-comparison"
          element={<ModelComparison user={user} />}
        />
        <Route
          path="/login"
          element={<Login user={user} setUser={setUser} />}
        />
        <Route path="/login-error" element={<LoginError />} />
        <Route path="/admin/users" element={<AdminUsers user={user} />} />
        <Route path="*" element={<NotFound user={user} />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
