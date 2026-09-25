import { NavLink } from "react-router-dom";
import WalletButton from "./WalletButton";

const LINKS = [
  { to: "/agreements", label: "Agreements" },
  { to: "/open", label: "New Agreement" },
  { to: "/account", label: "Account" },
  { to: "/protocol", label: "Protocol" },
];

export default function Header() {
  return (
    <header className="p-shell">
      <div className="p-nav">
        <NavLink to="/" className="p-brand" aria-label="PACTUM home">
          <span className="p-brand-mark">P</span>
          <span className="p-brand-name">PACTUM</span>
          <span className="p-brand-tag">Studionet · 61999</span>
        </NavLink>
        <div className="p-nav-links-wrap">
          <nav className="p-nav-links" aria-label="Primary">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? "active" : "")}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-nav-side">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
