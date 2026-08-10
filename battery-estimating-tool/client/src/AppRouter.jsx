import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Heropage from "./App";
import Help from "./Webpages/Help";
import Leaderboard from "./Webpages/Leaderboard.jsx";
import Registration from "./Webpages/Registration";
import Submissions from "./Webpages/Submissions";
import SubmitModel from "./Webpages/SubmitModel";
import Login from "./Webpages/Login";
import ModelComparison from "./Webpages/ModelComparison";
import LoginError from "./Webpages/LoginError";
import { data } from "./Helperfunc.js";
import HelpTopic from "./Webpages/HelpTopic";
import { getUserInfo } from "./auth-client.ts";
import useRequireAuth from "./Hooks/useRequireAuth";
import { modelTypes, columns, columnKeyMap } from "./Helperfunc.js";

const formatData = (data) => {
  return data.map((row) => {
    const obj = {};

    columns.forEach((col) => {
      const key = columnKeyMap[col];
      let value = row[key];

      if (key === "isPrivate") {
        value = value ? "Private" : "Public";
      }

      if (key === "createdAt" || key === "updatedAt") {
        value = new Date(value).toLocaleString();
      }

      obj[col] = value ?? "-";
    });

    return obj;
  });
};
const AppRouter = () => {
  // Lifted state here
  const [user, setUser] = useState(null);
  const [uniqueUsernames, setUniqueUsernames] = useState([]);
  const [uniqueUniversities, setUniqueUniversities] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [formattedData, setFormattedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const getUniqueUsernames = (data) => {
    return [...new Set(data.map((item) => item.userName))];
  };
  const getUniqueUniversities = (data) => {
    return [...new Set(data.map((item) => item.academicAffiliation))];
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/data/fetchUserModelJoin");
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        console.log(data.data);
        const filtered = data.data.filter((model) => model.isPrivate == false);
        console.log(filtered);

        const formatted = formatData(filtered);
        console.log(formatted);
        setOriginalData(formatted);
        setFormattedData(formatted);
        setUniqueUsernames(getUniqueUsernames(data.data));
        setUniqueUniversities(getUniqueUniversities(data.data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
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
        <Route
          path="/leaderboard"
          element={
            <Leaderboard
              user={user}
              uniqueUsernames={uniqueUsernames}
              uniqueUniversities={uniqueUniversities}
              originalData={originalData}
              formattedData={formattedData}
              loading={loading}
              error={error}
              setFormattedData={setFormattedData}
            />
          }
        />
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
      </Routes>
    </Router>
  );
};

export default AppRouter;
