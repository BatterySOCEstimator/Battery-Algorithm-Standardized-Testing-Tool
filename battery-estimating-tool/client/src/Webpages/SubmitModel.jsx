import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import styled from "styled-components";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import { Button, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import { modelTypes, columns} from "../Helperfunc.js";
import useRequireAuth from "../Hooks/useRequireAuth";


const FlexBox = styled.div`
    display:flex;
    gap: 24px;
`

const Container = styled.div`
  padding: 20px;
`;

const FullscreenContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  padding-top: 50px;
  background: #f5f5f5;
`;

const FileCard = styled.div`
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0px 3px 12px rgba(0, 0, 0, 0.12);
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 25px;
`;

const DropArea = styled.div`
  border: 3px dashed #888;
  border-radius: 20px;
  height: 60vh;
  width: 60vw;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: 0.2s ease-in-out;
  &:hover {
    border-color: #555;
  }
`;

const FormCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0px 3px 12px rgba(0, 0, 0, 0.12);
  width: 60vw;
  margin-bottom: 24px;
`;

const sanitize = (str) => str.trim().replace(/[<>]/g, "");

const SubmitModel = ({ estimatedSOC, setEstimatedSOC }) => {
  const { loading } = useRequireAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedModelType, setSelectedModelType] = useState(modelTypes[0]);
  const [file, setFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success"|"danger", message: string }

  const onDrop = useCallback((acceptedFiles) => {
    const uploaded = acceptedFiles[0];
    if (uploaded?.name.endsWith(".zip")) {
      setZipFile(uploaded);
      setFile(null);
    } else {
      setFile(uploaded);
      setZipFile(null);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, multiple: false });

  const handleSubmit = async () => {
    setFeedback(null);

    const sanitizedName = sanitize(name);
    const sanitizedDescription = sanitize(description);

    // Validation
    if (!sanitizedName) return setFeedback({ type: "danger", message: "Name is required." });
    if (!sanitizedDescription) return setFeedback({ type: "danger", message: "Description is required." });
    if (!file && !zipFile) return setFeedback({ type: "danger", message: "Please upload a model file." });

    const uploadedFile = file ?? zipFile;

    const formData = new FormData();
    formData.append("name", sanitizedName);
    formData.append("description", sanitizedDescription);
    formData.append("isPrivate", isPrivate);
    formData.append("modelType", selectedModelType);
    if (uploadedFile.name.endsWith(".zip")) {
      formData.append("files", uploadedFile);
      //formData.append("zipFile", uploadedFile); FOR SEPERATE HANDLING IN THE FUTURE ??
    } else {
      formData.append("files", uploadedFile);
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/model/upload?name=${encodeURIComponent(sanitizedName)}`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `Server error ${response.status}`);
      }

      setFeedback({ type: "success", message: "Model uploaded successfully!" });
      // Reset form
      setName("");
      setDescription("");
      setIsPrivate(false);
      setSelectedModelType(modelTypes[0]);
      setFile(null);
      setZipFile(null);
    } catch (error) {
      setFeedback({ type: "danger", message: `Upload failed: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <StyledNavbar />
      <FullscreenContainer>

        {/* Feedback alert */}
        {feedback && (
          <div style={{ width: "60vw", marginBottom: "16px" }}>
            <Alert variant={feedback.type} onClose={() => setFeedback(null)} dismissible>
              {feedback.message}
            </Alert>
          </div>
        )}

        {/* Name, Description, Privacy */}
        <FormCard>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Model Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter model name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter model description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <FlexBox className="align-items-center">
              <LabeledSelect
                label={"Model Type"}
                options={modelTypes}
                value={selectedModelType}
                onChange={(e) => setSelectedModelType(e.target.value)}
              />
              <Form.Group className="d-flex align-items-center" style={{ gap: "10px", marginTop: "8px" }}>
                <Form.Label className="mb-0">Private</Form.Label>
                <Form.Check
                  type="switch"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
              </Form.Group>
            </FlexBox>
          </Form>
        </FormCard>

        <Button onClick={handleSubmit} style={{ marginBottom: "16px" }} disabled={submitting}>
          {submitting ? <><Spinner size="sm" className="me-2" />Uploading...</> : "Submit Model"}
        </Button>

        {(file || zipFile) && (
          <FileCard>📄 {(file ?? zipFile).name}</FileCard>
        )}

        <DropArea {...getRootProps()}>
          <input {...getInputProps()} />
          <Upload size={60} />
          <p style={{ marginTop: "20px", fontSize: "1.4rem" }}>
            drag & drop or click to upload 
          </p>
          <p style={{ marginTop: "-20px", fontSize: "1.4rem" }}>
             your model here
          </p>
          <p style={{ opacity: 0.7 }}>(only .mat and .py files)</p>
        </DropArea>

      </FullscreenContainer>
    </>
  );
};

export default SubmitModel;