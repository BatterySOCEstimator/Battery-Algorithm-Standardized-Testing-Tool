import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Heropage from './App';
import Help from './Webpages/Help';
import Leaderboards from './Webpages/Leaderboards';
import Registration from './Webpages/Registration';
import Submissions from './Webpages/Submissions';
import SubmitModel from './Webpages/SubmitModel';
import Login from './Webpages/Login';
import ModelComparison from './Webpages/ModelComparison';
import LoginError from './Webpages/LoginError';
import { data} from "./Helperfunc.js";
import HelpTopic from './Webpages/HelpTopic';
import { getUserInfo } from "./auth-client.ts";
const AppRouter = () => {
  // Lifted state here
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserInfo().then(setUser);
    }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Heropage user={user} />} />
        <Route path="/help" element={<Help user={user} />} />
        <Route path="/help/:topic" element={<HelpTopic />} />
        <Route path="/leaderboards" element={<Leaderboards  user={user}  />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/submissions" element={<Submissions  user={user} />} />
        <Route path="/submit-model" element={<SubmitModel   user={user}  />} />
        <Route path="/model-comparison" element={<ModelComparison user={user}  />} />
        <Route path="/login" element={<Login />} user={user} setUser={setUser}/>
        <Route path="/login-error" element={<LoginError />} />

      </Routes>
    </Router>
  );
};

export default AppRouter;
