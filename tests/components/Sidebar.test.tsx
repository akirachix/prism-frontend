import { render, screen, within } from "@testing-library/react";

import Sidebar from "@/app/teacher/_components/Sidebar";

let mockPathname = "/teacher/cases";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

const LINKS = [
  { href: "/teacher", label: "Home", exact: true },
  { href: "/teacher/students", label: "Students" },
  { href: "/teacher/cases", label: "Cases" },
];

beforeEach(() => {
  mockPathname = "/teacher/cases";
});

describe("Sidebar", () => {
  it("shows the Mirai logo", () => {
    render(<Sidebar links={LINKS} />);
    expect(screen.getByAltText("Mirai")).toBeInTheDocument();
  });

  it("shows every link it is given", () => {
    render(<Sidebar links={LINKS} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link")).toHaveLength(3);
  });

  it("marks only the current page as active", () => {
    render(<Sidebar links={LINKS} />);
    expect(screen.getByText("Cases")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Students")).not.toHaveAttribute("aria-current");
  });

  it("does not mark Home active on other pages (exact match)", () => {
    render(<Sidebar links={LINKS} />);
    expect(screen.getByText("Home")).not.toHaveAttribute("aria-current");
  });

  it("marks Home active on the home page", () => {
    mockPathname = "/teacher";
    render(<Sidebar links={LINKS} />);
    expect(screen.getByText("Home")).toHaveAttribute("aria-current", "page");
  });

  it("keeps a section active on its sub pages", () => {
    mockPathname = "/teacher/cases/123";
    render(<Sidebar links={LINKS} />);
    expect(screen.getByText("Cases")).toHaveAttribute("aria-current", "page");
  });
});
