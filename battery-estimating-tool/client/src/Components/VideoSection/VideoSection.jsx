import styled from "styled-components";

// Section container for the video and text
const Section = styled.div`
  width: 100%;
  padding: 80px 40px;
  display: flex;
  justify-content: center;
  background-color: #f8f9fa;
`;
// Inner content wrapper to center the video and text
const Content = styled.div`
  max-width: 85vw;
  width: 100%;
  display: flex;
  gap: 40px;
  align-items: center;

  @media (max-width: 992px) {
    flex-direction: column;
  }
`;
// Wrapper for the video iframe with responsive sizing
const VideoWrapper = styled.div`
  flex: 1;

  iframe {
    width: 50vw;
    height: 450px;
    border-radius: 12px;
    border: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
    @media (max-width: 992px) {
    iframe {
    width: 85vw
  }
  }
`;
// Wrapper for the text content next to the video
const TextWrapper = styled.div`
  flex: 1;
`;
// Title for the text section
const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 16px;
`;
// Paragraph text for the text section
const Text = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
`;

const VideoSection = () => {
  return (
    <Section>
      <Content>
        <VideoWrapper>
          <iframe
  src="https://www.youtube.com/embed/8j1W0E0ylmE"
  title="YouTube video player"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerPolicy="strict-origin-when-cross-origin"
  allowFullScreen
/>
        </VideoWrapper>

        <TextWrapper>
          <Title>Our project</Title>
          <Text>
            To help understand our mission better with this platform, check out our video that gives an overview of the problem we are addressing, our solution, and the impact we hope to achieve in the battery SOC estimation space.
            You’ll see how our platform enables researchers and developers to compare performance, drive innovation, and build more reliable battery management solutions.
          </Text>
        </TextWrapper>
      </Content>
    </Section>
  );
};

export default VideoSection;