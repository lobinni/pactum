import { FileSearch } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({
  title,
  body,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="p-empty">
      <FileSearch size={30} strokeWidth={1.4} style={{ color: "var(--p-accent-dark)" }} />
      <h3>{title}</h3>
      <p>{body}</p>
      {ctaLabel && ctaTo ? (
        <Link className="p-btn" to={ctaTo}>
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
