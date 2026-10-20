import { SessionRedirect } from "@/features/auth";

/** "/" - signed in: your portal's home; signed out: the sign-in chooser. */
export default function Home() {
  return <SessionRedirect />;
}
