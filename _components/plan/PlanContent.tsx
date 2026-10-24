"use client";

import { useState } from "react";

import type { IEP } from "@/lib/ieps";
import "./plan.css";

/** The plan text, short-term goals and strategies, with "Read the whole plan". */
export default function PlanContent({ iep }: { iep: IEP }) {
  const [open, setOpen] = useState(false);
  const text = iep.generated_content.trim();
  const preview = text.length > 420 ? `${text.slice(0, 420).trimEnd()}…` : text;
  const long = preview !== text || iep.strategies.length > 0;

  return (
    <div className="plan">
      <section className="plan__section">
        <h2 className="plan__heading">The plan</h2>
        <p className="plan__text">{open ? text : preview}</p>
      </section>

      {iep.short_term_goals.length > 0 && (
        <section className="plan__section">
          <h2 className="plan__heading">Short-term goals</h2>
          <ul className="plan__goals">
            {iep.short_term_goals.map((goal, i) => (
              <li key={i}>
                <span
                  className={`plan__dot plan__dot--${i % 2 === 0 ? "red" : "orange"}`}
                  aria-hidden="true"
                />
                {goal}
              </li>
            ))}
          </ul>
        </section>
      )}

      {open && iep.strategies.length > 0 && (
        <section className="plan__section">
          <h2 className="plan__heading">Classroom strategies</h2>
          <ul className="plan__list">
            {iep.strategies.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {long && (
        <button
          type="button"
          className="plan__toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          {open ? "Show less ↑" : "Read the whole plan →"}
        </button>
      )}
    </div>
  );
}
