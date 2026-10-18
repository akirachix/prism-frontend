import type { ReactElement, ReactNode } from "react";

import AppLayout from "@/layouts/AppLayout";
import ParentLayout from "@/layouts/ParentLayout";
import TeacherLayout from "@/layouts/TeacherLayout";

type ScreenComponent = () => ReactElement | null;
type Layout = (props: { children: ReactNode }) => ReactElement | null;

export interface Page {
  path: string;
  render: () => ReactNode;
  layout?: Layout;
}

export const teacher = (path: string, Screen: ScreenComponent): Page => ({
  path: `/teacher${path}`,
  render: () => <Screen />,
  layout: TeacherLayout,
});

export const parent = (path: string, render: () => ReactNode): Page => ({
  path: `/parent${path}`,
  render,
  layout: ParentLayout,
});

export const site = (path: string, Screen: ScreenComponent): Page => ({
  path,
  render: () => <Screen />,
  layout: AppLayout,
});

export const bare = (path: string, Screen: ScreenComponent): Page => ({
  path,
  render: () => <Screen />,
});
