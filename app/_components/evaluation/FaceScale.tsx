"use client";

import { Annoyed, Frown, Laugh, Meh, Smile } from "lucide-react";

import { SCALE } from "@/lib/evaluations";
import "../ui/ui.css";

const ICONS = [Frown, Annoyed, Meh, Smile, Laugh];

/** The five-face scale (-2 to 2) used by the 6-week check. */
export default function FaceScale({
  name,
  value,
  onChange,
  legend,
  showLabels,
}: {
  name: string;
  value: number | undefined;
  onChange: (score: number) => void;
  legend: string;
  showLabels?: boolean;
}) {
  const chosen = SCALE.find((item) => item.score === value);
  return (
    <fieldset className="ui-faces">
      <legend className="visually-hidden">{legend}</legend>
      <div className="ui-faces__row">
        {SCALE.map((item, index) => {
          const Icon = ICONS[index];
          const checked = value === item.score;
          return (
            <label
              key={item.score}
              className={checked ? "ui-face ui-face--checked" : "ui-face"}
            >
              <input
                type="radio"
                name={name}
                value={item.score}
                checked={checked}
                onChange={() => onChange(item.score)}
                className="visually-hidden"
              />
              <Icon size={30} aria-hidden="true" />
              <span className="ui-face__radio" aria-hidden="true" />
              <span className="ui-face__score">{item.score}</span>
              <span className={showLabels ? "ui-face__label" : "visually-hidden"}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>
      {!showLabels && (
        <p className="ui-faces__chosen" aria-live="polite">
          {chosen ? chosen.label : " "}
        </p>
      )}
    </fieldset>
  );
}
