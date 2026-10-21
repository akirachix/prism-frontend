"use client";

import Link from "next/link";
import { PageHeader } from "../../../components/layout/PageHeader";
import { ErrorMessage, Loading } from "../../../components/ui/StateMessage";
import { useSession } from "../../../features/auth";
import { initials } from "../../../lib/format";
import { useAsync } from "../../../lib/use-async";
import { teacherApi } from "../api";
import styles from "./HomeScreen.module.css";

export function HomeScreen() {
  const { user } = useSession();
  const { data, error, loading, reload } = useAsync(teacherApi.home);
  const name = user?.firstName || "Teacher";

  const tiles = data
    ? [
        {
          label: "Students",
          value: data.stats.students,
          tone: styles["stat--students"],
        },
        {
          label: "Open cases",
          value: data.stats.openCases,
          tone: styles["stat--cases"],
        },
        {
          label: "Active IEP",
          value: data.stats.activeIeps,
          tone: styles["stat--active"],
        },
        { label: "Unapproved IEP", value: data.stats.unapprovedIeps, tone: "" },
      ]
    : [];

  return (
    <>
      <PageHeader title="Home" />
      <div className={`page-body ${styles.body}`}>
        <div className={styles.hello}>
          <span className={styles.avatar}>{initials(user?.name || name)}</span>
          <h2 className="greeting">Hello, {name}!</h2>
        </div>

        {loading && <Loading />}
        {error && <ErrorMessage message={error} onRetry={reload} />}

        {data && (
          <>
            <div className={styles.stats}>
              {tiles.map((tile) => (
                <div key={tile.label} className={`${styles.stat} ${tile.tone}`}>
                  <p className={styles.statValue}>{tile.value}</p>
                  <p className={styles.statLabel}>{tile.label}</p>
                </div>
              ))}
            </div>

            <section aria-label="Needs your attention">
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>Needs your attention</h3>
                <Link href="/teachers/to-do" className={styles.seeAll}>
                  See all
                </Link>
              </div>
              <div className={styles.attention}>
                {data.needsAttention.length === 0 && (
                  <p className={styles.empty}>
                    Nothing needs your attention right now.
                  </p>
                )}
                {data.needsAttention.map((item) => (
                  <div key={item.id} className={styles.row}>
                    <div>
                      <p className={styles.rowTitle}>{item.studentName}</p>
                      <p className={styles.rowNote}>{item.note}</p>
                    </div>
                    <span className={styles.pill}>{item.status}</span>
                  </div>
                ))}
              </div>
            </section>

            <section aria-label="Latest actions">
              <div className={styles.sectionHead}>
                <h3 className={styles.sectionTitle}>Latest actions</h3>
              </div>
              <div className={styles.latest}>
                {data.latestActions.length === 0 && (
                  <p className={styles.empty}>No recent activity.</p>
                )}
                {data.latestActions.map((item) => (
                  <div key={item.id} className={styles.row}>
                    <p className={styles.rowTitle}>{item.text}</p>
                    <span className={styles.time}>{item.time}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
