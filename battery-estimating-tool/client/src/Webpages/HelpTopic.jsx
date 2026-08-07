import { useParams, Link } from "react-router-dom";
import  HelpContentMap  from "../Components/HelpSection/HelpSection";
// This page dynamiccaly loads in URLs in the form of /help/:topic, where :topic could realistically be any string.
// We then traverse the HelpContentMap to see if there is  a matching topic and render the corresponding content.
const HelpTopic = () => {

  // grab the partial URL Assuming a route pattern like /help/:topic is matched by /help/submission-process then params.topic will be "submission-process".
  const { topic } = useParams();

  //lowercase and trim topic
  const normalizedTopic = topic?.toLowerCase().trim();

  //match topic to the HelpContentMap. If no match is found, page = null.
  const page = normalizedTopic ? HelpContentMap[normalizedTopic] : null;

  //sanity check for topic
  if (!topic) {
    return (
      <div className="mt-4">
        <h4>No help topic selected</h4>
        <Link to="/help">Go back to Help Center</Link>
      </div>
    );
  }
  
  //sanity check for page
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
      <h2>{page.title}</h2>
      <div>{page.content}</div>
    </div>
  );
};

export default HelpTopic;