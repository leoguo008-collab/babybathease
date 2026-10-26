"use client";

import { Box, CheckCircle2, LogIn, MessageCircle, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../admin.module.css";
import loginLogStyles from "./login-log.module.css";
import AdminSidebar, { AdminNavigation } from "@/components/admin-sidebar";
import AdminAccountMenu from "@/components/admin-account-menu";

type LoginLog = { id: number; username: string; displayName: string; status: string; loggedInAt: string };
type DashboardStats = { productCount: number; newInquiryCount: number; loginLogs: LoginLog[] };

export default function AdminHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ productCount: 0, newInquiryCount: 0, loginLogs: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadDashboard = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const data = response.ok ? await response.json() : null;
      if (data) setStats(data);
    } finally { setIsRefreshing(false); }
  };
  useEffect(() => {
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => undefined);
  }, []);

  return (
    <main className={styles.adminPage}>
      <AdminSidebar />

      <section className={styles.adminContent}>
        <header className={styles.adminHeader}><AdminNavigation /><AdminAccountMenu /></header>
        <div className={styles.dashboardInner}>
          <h1>Good to see you</h1><p className={styles.dashboardIntro}>Here’s what’s happening today.</p>
          <section className={styles.metrics}>
            <button onClick={() => router.push("/admin-eric/manage/products")}><span className={styles.metricIcon}><Box /></span><strong>{stats.productCount}</strong><small>Products</small></button>
            <button onClick={() => router.push("/admin-eric/manage/inquiries")}><span className={`${styles.metricIcon} ${styles.mint}`}><MessageCircle /></span><strong>{stats.newInquiryCount}</strong><small>New Inquiries</small></button>
          </section>
          <section className={loginLogStyles.panel}>
            <div className={loginLogStyles.header}><div><h2>Administrator login log</h2><p>Latest 10 login attempts. Passwords are never stored in this log.</p></div><button className={loginLogStyles.refresh} onClick={() => void loadDashboard()} disabled={isRefreshing}><RefreshCw size={18} className={isRefreshing ? loginLogStyles.spinning : ""} /> Refresh</button></div>
            <div className={loginLogStyles.table}>
              <div className={loginLogStyles.head}><span>Administrator</span><span>Login account</span><span>Result</span><span>Login time</span></div>
              {stats.loginLogs.map((log) => <div className={loginLogStyles.row} key={log.id}><div className={loginLogStyles.identity}><span className={loginLogStyles.avatar}><LogIn size={18} /></span><b>{log.displayName}</b></div><span className={loginLogStyles.account} data-label="Login account">{log.username}</span><div className={loginLogStyles.result} data-label="Result"><span className={log.status === "Success" ? loginLogStyles.success : loginLogStyles.failed}>{log.status === "Success" ? <><CheckCircle2 size={16} /> Success</> : <><XCircle size={16} /> Failed</>}</span></div><time data-label="Login time" dateTime={log.loggedInAt}>{new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(log.loggedInAt))}</time></div>)}
              {!stats.loginLogs.length && <p className={loginLogStyles.empty}>No login attempts have been recorded yet. New administrator sign-ins will appear here.</p>}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
