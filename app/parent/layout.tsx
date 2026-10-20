import { ParentFrame } from "@/features/parent";

/** Layout for all /parent/* routes: navigation shell + PARENT-only guard. */
export default function ParentLayout({ children }: LayoutProps<"/parent">) {
  return <ParentFrame>{children}</ParentFrame>;
}
