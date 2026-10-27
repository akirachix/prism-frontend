"use client";

import { MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";

import { errorMessage } from "@/lib/api";
import {
  professionalName,
  professionalsApi,
  specialtyLabel,
  type Professional,
} from "@/lib/professionals";
import "./reports.css";

export default function ProfessionalsList() {
  const [items, setItems] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    professionalsApi
      .listActive()
      .then((list) => setItems(list.filter((item) => item.is_active)))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      className="preports__section no-print"
      aria-labelledby="pros-title"
    >
      <h2 id="pros-title" className="preports__section-title">
        Support you can reach
      </h2>
      <p className="preports__lead">
        These specialists offer free (pro bono) help. Contacting them is your
        choice, and you can also choose someone else.
      </p>
      {loading && <p className="preports__message">Loading…</p>}
      {error && <p className="preports__error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="preports__message">No specialists are listed yet.</p>
      )}
      {items.length > 0 && (
        <ul className="preports__pros">
          {items.map((item) => (
            <li
              key={item.professional_id}
              className="preports__card preports__pro"
            >
              <p className="preports__pro-name">{professionalName(item)}</p>
              <p className="preports__pro-specialty">
                {specialtyLabel(item.specialty)}
              </p>
              <p className="preports__pro-line">
                <Phone size={16} aria-hidden="true" />
                {item.contact_details.includes("@") ? (
                  <a href={`mailto:${item.contact_details}`}>
                    {item.contact_details}
                  </a>
                ) : (
                  <a href={`tel:${item.contact_details.replace(/\s/g, "")}`}>
                    {item.contact_details}
                  </a>
                )}
              </p>
              <p className="preports__pro-line">
                <MapPin size={16} aria-hidden="true" /> {item.location_address}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
