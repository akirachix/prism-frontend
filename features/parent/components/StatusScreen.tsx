import type { ReactNode } from "react";
import { Halo } from "@/components/ui/Halo";

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
  card?: boolean;
  variant?: "auth" | "app";
  actionsRow?: boolean;
}

export function StatusScreen({
  icon,
  title,
  description,
  actions,
  card,
  variant = "app",
  actionsRow,
}: Props) {
  return (
    <section
      className={`status status--${variant} ${card ? "status--card" : ""}`}
    >
      <Halo>{icon}</Halo>
      <h2 className="status__title">{title}</h2>
      <p className="status__text">{description}</p>
      <div
        className={`status__actions ${actionsRow ? "status__actions--row" : ""}`}
      >
        {actions}
      </div>
    </section>
  );
}
