import { Check, Star } from "lucide-react";

import type { JourneyStep } from "@/lib/journey";
import "../ui/ui.css";

/** The vertical "Amani's journey" timeline. */
export default function Journey({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="ui-journey">
      {steps.map((step) => (
        <li key={step.key} className={`ui-journey__step ui-journey__step--${step.state}`}>
          <span className="ui-journey__dot" aria-hidden="true">
            {step.state === "done" && <Check size={16} strokeWidth={3} />}
            {step.state === "current" && <Star size={14} fill="currentColor" />}
          </span>
          <span className="ui-journey__text">
            <span className="ui-journey__title">{step.title}</span>
            <span className="ui-journey__note">{step.note}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
