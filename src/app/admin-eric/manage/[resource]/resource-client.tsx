"use client";

import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Edit3, ImageUp, Plus, Save, Trash2, X } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./manage.module.css";
import categoryImageStyles from "./category-image.module.css";
import categorySortStyles from "./category-sort.module.css";
import AdminAccountMenu from "@/components/admin-account-menu";
import { AdminNavigation } from "@/components/admin-sidebar";

type Field = { name: string; label: string; type?: "text" | "textarea" | "number" | "boolean" | "select"; options?: string[] };
type Resource = { label: string; fields: Field[]; list: string[] };
type Item = Record<string, unknown>;
type CategorySortField = "name" | "sort_order";
type SortDirection = "asc" | "desc";
const label = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ManageResource({ resourceKey }: { resourceKey: string }) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<Item | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [categoryPreview, setCategoryPreview] = useState("");
  const [categorySort, setCategorySort] = useState<{ field: CategorySortField; direction: SortDirection }>({ field: "sort_order", direction: "asc" });
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/admin/${resourceKey}`, { cache: "no-store" });
    if (response.status === 401) { router.push("/admin-eric"); return; }
    const data = await response.json(); setResource(data.resource); setItems(data.items); setLoading(false);
  }, [resourceKey, router]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return;
    const formData = new FormData(event.currentTarget); const payload: Record<string, unknown> = { id: editing.id };
    resource?.fields.forEach((field) => payload[field.name] = field.type === "boolean" ? formData.get(field.name) === "on" : formData.get(field.name) ?? "");
    const response = await fetch(`/api/admin/${resourceKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) { setMessage((await response.json()).error || "Save failed."); return; }
    setEditing(null); setMessage("Saved successfully."); load();
  }
  async function deleteItem(id: unknown) {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    const response = await fetch(`/api/admin/${resourceKey}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { setMessage("Delete failed."); return; }
    setMessage("Record deleted."); load();
  }
  async function uploadCategoryImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editing) return;
    const localPreview = URL.createObjectURL(file);
    setCategoryPreview(localPreview);
    setUploading(true); setMessage("");
    const body = new FormData(); body.append("files", file);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const result = await response.json() as { files?: { url: string }[]; error?: string };
      if (!response.ok || !result.files?.[0]) throw new Error(result.error || "Upload failed.");
      setEditing({ ...editing, cover_image: result.files[0].url });
    } catch (error) { URL.revokeObjectURL(localPreview); setCategoryPreview(""); setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); event.target.value = ""; }
  }
  const toggleCategorySort = (field: CategorySortField) => setCategorySort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  const displayedItems = resourceKey === "categories" ? [...items].sort((left, right) => {
    const comparison = categorySort.field === "sort_order"
      ? Number(left.sort_order || 0) - Number(right.sort_order || 0)
      : String(left.name || "").localeCompare(String(right.name || ""), undefined, { sensitivity: "base", numeric: true });
    return (comparison || Number(left.id || 0) - Number(right.id || 0)) * (categorySort.direction === "asc" ? 1 : -1);
  }) : items;
  if (loading || !resource) return <main className={styles.loading}>Loading {label(resourceKey)}…</main>;
  return <main className={styles.page}>
    <header className={styles.header}><AdminNavigation><Link href="/admin-eric/home"><ArrowLeft size={19} /> Dashboard</Link></AdminNavigation><AdminAccountMenu /></header>
    <div className={styles.content}><div className={styles.titleRow}><div><p>Administration</p><h1>{resource.label}</h1><small>{items.length} record{items.length === 1 ? "" : "s"}</small></div><button onClick={() => { setCategoryPreview(""); setEditing({}); }}><Plus size={19} /> Add {resource.label.replace(/s$/, "")}</button></div>
      {message && <p className={styles.message}>{message}</p>}
      <section className={styles.table}><div className={styles.tableHead}>{resource.list.map((column) => resourceKey === "categories" && (column === "name" || column === "sort_order") ? <button key={column} type="button" className={`${categorySortStyles.button} ${categorySort.field === column ? categorySortStyles.active : ""}`} onClick={() => toggleCategorySort(column)} aria-label={`Sort by ${label(column)}, ${categorySort.field === column && categorySort.direction === "asc" ? "descending" : "ascending"}`}><span>{label(column)}</span>{categorySort.field !== column ? <ArrowUpDown size={14} /> : categorySort.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</button> : <span key={column}>{label(column)}</span>)}<span>Actions</span></div>{displayedItems.map((item) => <div className={styles.row} key={String(item.id)}>{resource.list.map((column) => <span key={column}>{resourceKey === "categories" && column === "cover_image" ? (item[column] ? <img className={categoryImageStyles.tableImage} src={String(item[column])} alt={`${String(item.name || "Category")} cover`} /> : "No image") : typeof item[column] === "number" && (column === "is_active") ? (item[column] ? "Active" : "Inactive") : String(item[column] ?? "—")}</span>)}<span className={styles.actions}><button onClick={() => { setCategoryPreview(""); setEditing(item); }} aria-label="Edit"><Edit3 size={17} /></button><button onClick={() => deleteItem(item.id)} aria-label="Delete"><Trash2 size={17} /></button></span></div>)}{!items.length && <p className={styles.empty}>No records yet. Use the button above to add one.</p>}</section>
    </div>
    {editing && <div className={styles.overlay}><form className={styles.modal} onSubmit={save}><div className={styles.modalHeader}><h2>{editing.id ? "Edit" : "Add"} {resource.label.replace(/s$/, "")}</h2><button type="button" onClick={() => { setCategoryPreview(""); setEditing(null); }} aria-label="Close"><X /></button></div><div className={styles.formGrid}>{resource.fields.map((field) => resourceKey === "categories" && field.name === "cover_image" ? <div key={field.name} className={`${styles.full} ${categoryImageStyles.field}`}><span>Category image</span><input name="cover_image" type="hidden" value={String(editing.cover_image ?? "")} readOnly /><div className={categoryImageStyles.uploadRow}>{categoryPreview || editing.cover_image ? <img src={categoryPreview || String(editing.cover_image)} alt="Current category image" className={categoryImageStyles.preview} /> : <div className={categoryImageStyles.placeholder}>No image selected</div>}<label className={categoryImageStyles.uploadButton}><ImageUp size={18} /> {uploading ? "Uploading..." : "Upload image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadCategoryImage} disabled={uploading} /></label></div><small>JPG, PNG, WebP or GIF — up to 8 MB.</small></div> : <label key={field.name} className={field.type === "textarea" ? styles.full : ""}><span>{field.label}</span>{field.type === "textarea" ? <textarea name={field.name} defaultValue={String(editing[field.name] ?? "")} /> : field.type === "select" ? <select name={field.name} defaultValue={String(editing[field.name] ?? field.options?.[0] ?? "")} >{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : field.type === "boolean" ? <input type="checkbox" name={field.name} defaultChecked={Boolean(editing[field.name] ?? true)} /> : <input name={field.name} type={field.type === "number" ? "number" : field.name === "password" ? "password" : "text"} defaultValue={String(editing[field.name] ?? "")} required={field.name === "username" || field.name === "name" || field.name === "title"} />}</label>)}</div><div className={styles.modalFooter}><button type="button" className={styles.cancel} onClick={() => { setCategoryPreview(""); setEditing(null); }}>Cancel</button><button className={styles.save} type="submit"><Save size={18} /> Save changes</button></div></form></div>}
  </main>;
}
