import styled from 'styled-components'
import { FaBatteryFull } from 'react-icons/fa'
import background from '../../assets/images/andrew-kliatskyi-unsplash.jpg'

// Hero banner background container that fills the viewport minus nav height
const Container = styled.div`
  height: calc(100vh - 56px);
  width: 100vw;
  background-image: url(${background});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
`

// Inner centered content wrapper for the hero text and icon
const Content = styled.div`
  max-width: 1000px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`

// Headline text style for the banner title
const Title = styled.h1`
  font-weight: 700;
  font-size: 3rem;
  margin: 0;
`

// text under the title
const SubTitle = styled.p`
  font-size: 1.2rem;
  line-height: 1.5;
  max-width: 600px;
`

// Icon displayed 
const BatteryIcon = styled(FaBatteryFull)`
  font-size: 6rem;
  color: #fff;
`

const Banner = () => {
  return (
    <Container>
      <Content>
        <Title>Benchmark SOC Models Against Industry Standards.</Title>
        <SubTitle>
         Upload, evaluate, and rank your State of Charge AI model using standardized datasets and metrics created by a team of researchers at McMaster.
        </SubTitle>
        <BatteryIcon />
      </Content>
    </Container>
  )
}

export default Banner
