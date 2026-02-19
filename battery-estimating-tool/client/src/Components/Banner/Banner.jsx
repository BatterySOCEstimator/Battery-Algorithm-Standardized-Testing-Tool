import styled from 'styled-components'
import { FaBatteryFull } from 'react-icons/fa'
import background from '../../assets/images/andrew-kliatskyi-unsplash.jpg'

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

const Content = styled.div`
  max-width: 1000px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
`

const Title = styled.h1`
  font-weight: 700;
  font-size: 3rem;
  margin: 0;
`

const SubTitle = styled.p`
  font-size: 1.2rem;
  line-height: 1.5;
  max-width: 600px;
`

const BatteryIcon = styled(FaBatteryFull)`
  font-size: 6rem;
  color: #fff;
`

const Banner = () => {
  return (
    <Container>
      <Content>
        <Title>SOC Estimator Testing Tool</Title>
        <SubTitle>
          Repository for easy visualization, analysis, and comparison of battery state of charge algorithms across institutions.
        </SubTitle>
        <BatteryIcon />
      </Content>
    </Container>
  )
}

export default Banner
