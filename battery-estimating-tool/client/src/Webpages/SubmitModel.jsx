// SubmitModel page: UI and logic to upload a new model submission.
// Imports: React hooks, drag-drop helpers, UI toolkit and project helpers.
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { IconUpload, IconFile, IconX } from "@tabler/icons-react";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import { Button } from "#Components/ui/button";
import { Card } from "#Components/ui/card";
import { Input } from "#Components/ui/input";
import { Textarea } from "#Components/ui/textarea";
import { Label } from "#Components/ui/label";
import { Switch } from "#Components/ui/switch";
import { Alert, AlertDescription } from "#Components/ui/alert";
import { Spinner } from "#Components/ui/spinner";
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";
import {
  modelTypes,
  MODEL_NAME_MAX_LENGTH as NAME_MAX_LENGTH,
  MODEL_DESCRIPTION_MAX_LENGTH as DESCRIPTION_MAX_LENGTH,
} from "../Constants/Helperfunc.js";
import useRequireAuth from "../Hooks/useRequireAuth";

// Small sanitizer to remove leading/trailing whitespace and strip <,>
// to avoid basic injection of markup in free-text fields.
const sanitize = (str) => str.trim().replace(/[<>]/g, "");

const SubmitModel = ({ user }) => {
  // Prevent rendering until auth check completes
  const { loading } = useRequireAuth();

  // Controlled form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedModelType, setSelectedModelType] = useState(modelTypes[0]);
  const [selectedLevel, setSelectedLevel] = useState("dynamic");

  // Dropzone key lets us reset the drop area by bumping the key
  const [dropzoneKey, setDropzoneKey] = useState(0);

  // File state: either a single file or a zip containing many files
  const [file, setFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);

  // Submission state and user feedback messages
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: "success"|"destructive", message: string }

  // onDrop: pick the first accepted file and store it
  // If it's a .zip we keep it separate so the backend can handle zips differently
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

  // Hook up dropzone (single-file uploads)
  const { getRootProps, getInputProps } = useDropzone({ onDrop, multiple: false });

  // handleSubmit: client-side validation + multipart upload
  const handleSubmit = async () => {
    setFeedback(null);

    const sanitizedName = sanitize(name);
    const sanitizedDescription = sanitize(description);

    // Basic validation with feedback shown at top
    if (!sanitizedName) return setFeedback({ type: "destructive", message: "Name is required." });
    if (sanitizedName.length > NAME_MAX_LENGTH)
      return setFeedback({
        type: "destructive",
        message: `Name must be ${NAME_MAX_LENGTH} characters or fewer.`,
      });
    if (!sanitizedDescription) return setFeedback({ type: "destructive", message: "Description is required." });
    if (sanitizedDescription.length > DESCRIPTION_MAX_LENGTH)
      return setFeedback({
        type: "destructive",
        message: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`,
      });
    if (!file && !zipFile) return setFeedback({ type: "destructive", message: "Please upload a model file." });

    const uploadedFile = file ?? zipFile;

    const formData = new FormData();
    formData.append("name", sanitizedName);
    formData.append("description", sanitizedDescription);
    formData.append("isPrivate", isPrivate);
    formData.append("modelType", selectedModelType);
    formData.append("level", selectedLevel);
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

      // Success: show message and reset form fields
      setFeedback({ type: "success", message: "Model uploaded successfully!" });
      setName("");
      setDescription("");
      setIsPrivate(false);
      setSelectedLevel("dynamic");
      setFile(null);
      setZipFile(null);
      setDropzoneKey((k) => k + 1);
    } catch (error) {
      setFeedback({ type: "destructive", message: `Upload failed: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  // Do not render until auth state is known
  if (loading) return null;
  return (
    <>
      <StyledNavbar user={user} />
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center gap-4 px-4 py-8">

        {/* Feedback alert: success or error messages from the submit flow */}
        {feedback && (
          <Alert variant={feedback.type} className="w-full max-w-3xl">
            <AlertDescription className="flex flex-row items-center justify-between">
              {feedback.message}
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-current opacity-70 hover:opacity-100"
              >
                <IconX className="size-4" />
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* Name, Description, Privacy */}
        <Card className="w-full max-w-3xl p-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>
                Model Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Enter model name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={NAME_MAX_LENGTH}
              />
              <span className="self-end text-xs text-muted-foreground">
                {name.length}/{NAME_MAX_LENGTH}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                rows={3}
                placeholder="Enter model description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESCRIPTION_MAX_LENGTH}
              />
              <span className="self-end text-xs text-muted-foreground">
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </span>
            </div>

            <div className="flex flex-wrap items-start gap-6">
              {/* Model type and evaluation level selectors */}
              <LabeledSelect
                label="Model Type"
                options={modelTypes}
                value={selectedModelType}
                onFilterChange={(_label, value) => setSelectedModelType(value)}
              />
              <LabeledSelect
                label="Evaluation Level"
                options={["dynamic", "P0", "P1", "P2"]}
                value={selectedLevel}
                onFilterChange={(_label, value) => setSelectedLevel(value)}
              />

              {/* Privacy toggle */}
              <div className="flex flex-col items-start gap-1.5">
                <Label htmlFor="private-switch">Private</Label>
                <Switch
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  id="private-switch"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Submit button shows spinner while uploading */}
        <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
          {submitting ? (
            <>
              <Spinner />
              Uploading...
            </>
          ) : (
            "Submit Model"
          )}
        </Button>

        {/* Preview uploaded filename (zip or single file) */}
        {(file || zipFile) && (
          <Card className="flex w-full max-w-3xl flex-row items-center gap-2 px-4 py-3 text-sm font-medium">
            <IconFile className="size-4 shrink-0 text-muted-foreground" />
            {(file ?? zipFile).name}
          </Card>
        )}

        {/* Drop area: supports drag & drop or click to open file picker */}
        <div
          key={dropzoneKey}
          {...getRootProps()}
          className="flex w-full max-w-3xl cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card py-16 text-center transition-colors hover:border-primary/50"
        >
          <input {...getInputProps()} />
          <IconUpload className="size-10 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground">
            drag & drop or click to upload your model here
          </p>
          <p className="text-sm text-muted-foreground">(only .mat and .py files)</p>
        </div>

      </div>
    </>
  );
};

export default SubmitModel;
