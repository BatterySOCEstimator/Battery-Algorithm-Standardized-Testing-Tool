import styled from 'styled-components'
import background from '../../assets/images/andrew-kliatskyi-unsplash.jpg'
const Container = styled.div`
    height: calc(100vh - 56px);
    width: 100vw;
     background-image: url(${background});
  background-size: cover;         /* make image fill container */
  background-position: center;    /* center the image */
  background-repeat: no-repeat; 
  color: white;
`
const Padding = styled.div`
    padding: 32px;
`
const Title = styled.p`
    font-weight: 400;
    font-size: 32px;
`
const Flexbox = styled.div`
    display:flex;
    justify-content: space-between;
`
const Battery = styled.div`
    width: 50vw;
    display:flex;
    justify-content: center;
    align-items: center;
`
const SubTitle = styled.p`

`
const TextContainer = styled.div`
    width: 50vw
`
const Banner = () => {
    return(
    <Container>
        <Padding>
            <Flexbox>
            <TextContainer>
        <Title>SOC Estimator Testing Tool</Title>
        <SubTitle>Repository for easy visualization, analysis, and comparison of battery state of charge algorithms across institutions.</SubTitle>
        </TextContainer>
        <Battery>Image</Battery>
        </Flexbox>
    </Padding>
    </Container>)
}

export default Banner