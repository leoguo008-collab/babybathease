import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/database";
import AdminSidebar from "@/components/admin-sidebar";
import AnalyticsClient from "./analytics-client";
import styles from "./analytics.module.css";

export default async function AnalyticsPage() {
  if (!(await currentAdmin())) redirect("/admin-eric");
  return <main className={styles.page}><AdminSidebar /><AnalyticsClient /></main>;
}
