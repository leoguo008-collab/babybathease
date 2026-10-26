"use client";

import { BarChart3, Clock3, Search, Users, Eye } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import styles from "./analytics.module.css";
import headerActions from "./analytics-header-actions.module.css";
import AdminAccountMenu from "@/components/admin-account-menu";
import { AdminNavigation } from "@/components/admin-sidebar";

type Summary = {
  days: number; pageViews: number; visitors: number; averageDuration: number; searchTerms: number;
  topPages: { path: string; pageViews: number; visitors: number; averageDuration: number }[];
  searchQueries: { term: string; visits: number; visitors: number }[];
};

const empty: Summary = { days: 30, pageViews: 0, visitors: 0, averageDuration: 0, searchTerms: 0, topPages: [], searchQueries: [] };
const formatDuration = (seconds: number) => seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;

export default function AnalyticsClient() {
  const [summary, setSummary] = useState<Summary>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/admin/analytics", { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw new Error("Unable to load analytics.");
    setSummary(await response.json() as Summary);
  }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load analytics.")).finally(() => setLoading(false)); }, []);
  const maxViews = Math.max(1, ...summary.topPages.map((page) => page.pageViews));
  return <section className={styles.content}>
    <div className={styles.mobileToolbar}><AdminNavigation /><AdminAccountMenu /></div>
    <header className={styles.header}><div><p>Website performance</p><h1>Traffic analytics</h1><span>Anonymous first-party data · Last {summary.days} days</span></div><div className={headerActions.actions}><BarChart3 size={34} /><AdminAccountMenu /></div></header>
    {error && <p className={styles.error}>{error}</p>}
    <section className={styles.metrics} aria-busy={loading}>
      <Metric icon={<Eye />} label="Page views" value={summary.pageViews.toLocaleString()} />
      <Metric icon={<Users />} label="Unique visitors" value={summary.visitors.toLocaleString()} />
      <Metric icon={<Clock3 />} label="Average time on page" value={formatDuration(summary.averageDuration)} />
      <Metric icon={<Search />} label="Captured search terms" value={summary.searchTerms.toLocaleString()} />
    </section>
    <div className={styles.grid}>
      <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Top pages</h2><p>Views, visitors and average time spent.</p></div></div>{summary.topPages.length ? <div className={styles.pages}>{summary.topPages.map((page) => <div className={styles.pageRow} key={page.path}><div className={styles.pageName}><b>{page.path}</b><span><i style={{ width: `${(page.pageViews / maxViews) * 100}%` }} /></span></div><strong>{page.pageViews}</strong><span>{page.visitors} visitors</span><span>{formatDuration(page.averageDuration)}</span></div>)}</div> : <Empty icon={<Eye />} text="Data will appear after visitors browse your public pages." />}</section>
      <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Search terms</h2><p>Terms from campaign links and available search referrers.</p></div></div>{summary.searchQueries.length ? <div className={styles.terms}>{summary.searchQueries.map((query) => <div key={query.term}><b>{query.term}</b><span>{query.visits} visits · {query.visitors} visitors</span></div>)}</div> : <Empty icon={<Search />} text="No search terms have been captured yet." />}</section>
    </div>
    <p className={styles.note}>This module does not store IP addresses or personal profiles. Google may hide organic-search keywords; use campaign links with <code>utm_term</code> to measure paid and shared search terms.</p>
  </section>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <article className={styles.metric}><span>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>; }
function Empty({ icon, text }: { icon: ReactNode; text: string }) { return <div className={styles.empty}><span>{icon}</span><p>{text}</p></div>; }
