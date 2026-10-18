import { screen } from "@testing-library/react";

import { renderAt } from "./renderWithRouter";

describe("Coming soon", () => {
  test("an address with no page yet shows Coming soon instead of an error", () => {
    renderAt("/teacher/a-page-that-is-not-built-yet");
    expect(screen.getByRole("heading", { level: 1, name: "Coming soon" })).toBeInTheDocument();
    expect(
      screen.getByText("This part of mirai is still being built. Please check back soon."),
    ).toBeInTheDocument();
  });

  test("offers a way back and the start page", () => {
    renderAt("/parent/does-not-exist");
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start page" })).toHaveAttribute("href", "/");
  });
});
