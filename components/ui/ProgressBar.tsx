export function ProgressBar({ label, progress }: { label: string; progress: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div className="progress">
      <p className="progress__label">{label}</p>
      <div className="progress__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
