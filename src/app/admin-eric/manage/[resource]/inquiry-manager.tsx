"use client";

import Link from "next/link";
import { Archive, ArrowLeft, ChevronDown, ChevronUp, Mail, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./inquiry-manager.module.css";
import messageStyles from "./inquiry-message.module.css";
import identityStyles from "./inquiry-identity.module.css";
import recycleStyles from "./inquiry-recycle-bin.module.css";
import AdminAccountMenu from "@/components/admin-account-menu";
import { AdminNavigation } from "@/components/admin-sidebar";

type Inquiry = { id: number; company: string; contact_name: string; email: string; phone: string; inquiry_type: string; quantity: string; market: string; message: string; status: string; created_at: string };
type InquiryView = "active" | "trash";

const displayDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function InquiryManager() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [view, setView] = useState<InquiryView>("active");
  const [counts, setCounts] = useState({ active: 0, trash: 0 });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/inquiries?view=${view}`, { cache: "no-store" });
    if (response.status === 401) { router.push("/admin-eric"); return; }
    const data = await response.json() as { items?: Inquiry[]; activeCount?: number; trashCount?: number };
    setItems(data.items || []);
    setCounts({ active: data.activeCount || 0, trash: data.trashCount || 0 });
    setLoading(false);
  }, [router, view]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function runAction(id: number, action: "trash" | "restore" | "permanent-delete") {
    const confirmation = action === "trash"
      ? "Move this inquiry to the recycle bin? You can restore it later."
      : action === "restore"
        ? "Restore this inquiry to the active list?"
        : "Permanently delete this inquiry? This cannot be undone.";
    if (!window.confirm(confirmation)) return;
    const response = await fetch("/api/admin/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    if (!response.ok) { setMessage("Action failed. Please try again."); return; }
    setExpanded(null);
    setMessage(action === "trash" ? "Inquiry moved to the recycle bin." : action === "restore" ? "Inquiry restored." : "Inquiry permanently deleted.");
    void load();
  }
  function changeView(nextView: InquiryView) { setExpanded(null); setMessage(""); setView(nextView); }

  if (loading) return <main className={styles.loading}>Loading inquiries…</main>;
  const isTrash = view === "trash";
  return <main className={styles.page}>
    <header className={styles.header}><AdminNavigation><Link href="/admin-eric/home"><ArrowLeft size={19} /> Dashboard</Link></AdminNavigation><AdminAccountMenu /></header>
    <div className={styles.content}>
      <div className={styles.title}><div><p>Administration</p><h1>{isTrash ? "Inquiry recycle bin" : "Inquiries"}</h1><small>{isTrash ? counts.trash : counts.active} record{(isTrash ? counts.trash : counts.active) === 1 ? "" : "s"}</small></div><div className={recycleStyles.tabs}><button className={!isTrash ? recycleStyles.active : ""} onClick={() => changeView("active")}>Inquiries <span>{counts.active}</span></button><button className={isTrash ? recycleStyles.active : ""} onClick={() => changeView("trash")}><Archive size={16} /> Recycle bin <span>{counts.trash}</span></button></div></div>
      {message && <p className={styles.notice}>{message}</p>}
      <section className={styles.list} aria-label={isTrash ? "Deleted customer inquiries" : "Customer inquiries"}>
        {!items.length && <p className={styles.empty}>{isTrash ? "The recycle bin is empty." : "No inquiries yet. New quote requests from the contact page will appear here."}</p>}
        {items.map((item) => {
          const isOpen = expanded === item.id;
          return <article className={styles.card} key={item.id}>
            <div className={styles.cardTop}><div className={identityStyles.identity}><div><small>Company name</small><strong>{item.company || "Individual inquiry"}</strong></div><div><small>Contact name</small><h2>{item.contact_name || "Unnamed contact"}</h2></div><a href={`mailto:${item.email}`}><Mail size={15} /> {item.email || "No email"}</a></div><div className={styles.meta}><span className={styles.status}>{item.status || "New"}</span><time>{displayDate(item.created_at)}</time></div></div>
            <div className={styles.summary}><Info label="Inquiry type" value={item.inquiry_type} /><Info label="Order quantity" value={item.quantity} /><Info label="Target market" value={item.market} /><Info label="Phone / WhatsApp" value={item.phone} /></div>
            <div className={`${isOpen ? styles.fullMessage : styles.preview} ${messageStyles.box}`}><b>Message</b><p className={isOpen ? messageStyles.fullText : messageStyles.previewText}>{item.message || "No message provided."}</p></div>
            <div className={styles.actions}><button className={styles.read} onClick={() => setExpanded(isOpen ? null : item.id)}>{isOpen ? <><ChevronUp size={17} /> Collapse</> : <><ChevronDown size={17} /> Read full inquiry</>}</button>{isTrash ? <div className={recycleStyles.trashActions}><button className={recycleStyles.restore} onClick={() => void runAction(item.id, "restore")}><RotateCcw size={17} /> Restore</button><button className={styles.delete} onClick={() => void runAction(item.id, "permanent-delete")}><Trash2 size={17} /> Delete permanently</button></div> : <button className={styles.delete} onClick={() => void runAction(item.id, "trash")} aria-label={`Move inquiry from ${item.contact_name} to recycle bin`}><Trash2 size={17} /> Delete</button>}</div>
          </article>;
        })}
      </section>
    </div>
  </main>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><small>{label}</small><span>{value || "—"}</span></div>; }
