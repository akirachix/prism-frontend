import { Suspense } from "react";

import InviteCard from "./InviteCard";
import ParentAuth from "../ParentAuth";

export const metadata = { title: "You're invited · Mirai" };

export default function InvitePage() {
  return (
    <ParentAuth signup>
      <Suspense fallback={null}>
        <InviteCard />
      </Suspense>
    </ParentAuth>
  );
}
