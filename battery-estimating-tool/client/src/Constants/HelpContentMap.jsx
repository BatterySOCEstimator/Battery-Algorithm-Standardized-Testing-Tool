//Constants found for each link on the help page.
import styled from "styled-components";

// Container for a help topic card
const HelpContainer = styled.div`
  max-width: 800px;
  margin: 24px auto;
  padding: 24px;

  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  line-height: 1.6;
`;

// Title used at the top of each help topic
const Title = styled.h2`
  margin-bottom: 16px;
  font-weight: 600;
`;

// Generic section wrapper for spacing
const Section = styled.div`
  margin-bottom: 20px;
`;

// Step block highlights an individual instruction step
const Step = styled.div`
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #359daa;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 6px;
`;

// Title for a step within a Step block
const StepTitle = styled.h5`
  margin: 0 0 6px 0;
  font-weight: 600;
`;

// Paragraph text 
const Paragraph = styled.p`
  margin: 0;
  color: #444;
`;

// Simple list styles 
const List = styled.ul`
  padding-left: 20px;
`;

const ListItem = styled.li`
  margin-bottom: 6px;
`;

// Small badge for file extensions and toggles
const Badge = styled.span`
  background: #e6f4f1;
  color: #359daa;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 500;
`;




// Each key e.g. "submission-process" corresponds to a route like `/help/submission-process` that must be found in Help.jsx.
// The `title` is used for the page header, and the `content` is the content for the help topic.
export const HelpContentMap = {
  "submission-process": {
  title: "Submission Process",
  content: (
    <HelpContainer>
      <Title>Submission Process</Title>

      <Section>
        <Paragraph>
          Follow these steps to successfully submit your model.
        </Paragraph>
      </Section>

      <Step>
        <StepTitle>Step 1</StepTitle>
        <Paragraph>
          Create your SOC estimator and save it as a{" "}
          <Badge>.m</Badge> or <Badge>.mat</Badge> file.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Step 2</StepTitle>
        <Paragraph>
          Go to <strong>"Submit Model"</strong>, upload your file, enter a name,
          choose a model type, and select visibility.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Step 3</StepTitle>
        <Paragraph>
          Visit <strong>"View Submissions"</strong> to track status and view results.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Step 4</StepTitle>
        <Paragraph>
          If public, check the leaderboard to compare performance.
        </Paragraph>
      </Step>
    </HelpContainer>
  ),
},

  "valid-files": {
  title: "Valid File Types",
  content: (
    <HelpContainer>
      <Title>Valid File Types</Title>

      <Section>
        <Paragraph>Only the following formats are accepted:</Paragraph>
      </Section>

      <List>
        <ListItem><Badge>.m</Badge> MATLAB script files</ListItem>
        <ListItem><Badge>.mat</Badge> MATLAB data files</ListItem>
      </List>

      <Section>
        <Paragraph>
          Any other file type will result in an error.
        </Paragraph>
      </Section>
    </HelpContainer>
  ),
},
  "code-ownership": {
  title: "Code Ownership",
  content: (
    <HelpContainer>
      <Title>Code Ownership</Title>

      <Section>
        <Paragraph>
          All code submitted through this platform remains the property of the original author.
        </Paragraph>
      </Section>

      <Step>
        <StepTitle>Your Rights</StepTitle>
        <Paragraph>
          You retain full ownership of any code you submit. This platform does not claim any rights over your work.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Submission Agreement</StepTitle>
        <Paragraph>
          By submitting, you confirm that you have the legal rights to the code and grant permission for it to be processed for evaluation purposes only.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Privacy Assurance</StepTitle>
        <Paragraph>
          Your code is handled securely and is only used within the scope of testing and benchmarking.
        </Paragraph>
      </Step>
    </HelpContainer>
  ),
},
"public-private-submission": {
  title: "Public vs Private Submission",
  content: (
    <HelpContainer>
      <Title>Public vs Private Submission</Title>

      <Section>
        <Paragraph>
          When submitting a model, you can choose whether your submission is visible to others.
        </Paragraph>
      </Section>

      <Step>
        <StepTitle>Public Submission</StepTitle>
        <Paragraph>
          Your model will appear on the leaderboard and can be compared with other submissions.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Private Submission</StepTitle>
        <Paragraph>
          Your model will remain hidden from the leaderboard, but you can still view all performance metrics.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Visibility Toggle</StepTitle>
        <Paragraph>
          During submission, use the toggle to switch between <Badge>Public</Badge> and <Badge>Private</Badge>.
        </Paragraph>
      </Step>

      <Section>
        <Paragraph>
          {/* Replace this with an actual image later */}
          <em>Toggle preview coming soon</em>
        </Paragraph>
      </Section>
    </HelpContainer>
  ),
},"account-verification": {
  title: "Account Verification",
  content: (
    <HelpContainer>
      <Title>Account Verification</Title>

      <Section>
        <Paragraph>
          To ensure security and proper access, your account may need to be verified before using all features of the platform.
        </Paragraph>
      </Section>

      <Step>
        <StepTitle>Step 1: Sign Up</StepTitle>
        <Paragraph>
          Create an account using your email and password through the registration page.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Step 2: Check Your Email</StepTitle>
        <Paragraph>
          After signing up, you will receive a verification email. Click the link provided to verify your account.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Step 3: Access Your Account</StepTitle>
        <Paragraph>
          Once verified, you will gain full access to features such as submitting models and viewing results.
        </Paragraph>
      </Step>

      <Step>
        <StepTitle>Troubleshooting</StepTitle>
        <Paragraph>
          Didn’t receive the email? Check your spam folder or try resending the verification link from the login page.
        </Paragraph>
      </Step>

      <Section>
        <Paragraph>
          <strong>Note:</strong> You will be unable to access the features of the platform until your account is verified.
        </Paragraph>
      </Section>
    </HelpContainer>
  ),
},
}
// Note: Add new topics by adding another key here with `title` and `content`.