"use client";

import { Annoyed, Frown, Laugh, Meh, Smile } from "lucide-react";

import { SCALE } from "@/lib/evaluations";
import "../ui/ui.css";

const ICONS = [Frown, Annoyed, Meh, Smile, Laugh];

/**
 * The five-face scale (-2 to 2) used by the 6-week check. The name of each
 * option is written under its card on every screen size. With `disabled`
 * the chosen answer is shown but cannot be changed.
 */
export default function FaceScale({
  name,
  value,
  onChange,
  legend,
  disabled,
}: {
  name: string;
  value: number | undefined;
  onChange: (score: number) => void;
  legend: string;
  disabled?: boolean;
}) {
  return (
    <fieldset className="ui-faces" disabled={disabled}>
      <legend className="visually-hidden">{legend}</legend>
      <div className="ui-faces__row">
        {SCALE.map((item, index) => {
          const Icon = ICONS[index];
          const checked = value === item.score;
          const classes = [
            "ui-face",
            checked ? "ui-face--checked" : "",
            disabled ? "ui-face--disabled" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={item.score} className="ui-faces__item">
              <label className={classes}>
                <input
                  type="radio"
                  name={name}
                  value={item.score}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onChange(item.score)}
                  aria-label={item.label}
                  className="visually-hidden"
                />
                <Icon size={30} aria-hidden="true" />
                <span className="ui-face__radio" aria-hidden="true" />
                <span className="ui-face__score">{item.score}</span>
              </label>
              <span className="ui-face__label" aria-hidden="true">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
