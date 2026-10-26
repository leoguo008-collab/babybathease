"use client";

import { Bell, KeyRound, LockKeyhole, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import styles from "./admin-account-menu.module.css";

type Account = { username: string; displayName: string; role: string };
const fallbackAccount: Account = { username: "", displayName: "Admin", role: "Administrator" };
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "AD";

export default function AdminAccountMenu() {
  const [account, setAccount] = useState<Account>(fallbackAccount);
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch("/api/admin/account", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: Account | null) => { if (data) setAccount(data); })
      .catch(() => undefined);
  }, []);
  function close() { setOpen(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setNotice(""); }
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setNotice("New passwords do not match."); return; }
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/admin/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to change password.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setNotice("Password changed successfully.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to change password."); }
    finally { setSaving(false); }
  }
  return <>
    <div className={styles.account}><button className={styles.notification} type="button" aria-label="Notifications"><Bell size={21} /></button><button className={styles.trigger} type="button" onClick={() => setOpen(true)} aria-label="Open administrator profile"><span className={styles.avatar}>{initials(account.displayName)}</span><span className={styles.name}>{account.displayName}</span></button></div>
    {open && <div className={styles.overlay} role="presentation" onMouseDown={close}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="admin-profile-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p>Administrator account</p><h2 id="admin-profile-title">My profile</h2></div><button type="button" onClick={close} aria-label="Close profile"><X size={23} /></button></header><div className={styles.profile}><span className={styles.largeAvatar}>{initials(account.displayName)}</span><div><strong>{account.displayName}</strong><small>{account.role}</small></div></div><dl className={styles.details}><div><dt><UserRound size={16} /> Login account</dt><dd>{account.username || "—"}</dd></div><div><dt><LockKeyhole size={16} /> Role</dt><dd>{account.role}</dd></div></dl><form onSubmit={changePassword}><div className={styles.formTitle}><KeyRound size={18} /><span>Change password</span></div><label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required /></label><label>New password <small>Minimum 8 characters</small><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label><label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>{notice && <p className={notice.includes("successfully") ? styles.success : styles.error}>{notice}</p>}<div className={styles.actions}><button type="button" onClick={close}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving…" : "Change password"}</button></div></form></section></div>}
  </>;
}
