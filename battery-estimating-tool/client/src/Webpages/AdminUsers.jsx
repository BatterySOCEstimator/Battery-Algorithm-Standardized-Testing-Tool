// Admin > Users page. Gated by useRequireAdmin — non-admins (and signed-out
// visitors) get redirected before this ever renders.
import StyledNavbar from "../Components/Navbar/StyledNavbar";
import useRequireAdmin from "../Hooks/useRequireAdmin";

const AdminUsers = ({ user }) => {
  const { loading } = useRequireAdmin();

  if (loading)
    return (
      <>
        <StyledNavbar user={user} />
        <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">Loading...</div>
      </>
    );

  return (
    <>
      <StyledNavbar user={user} />
      <div className="mx-auto max-w-7xl px-5 pt-4 pb-5">
        <h2 className="mb-5 text-2xl font-semibold text-foreground">Admin — Users</h2>
        <p className="text-sm text-muted-foreground">User management tools coming soon.</p>
      </div>
    </>
  );
};

export default AdminUsers;
