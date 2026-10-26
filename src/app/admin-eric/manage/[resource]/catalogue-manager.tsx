"use client";

import { ExternalLink, FileText, FileUp, Trash2 } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminAccountMenu from "@/components/admin-account-menu";
import { AdminNavigation } from "@/components/admin-sidebar";
import styles from "./catalogue-manager.module.css";

type CatalogueFile = { id: number; title: string; original_name: string; file_url: string; file_size: number; is_active: number; updated_at: string };

function fileSize(bytes: number) { return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`; }

export default function CatalogueManager() {
  const [files, setFiles] = useState<CatalogueFile[]>([]);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/catalogues", { cache: "no-store" });
    if (response.status === 401) { router.push("/admin-eric"); return; }
    const data = await response.json() as { files?: CatalogueFile[] };
    setFiles(data.files || []); setLoading(false);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialCatalogues() {
      try {
        const response = await fetch("/api/admin/catalogues", { cache: "no-store" });
        if (response.status === 401) { router.push("/admin-eric"); return; }
        const data = await response.json() as { files?: CatalogueFile[] };
        if (!cancelled) setFiles(data.files || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialCatalogues();
    return () => { cancelled = true; };
  }, [router]);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(event.target.files?.[0] || null);
    setMessage("");
  }

  async function upload() {
    if (!selectedFile) { setMessage("Choose a PDF catalogue first."); return; }
    setUploading(true); setMessage("");
    const body = new FormData(); body.append("file", selectedFile); body.append("title", title);
    try {
      const response = await fetch("/api/admin/catalogues", { method: "POST", body });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setTitle(""); setSelectedFile(null); setMessage("Catalogue uploaded and set as the live download."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this catalogue? It will no longer be downloadable.")) return;
    const response = await fetch("/api/admin/catalogues", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setMessage(data.error || "Delete failed."); return; }
    setMessage("Catalogue deleted."); await load();
  }

  if (loading) return <main className={styles.loading}>Loading catalogues…</main>;
  return <main className={styles.page}>
    <header className={styles.header}><AdminNavigation><Link href="/admin-eric/home">← Dashboard</Link></AdminNavigation><AdminAccountMenu /></header>
    <div className={styles.content}>
      <div className={styles.title}><div><p>Administration</p><h1>Product Catalogues</h1><span>Upload a PDF to make it the live website download.</span></div></div>
      <section className={styles.uploadCard}>
        <div className={styles.uploadIntro}><FileUp size={30} /><div><h2>Upload product catalogue</h2><p>A new PDF automatically replaces the current public download. PDF only, up to 50 MB.</p></div></div>
        <div className={styles.form}><label><span>Catalogue title <i>optional</i></span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. 2026 Baby Bath Collection" /></label><label><span>PDF file</span><input type="file" accept="application/pdf,.pdf" onChange={chooseFile} /></label><button type="button" onClick={upload} disabled={uploading}>{uploading ? "Uploading…" : "Upload & publish"}</button></div>
        {selectedFile && <p className={styles.selection}><FileText size={16} /> {selectedFile.name} · {fileSize(selectedFile.size)}</p>}
        {message && <p className={styles.message}>{message}</p>}
      </section>
      <section className={styles.files}><div className={styles.sectionHead}><h2>Uploaded catalogues</h2><span>{files.length} file{files.length === 1 ? "" : "s"}</span></div>
        {!files.length ? <div className={styles.empty}>No catalogue has been uploaded yet.</div> : files.map((file) => <article className={styles.file} key={file.id}><div className={styles.fileIcon}><FileText size={24} /></div><div className={styles.fileInfo}><div><h3>{file.title}</h3>{Boolean(file.is_active) && <b>Live download</b>}</div><p>{file.original_name} · {fileSize(file.file_size)} · Updated {new Date(file.updated_at).toLocaleDateString()}</p></div><div className={styles.actions}><a href={file.file_url} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Preview</a><button type="button" onClick={() => remove(file.id)}><Trash2 size={17} /> Delete</button></div></article>)}</section>
    </div>
  </main>;
}
