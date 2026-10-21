import { render, screen } from "@testing-library/react";

import AuthLayout from "@/app/_components/AuthLayout";
import TeacherLayout from "@/app/teacher/layout";

describe("AuthLayout", () => {
  it("does not render a parent navigation bar on auth pages", () => {
    render(
      <AuthLayout
        portal="parent"
        panelTitle="Parent sign in"
        panelText="Welcome"
      >
        <form>Parent form</form>
      </AuthLayout>,
    );

    expect(screen.queryByText("Parent portal")).not.toBeInTheDocument();
  });
});

describe("TeacherLayout", () => {
  it("does not render the teacher sidebar on auth routes", () => {
    render(
      <TeacherLayout>
        <div>Teacher auth content</div>
      </TeacherLayout>,
    );

    expect(
      screen.queryByRole("navigation", { name: "Main" }),
    ).not.toBeInTheDocument();
  });
});
