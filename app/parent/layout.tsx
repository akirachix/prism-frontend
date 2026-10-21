import { ParentFrame } from "../../features/parent";

export default function ParentLayout({ children }: LayoutProps<"/parent">) {
  return <ParentFrame>{children}</ParentFrame>;
}
