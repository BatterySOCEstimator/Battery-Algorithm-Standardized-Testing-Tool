import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import styled from "styled-components";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

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

  const changeSOC = () => {
    setEstimatedSOC(prev => [...prev, newItem])
    setTimeout(1000)
    navigate("/submissions");
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
