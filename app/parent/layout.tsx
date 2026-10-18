import type { ReactNode } from "react";

import ParentLayout from "@/layouts/ParentLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <ParentLayout>{children}</ParentLayout>;
}

export const instant = false;
