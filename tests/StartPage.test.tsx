import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation, type Location } from "@/lib/router";

import App from "./TestApp";
import { saveSession } from "@/services/session";
import type { User } from "@/types/api";

let location: Location;
function LocationSpy() {
  location = useLocation();
  return null;
}

function open(user?: User) {
  if (user) saveSession({ user, token: `mock-token:${user.user_id}` });
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
      <LocationSpy />
    </MemoryRouter>,
  );
}

const person = (role: User["role"]): User => ({
  user_id: `u-${role}`,
  first_name: "Test",
  last_name: "User",
  email: `${role}@example.com`,
  role,
});

describe("Start page: who is signing in?", () => {
  test("asks who is signing in and offers the two sign-ins", () => {
    open();
    expect(screen.getByRole("heading", { level: 1, name: "Welcome to mirai" })).toBeInTheDocument();
    expect(screen.getByText("Who is signing in?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Teacher/ })).toHaveAttribute(
      "href",
      "/teacher/sign-in",
    );
    expect(screen.getByRole("link", { name: /^Parent/ })).toHaveAttribute(
      "href",
      "/parent/sign-in",
    );
  });

  test("tells first-time users where their account comes from", () => {
    open();
    expect(screen.getByText(/invitation email the school sent/)).toBeInTheDocument();
    expect(
      screen.getByText("Mirai is a screening tool. It never gives a diagnosis."),
    ).toBeInTheDocument();
  });

  test("a signed-in teacher goes straight to the teacher area", () => {
    open(person("teacher"));
    expect(location.pathname).toBe("/teacher");
  });

  test("a signed-in parent goes straight to the parent area", () => {
    open(person("parent"));
    expect(location.pathname).toBe("/parent");
  });
});
