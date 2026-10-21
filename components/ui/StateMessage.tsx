import { Button } from "./Button";

export function Loading({ text = "Loading…" }: { text?: string }) {
  return (
    <p className="state state--loading" role="status">
      {text}
    </p>
  );
}

export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state state--error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <Button variant="link" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
