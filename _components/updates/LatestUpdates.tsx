"use client";

import Link from "next/link";
import { useState } from "react";

import { relativeDay } from "@/lib/format";
import { sortUpdates, type UpdateItem } from "@/lib/evaluation-updates";
import { Alert, Empty, Loading } from "../ui/bits";
import "../portal.css";
import "./latest-updates.css";

const FIRST = 6;

/** "Latest updates" on a home page: reminders first, then news by date. */
export default function LatestUpdates({
  items,
  loading,
  error,
}: {
  items: UpdateItem[];
  loading: boolean;
  error?: string | null;
}) {
  const [all, setAll] = useState(false);
  if (loading && items.length === 0) return <Loading />;
  if (error && items.length === 0) return <Alert>{error}</Alert>;
  if (items.length === 0) return <Empty>No updates yet.</Empty>;

  const sorted = sortUpdates(items);
  const shown = all ? sorted : sorted.slice(0, FIRST);
  return (
    <>
      <ul className="portal-news">
        {shown.map((item) => {
          const text = (
            <span
              className={
                item.unread || item.urgent
                  ? "portal-news__text portal-news__text--unread"
                  : "portal-news__text"
              }
            >
              {item.urgent && (
                <>
                  <span className="updates__dot" aria-hidden="true" />
                  <span className="visually-hidden">To do: </span>
                </>
              )}
              {item.text}
            </span>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="portal-news__item updates__link"
                >
                  {text}
                  <span className="portal-news__date">
                    {item.urgent ? "Now" : relativeDay(item.date)}
                  </span>
                </Link>
              ) : (
                <div className="portal-news__item">
                  {text}
                  <span className="portal-news__date">
                    {relativeDay(item.date)}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {sorted.length > FIRST && (
        <button
          type="button"
          className="ui-btn ui-btn--link updates__more"
          onClick={() => setAll((value) => !value)}
        >
          {all ? "Show fewer" : `Show all ${sorted.length} updates`}
        </button>
      )}
    </>
  );
}
