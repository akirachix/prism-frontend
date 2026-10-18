import { render } from "@testing-library/react";
import { MemoryRouter } from "@/lib/router";

import App from "./TestApp";

export function renderAt(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
