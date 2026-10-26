"use client";

import Link from "next/link";
import { BarChart3, BookOpen, FileText, ImageIcon, LayoutDashboard, LogOut, Menu, MessageCircle, Package, Settings, Tag, Users, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import styles from "./admin-shell.module.css";

const links = [
  [LayoutDashboard, "Overview", "/admin-eric/home"],
  [Package, "Products", "/admin-eric/manage/products"],
  [BookOpen, "Catalogues", "/admin-eric/manage/catalogues"],
  [Tag, "Categories", "/admin-eric/manage/categories"],
  [MessageCircle, "Inquiries", "/admin-eric/manage/inquiries"],
  [BarChart3, "Analytics", "/admin-eric/analytics"],
  [FileText, "Pages", "/admin-eric/manage/pages"],
  [ImageIcon, "Media Library", "/admin-eric/manage/productImages"],
  [Users, "Admin Users", "/admin-eric/manage/users"],
  [Settings, "Settings", "/admin-eric/manage/settings"],
] as const;

export default function AdminSidebar() {
  return <aside className={`${styles.sidebar} ${styles.desktopSidebar}`}><SidebarContents /></aside>;
}

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin-eric"); router.refresh(); }
  return <>
    <Link href="/admin-eric/home" className={styles.brand} onClick={onNavigate} aria-label="Baby Bath Admin home"><span className={styles.brandMark} /><span>Baby Bath<br />Admin</span></Link>
    <nav aria-label="Administration">{links.map(([Icon, label, href]) => <Link key={href} href={href} onClick={onNavigate} aria-label={label} aria-current={pathname === href ? "page" : undefined} title={label} className={pathname === href ? styles.active : ""}><Icon size={24} /><span>{label}</span></Link>)}</nav>
    <div className={styles.bottom}><span>Little Baths<br />Brighter Tomorrows</span><button onClick={logout}><LogOut size={18} /> Sign out</button></div>
  </>;
}

export function AdminNavigation({ children }: { children?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);

  function close() { dialog.current?.close(); }
  function show() { dialog.current?.showModal(); setOpen(true); }

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 681px)");
    const onResize = () => { if (desktop.matches) dialog.current?.close(); };
    desktop.addEventListener("change", onResize);
    return () => { document.body.style.overflow = previousOverflow; desktop.removeEventListener("change", onResize); };
  }, [open]);

  return <div className={styles.headerStart}>
    <button ref={trigger} className={styles.menuToggle} type="button" aria-label="Open administration menu" aria-haspopup="dialog" aria-controls={id} aria-expanded={open} onClick={show}><Menu size={22} /><span>Menu</span></button>
    {children}
    <dialog ref={dialog} id={id} className={`${styles.sidebar} ${styles.drawer}`} aria-label="Administration menu" onClick={(event) => { if (event.target === event.currentTarget) close(); }} onClose={() => { setOpen(false); trigger.current?.focus(); }}>
      <div className={styles.drawerContent}>
        <div className={styles.drawerHeading}><span>Administration</span><button type="button" onClick={close} aria-label="Close administration menu"><X size={23} /></button></div>
        <SidebarContents onNavigate={close} />
      </div>
    </dialog>
  </div>;
}
