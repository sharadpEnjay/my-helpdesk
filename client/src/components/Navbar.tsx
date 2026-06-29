import { authClient } from "../lib/auth-client";

interface NavbarProps {
  userName: string;
}

export function Navbar({ userName }: NavbarProps) {
  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <nav className="navbar glass">
      <span className="navbar-brand">Helpdesk</span>
      <div className="navbar-user">
        <span className="navbar-username">{userName}</span>
        <button className="secondary-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
    </nav>
  );
}
