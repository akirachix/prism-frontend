export function Squiggle({
  className = "",
  color = "#f58220",
  width = 74,
}: {
  className?: string;
  color?: string;
  width?: number;
}) {
  return (
    <svg
      className={className}
      width={width}
      height={(width * 20) / 74}
      viewBox="0 0 74 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 12c6-12 12-12 18 0s12 12 18 0 12-12 18 0 12 12 18 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
