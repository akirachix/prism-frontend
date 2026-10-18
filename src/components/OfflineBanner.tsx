"use client";

import useOnlineStatus from "@/hooks/useOnlineStatus";
import styles from "./OfflineBanner.module.css";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div role="status" className={styles.banner}>
      You are offline. You can keep viewing saved pages; changes will need a connection.
    </div>
  );
}
