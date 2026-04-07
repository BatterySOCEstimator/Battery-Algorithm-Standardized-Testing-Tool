import StyledNavbar from '../Components/Navbar/StyledNavbar'
import Banner from '../Components/Banner/Banner'
import VideoSection from '../Components/VideoSection/VideoSection'
import Footnote from '../Components/Footnote/Footnote'

function Homepage({ user }) {
  return (
    <div>
      <StyledNavbar user={user} />
      <Banner />
      <VideoSection />
      <Footnote />
    </div>
  );
}

export default Homepage;