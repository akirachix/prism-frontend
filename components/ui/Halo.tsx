import type { ReactNode } from "react";

export function Halo({ children }: { children: ReactNode }) {
  return (
    <div className="halo" aria-hidden="true">
      <span className="halo__dot halo__dot--red" />
      <span className="halo__dot halo__dot--orange" />
      <span className="halo__icon">{children}</span>
    </div>
  );
}
