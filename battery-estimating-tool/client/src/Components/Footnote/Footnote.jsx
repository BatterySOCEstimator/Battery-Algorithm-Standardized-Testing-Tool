// src/Components/Footnote/Footnote.jsx
import styled from "styled-components";

// background for footnote at the bottom of the page
const Container = styled.footer`
  width: 100%;
  background-color: #e0e0e0;
  color: #555;
  padding: 12px 16px;
  display: flex;
  justify-content: center;
  font-size: 0.85rem;
`;

// text container for footnote content
const Content = styled.div`
  max-width: 1200px;
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Footnote = () => {
  return (
    <Container>
      <Content>
        © Battery SOC Benchmarking Platform
      </Content>
    </Container>
  );
};

export default Footnote;