import { useParams, Link } from "react-router-dom";
import { HelpContentMap } from "./HelpContentMap";
const HelpTopic = () => {
  const { topic } = useParams();

  const normalizedTopic = topic?.toLowerCase().trim();
  const page = normalizedTopic ? HelpContentMap[normalizedTopic] : null;

  if (!topic) {
    return (
      <div className="mt-4">
        <h4>No help topic selected</h4>
        <Link to="/help">Go back to Help Center</Link>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="mt-4">
        <h4>Help topic not found</h4>
        <p>
          We couldn’t find: <strong>{topic}</strong>
        </p>
        <Link to="/help">Back to Help Center</Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      
      <div>{page.content}</div>
    </div>
  );
};

export default HelpTopic;