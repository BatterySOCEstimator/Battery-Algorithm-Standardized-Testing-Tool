import { useState } from 'react';
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
const AppRouter = () => {
  // Lifted state here
  const [estimatedSOC, setEstimatedSOC] = useState(data);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Heropage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/help/:topic" element={<HelpTopic />} />
        <Route path="/leaderboards" element={<Leaderboards estimatedSOC={estimatedSOC} />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/submissions" element={<Submissions estimatedSOC={estimatedSOC} />} />
        <Route path="/submit-model" element={<SubmitModel estimatedSOC={estimatedSOC} setEstimatedSOC={setEstimatedSOC}/>} />
        <Route path="/model-comparison" element={<ModelComparison estimatedSOC={estimatedSOC} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login-error" element={<LoginError />} />

      </Routes>
    </Router>
  );
};

export default AppRouter;
