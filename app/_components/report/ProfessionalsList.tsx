"use client";

import { MapPin, Phone } from "lucide-react";

import { professionalsApi } from "@/lib/professionals";
import { useLoad } from "../useLoad";
import { Alert, Empty, Loading } from "../ui/bits";
import "./report.css";

const SPECIALTY = { PSYCHOLOGIST: "Psychologist", PSYCHIATRIST: "Psychiatrist" } as const;

/**
 * Pro bono specialists the school works with. The family decides whether
 * to contact anyone; Mirai never books or refers on their behalf.
 */
export default function ProfessionalsList() {
  const { data, error, loading } = useLoad(() => professionalsApi.list(), []);

  return (
    <section className="pros" aria-labelledby="pros-title">
      <h2 id="pros-title" className="ui-section-title">
        Support you can reach
      </h2>
      <p className="pros__intro">
        These specialists offer free (pro bono) help. Contacting them is your
        choice, and you can also choose someone else.
      </p>
      {loading ? (
        <Loading />
      ) : error ? (
        <Alert>{error}</Alert>
      ) : !data || data.length === 0 ? (
        <Empty>No specialists are listed yet.</Empty>
      ) : (
        <ul className="pros__list">
          {data.map((pro) => (
            <li key={pro.professional_id} className="ui-card pros__item">
              <p className="pros__name">
                {pro.first_name} {pro.last_name}
              </p>
              <p className="pros__specialty">{SPECIALTY[pro.specialty] ?? pro.specialty}</p>
              <p className="pros__line">
                <Phone size={16} aria-hidden="true" /> {pro.contact_details}
              </p>
              <p className="pros__line">
                <MapPin size={16} aria-hidden="true" /> {pro.location_address}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
