import React from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import styled from "styled-components";
import StyledNavbar from "../Components/Navbar/StyledNavbar";
const FullscreenContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
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

export default function SubmitModel() {
//   const { getRootProps, getInputProps } = useDropzone();

  return (
    <>
    <StyledNavbar/>
    
    <FullscreenContainer>
      <DropArea >
        <input/>
        <Upload size={60} />
        <p style={{ marginTop: "20px", fontSize: "1.4rem" }}>drag & drop files here</p>
      </DropArea>
    </FullscreenContainer>
    </>
  );
}
