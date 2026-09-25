import { AlertTriangle } from "lucide-react";
import { IS_DEPLOYED } from "../lib/config";

export default function ConfigBanner() {
  if (IS_DEPLOYED) return null;
  return (
    <div className="p-shell">
      <div className="p-config-banner">
        <AlertTriangle size={14} style={{ flex: "none", color: "#a5681e" }} />
        <span>
          Release candidate — the canonical Studionet deployment address is not configured yet. Reads are disabled
          until the address is published; see the deployments record after running the deployment script.
        </span>
      </div>
    </div>
  );
}
