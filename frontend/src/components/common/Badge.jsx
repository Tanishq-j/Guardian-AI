export default function Badge({ severity = 'none', text }) {
  return (
    <span className={`badge badge-${severity}`}>
      {text || severity}
    </span>
  );
}
