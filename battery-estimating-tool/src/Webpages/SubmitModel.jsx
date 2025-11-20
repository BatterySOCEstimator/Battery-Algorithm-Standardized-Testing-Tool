import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import styled from "styled-components";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import LabeledSelect from "../Components/LabeledSelect/LabeledSelect";

const modelTypes = [
  "All Model Types",
  "Machine Learning",
  "Kalman Filter",
  "Extended Kalman Filter",
  "Other Kalman Filter",
  "FNN",
  "LSTM",
  "GRU",
  "NARX",
  "Transformer",
  "Other Neural Network",
  "Coulomb Counter",
  "Hybrid Model",
  "Not Specified"
];
const columns = [
    'Submission',
    'Model Name',
    'Model Type',
    'Status',
    'Visibility',
    'Submitted at',
    'Completed at',
    'Weighted Error',
    'All Cells',
    'Blind Cells',
    'Non-Blinded Cells',
    'Charging',
    '80kg Payload',
    '448kg Payload with HVAC',
    '448kg Payload no HVAC',
    '1000kg Payload',
    'Standard Cycles',
    'Custom Cycles',
    'n20C',
    'n10C',
    '0C',
    '10C',
    '25C',
    '40C',
    'iSOC Error',
    'Current Sensor Error',
    'All Drive Cycles Average RMSE',
    'All Drive Cycles Average MAE',
    'All Drive Cycles Average MAXE'
  ];

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
const newItem = {
  'Submission': "abb2",
  'Model Name': "test",
  'Model Type': "Machine Learning",
  'Status' : "Done",
  'Visibility': "public",
  'Submitted at' :"11/20/2025 3:04:05",
  'Completed at': "11/20/2025 3:30:10",
  "Weighted Error": 0.042,
  "All Cells": 0.038,
  "Blind Cells": 0.051,
  "Non-Blinded Cells": 0.033,
  "Charging": 0.047,
  "80kg Payload": 0.029,
  "448kg Payload with HVAC": 0.063,
  "448kg Payload no HVAC": 0.054,
  "1000kg Payload": 0.071,
  "Standard Cycles": 0.041,
  "Custom Cycles": 0.058,
  "n20C": 0.067,
  "n10C": 0.059,
  "0C": 0.052,
  "10C": 0.035,
  "25C": 0.028,
  "40C": 0.033,
  "iSOC Error": 0.014,
  "Current Sensor Error": 0.009,
  "All Drive Cycles Average RMSE": 0.062,
  "All Drive Cycles Average MAE": 0.043,
  "All Drive Cycles Average MAXE": 0.117
};
const SubmitModel = ({estimatedSOC, setEstimatedSOC}) => {
  const navigate = useNavigate();

  const [selectedAuthor, setSelectedAuthor] = useState("All authors");
  const [selectedAffiliation, setSelectedAffiliation] = useState("All Academic Affiliations");
  const [selectedModelType, setSelectedModelType] = useState(modelTypes[0]); // or whatever default

  const changeSOC = async() => {
    try {

      if (!file) {
        alert("Please upload a file first!");
        return;
      }
      
      // Get selected values
      const author = selectedAuthor;
      const affiliation = selectedAffiliation;
      const modelType = selectedModelType;
      
      // Construct form data
      const formData = new FormData();
      formData.append("model", file);
      formData.append("author", author);
      formData.append("academic_affiliation", affiliation);
      formData.append("model_type", modelType);

      console.log("Sending file:", {
        filename: file.name,
        author: selectedAuthor,
        affiliation: selectedAffiliation,
        modelType: selectedModelType
      });

      const response = await fetch("http://localhost:5000/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Response:", result);


      setEstimatedSOC(prev => [...prev, newItem])
      //setTimeout(1000)
      navigate("/submissions");

    } catch (error) {
    console.error("Upload failed:", error);
    alert("Failed to upload file: " + error.message);
  }
  }

  const [file, setFile] = useState(null);
  console.log(estimatedSOC)
  const onDrop = useCallback((acceptedFiles) => {
    console.log("Uploaded Files:", acceptedFiles);
    setFile(acceptedFiles[0]); // save uploaded file
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <>

      <StyledNavbar />

      <FullscreenContainer>

        {/* Filters Row */}
        <FlexBox>
            <LabeledSelect 
              label={"Author"} 
              options={["All authors", "Paarth"]} 
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)} />
            <LabeledSelect 
              label={"Academic Affiliation"} 
              options={["All Academic Affiliations", "McMaster"]} 
              value={selectedAffiliation}
              onChange={(e) => setSelectedAffiliation(e.target.value)} />
            <LabeledSelect 
              label={"Model Type"} 
              options={modelTypes} 
              value={selectedModelType}
              onChange={(e) => setSelectedModelType(e.target.value)}/>
        </FlexBox>

        <Button onClick={changeSOC} style={{marginBottom: "16px"}}>Submit Model</Button>

        {/* Mini card showing file name */}
        {file && <FileCard>📄 {file.name}</FileCard>}

        <DropArea {...getRootProps()}>
          <input {...getInputProps()} />

          <Upload size={60} />
          <p style={{ marginTop: "20px", fontSize: "1.4rem" }}>
            drag & drop files here
          </p>
          <p style={{ opacity: 0.7 }}>(or click to upload)</p>
        </DropArea>
      </FullscreenContainer>
    </>
  );
};

export default SubmitModel;
