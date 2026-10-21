import { landingFor, safeNext } from "@/_components/auth/flow";
import type { UserRead } from "@/lib/users";

describe("safeNext", () => {
  it("keeps a page inside the app", () => {
    expect(safeNext("/teacher/todo", "/teacher")).toBe("/teacher/todo");
  });

  it("refuses other sites", () => {
    expect(safeNext("https://evil.example", "/teacher")).toBe("/teacher");
    expect(safeNext("//evil.example", "/teacher")).toBe("/teacher");
  });

  it("never sends people back into sign-in", () => {
    expect(safeNext("/teacher/login", "/teacher")).toBe("/teacher");
    expect(safeNext("/parent/verify?x=1", "/parent")).toBe("/parent");
  });
});

describe("landingFor", () => {
  it("ignores a teacher page for a parent", () => {
    const parent = { role: "PARENT" } as UserRead;
    expect(landingFor(parent, "teacher", "/teacher/todo")).toBe("/parent");
  });
});
