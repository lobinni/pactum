import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import Kicker from "../components/Kicker";

export default function NotFound() {
  return (
    <div className="p-page p-shell p-zone">
      <div className="p-empty">
        <Compass size={30} strokeWidth={1.4} style={{ color: "var(--p-accent-dark)" }} />
        <h3>This corridor is not on the map</h3>
        <p>The route you opened does not exist in this release. The ledger, the agreement form and the protocol notes are one tap away.</p>
        <Kicker bare>
          <Link to="/agreements" className="p-btn" style={{ marginRight: 8 }}>Open the ledger</Link>
          <Link to="/" className="p-btn p-btn-ghost">Back home</Link>
        </Kicker>
      </div>
    </div>
  );
}
