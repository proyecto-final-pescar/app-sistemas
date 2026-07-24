// client/src/components/ui/badge/Badge
import "./Badge.css";

function Badge({ texto, variante }) {
  return <span className={`badge badge-${variante}`}>{texto}</span>;
}

export default Badge;
