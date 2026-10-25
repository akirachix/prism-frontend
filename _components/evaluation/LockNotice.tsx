import { Lock } from "lucide-react";

import { lockCountdown } from "@/lib/evaluation-flow";
import { formatDate, formatLongDay } from "@/lib/format";
import { ProgressBar } from "../ui/bits";

/**
 * Shown after answers are sent: they are locked for six weeks, then the
 * evaluation opens again with these answers filled in.
 */
export default function LockNotice({
  lockedUntil,
  lastSubmittedAt,
}: {
  lockedUntil: string;
  lastSubmittedAt?: string | null;
}) {
  const { daysLeft, elapsedDays, totalDays } = lockCountdown(lockedUntil);
  return (
    <section className="evaluation__lock" aria-label="Answers are locked">
      <Lock size={22} aria-hidden="true" />
      <div className="evaluation__lock-text">
        <strong>Your answers are saved and locked.</strong>
        <span>
          You can view them now. The next 6-week check opens on{" "}
          {formatLongDay(lockedUntil)}
          {daysLeft > 0
            ? ` (${daysLeft} ${daysLeft === 1 ? "day" : "days"} left).`
            : "."}
        </span>
        {lastSubmittedAt && (
          <span className="evaluation__lock-sub">
            Last submitted {formatDate(lastSubmittedAt)}
          </span>
        )}
        <ProgressBar
          value={elapsedDays}
          max={totalDays}
          tone="orange"
          label="Days passed since you submitted"
        />
      </div>
    </section>
  );
}
