import StyledNavbar from '../Components/Navbar/StyledNavbar'
import Banner from '../Components/Banner/Banner'
import Footnote from '../Components/Footnote/Footnote'

function Homepage({ user }) {
  return (
    <div>
      <StyledNavbar user={user} />
      <Banner />
      <Footnote />
    </div>
  );
}

export default Homepage;