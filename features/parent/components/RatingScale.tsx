import { FaceIcon } from "@/components/icons";
import type { EvaluationQuestion } from "../types";

interface Props {
  number: number;
  question: EvaluationQuestion;
  value: number | undefined;
  onChange: (value: number) => void;
}

export function RatingScale({ number, question, value, onChange }: Props) {
  const selected = question.scale.find((s) => s.value === value);
  return (
    <fieldset className="rating">
      <legend className="rating__head">
        <span className="rating__badge">Q{number}</span>
        <span className="rating__question">{question.text}</span>
      </legend>

      <div
        className="rating__cards"
        role="radiogroup"
        aria-label={question.text}
      >
        {question.scale.map((s) => {
          const active = s.value === value;
          return (
            <div key={s.value} className="rating__col">
              <button
                type="button"
                role="radio"
                aria-checked={active}
                className={`rating__card ${active ? "is-selected" : ""}`}
                onClick={() => onChange(s.value)}
              >
                <FaceIcon value={s.value} size={34} />
                <span className="rating__radio" />
                <span className="rating__value">{s.value}</span>
              </button>
              <span className="rating__label rating__label--all">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="rating__selected-label" aria-live="polite">
        {selected ? selected.label : "\u00A0"}
      </p>
    </fieldset>
  );
}
