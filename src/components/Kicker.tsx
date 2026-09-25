export default function Kicker({ children, bare = false }: { children: React.ReactNode; bare?: boolean }) {
  return <span className={`p-kicker${bare ? " p-kicker-bare" : ""}`}>{children}</span>;
}
