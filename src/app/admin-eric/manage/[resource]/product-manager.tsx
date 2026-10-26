"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Copy, Edit3, ImagePlus, Plus, Save, Send, Trash2, Upload, X } from "lucide-react";
import { FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import styles from "./product-manager.module.css";
import featureStyles from "./product-feature.module.css";
import publishStyles from "./product-publish.module.css";
import tableStyles from "./product-table.module.css";
import videoUploadStyles from "./product-video-upload.module.css";
import AdminAccountMenu from "@/components/admin-account-menu";
import { AdminNavigation } from "@/components/admin-sidebar";
import MpegTsVideoPlayer from "@/components/mpeg-ts-video-player";
import ProductVideoPlayer from "@/components/product-video-player";

type Category = { id: number; name: string; slug: string };
type ImageRow = { image_url: string; alt_text: string };
type VideoRow = { video_url: string; title: string };
type PendingVideoPreview = { name: string; src: string; isTs: boolean };
type VideoUploadNotice = { kind: "success" | "error"; text: string };
type Option = { option_type: string; option_value: string; value_meta: string; images?: ImageRow[] };
type Specification = { spec_group: string; label: string; value: string };
type Product = { id: number; name: string; sku: string; category: string; category_id: number; short_description: string; description: string; cover_image: string; status: string; sort_order: number; images: ImageRow[]; videos: VideoRow[]; options: Option[]; specifications: Specification[] };
type SortField = "name" | "sku" | "category" | "sort_order" | "status";
type SortDirection = "asc" | "desc";
const emptyProduct = (): Partial<Product> => ({ status: "Draft", sort_order: 0, images: [], videos: [], options: [], specifications: [] });
const isFeature = (item: Specification) => item.spec_group.toLowerCase().includes("feature");
const isTsVideo = (src: string) => /\.ts(?:$|[?#])/i.test(src);

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState<"cover" | "gallery" | "color" | "video" | "">("");
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [pendingVideoPreviews, setPendingVideoPreviews] = useState<PendingVideoPreview[]>([]);
  const [videoUploadNotice, setVideoUploadNotice] = useState<VideoUploadNotice | null>(null);
  const [galleryAssetLabel, setGalleryAssetLabel] = useState("");
  const [videoAssetLabel, setVideoAssetLabel] = useState("product-demo");
  const [colorAssetLabels, setColorAssetLabels] = useState<Record<number, string>>({});
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({ field: "sort_order", direction: "asc" });
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const colorImageInputs = useRef(new Map<number, HTMLInputElement>());
  const videoInput = useRef<HTMLInputElement>(null);
  const pendingVideoUrls = useRef<string[]>([]);
  const load = useCallback(async () => { const response = await fetch("/api/admin/product-records", { cache: "no-store" }); const data = await response.json(); setProducts(data.products || []); setCategories(data.categories || []); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => () => pendingVideoUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  const updateProduct = (patch: Partial<Product>) => editing && setEditing({ ...editing, ...patch });
  const updateSpec = (index: number, patch: Partial<Specification>) => { if (!editing) return; const specifications = [...(editing.specifications || [])]; specifications[index] = { ...specifications[index], ...patch }; updateProduct({ specifications }); };
  const removeSpec = (index: number) => { if (!editing) return; updateProduct({ specifications: (editing.specifications || []).filter((_, itemIndex) => itemIndex !== index) }); };
  const addSpec = (feature: boolean) => updateProduct({ specifications: [...(editing?.specifications || []), { spec_group: feature ? "Key feature" : "Specification", label: feature ? "Key feature" : "", value: "" }] });
  const updateOption = (index: number, patch: Partial<Option>) => { if (!editing) return; const options = [...(editing.options || [])]; options[index] = { ...options[index], ...patch }; updateProduct({ options }); };
  const removeOption = (index: number) => updateProduct({ options: (editing?.options || []).filter((_, itemIndex) => itemIndex !== index) });
  const addOption = () => updateProduct({ options: [...(editing?.options || []), { option_type: "Color", option_value: "", value_meta: "" }] });
  const removeColorImage = (optionIndex: number, imageUrl: string) => {
    setEditing((current) => {
      if (!current) return current;
      const options = [...(current.options || [])]; const option = options[optionIndex];
      if (!option) return current;
      options[optionIndex] = { ...option, images: (option.images || []).filter((image) => image.image_url !== imageUrl) };
      return { ...current, options };
    });
    setMessage("Image removed from this color. Click Publish to save this change.");
  };
  const removeImage = (index: number) => updateProduct({ images: (editing?.images || []).filter((_, itemIndex) => itemIndex !== index) });
  const removeVideo = (index: number) => updateProduct({ videos: (editing?.videos || []).filter((_, itemIndex) => itemIndex !== index) });
  const toggleSort = (field: SortField) => setSort((current) => ({ field, direction: current.field === field && current.direction === "asc" ? "desc" : "asc" }));
  const sortedProducts = [...products].sort((left, right) => {
    const comparison = sort.field === "sort_order"
      ? Number(left.sort_order || 0) - Number(right.sort_order || 0)
      : String(left[sort.field] || "").localeCompare(String(right[sort.field] || ""), undefined, { sensitivity: "base", numeric: true });
    return (comparison || left.id - right.id) * (sort.direction === "asc" ? 1 : -1);
  });
  function copyProduct(product: Product) {
    const copy: Partial<Product> = { ...product };
    delete copy.id;
    setEditing({ ...copy, name: `${product.name} Copy`, sku: "", status: "Draft", sort_order: Number(product.sort_order || 0) + 1, images: product.images.map((item) => ({ ...item })), videos: product.videos.map((item) => ({ ...item })), options: product.options.map((item) => ({ ...item })), specifications: product.specifications.map((item) => ({ ...item })) });
    setMessage(`Copy of ${product.name} is ready to edit. Enter a new unique SKU before publishing.`);
  }
  async function uploadImages(files: FileList | null, target: "cover" | "gallery") {
    if (!files?.length || !editing) return;
    setUploading(target); setMessage("");
    try {
      const body = new FormData(); body.append("productSku", String(editing.sku || "product")); if (target === "gallery" && galleryAssetLabel.trim()) body.append("assetLabel", galleryAssetLabel); Array.from(files).forEach((file) => body.append("files", file));
      const response = await fetch("/api/admin/upload", { method: "POST", body }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      const uploaded = result.files as { url: string; name: string }[];
      if (target === "cover") updateProduct({ cover_image: uploaded[0].url });
      else updateProduct({ images: [...(editing.images || []), ...uploaded.map((file) => ({ image_url: file.url, alt_text: file.name }))] });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(""); if (target === "cover" && coverInput.current) coverInput.current.value = ""; if (target === "gallery" && galleryInput.current) galleryInput.current.value = ""; }
  }
  async function uploadColorImages(files: FileList | null, optionIndex: number) {
    if (!files?.length || !editing) return;
    setUploading("color"); setMessage("");
    try {
      const body = new FormData(); body.append("productSku", String(editing.sku || "product")); if (colorAssetLabels[optionIndex]?.trim()) body.append("assetLabel", colorAssetLabels[optionIndex]); Array.from(files).forEach((file) => body.append("files", file));
      const response = await fetch("/api/admin/upload", { method: "POST", body }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      const uploaded = (result.files as { url: string; name: string }[]).map((file) => ({ image_url: file.url, alt_text: file.name }));
      setEditing((current) => {
        if (!current) return current;
        const options = [...(current.options || [])]; const option = options[optionIndex];
        if (!option) return current;
        options[optionIndex] = { ...option, images: [...(option.images || []), ...uploaded] };
        return { ...current, images: [...(current.images || []), ...uploaded], options };
      });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(""); const input = colorImageInputs.current.get(optionIndex); if (input) input.value = ""; }
  }
  async function uploadVideos(files: FileList | null) {
    if (!files?.length || !editing) return;
    const currentVideos = editing.videos || [];
    if (currentVideos.length + files.length > 3) { setMessage("Each product can have up to 3 videos."); return; }
    setUploading("video"); setMessage(""); setVideoUploadNotice(null); setVideoUploadProgress(0);
    pendingVideoUrls.current = Array.from(files).map((file) => URL.createObjectURL(file));
    setPendingVideoPreviews(Array.from(files).map((file, index) => ({ name: file.name, src: pendingVideoUrls.current[index], isTs: file.name.toLowerCase().endsWith(".ts") })));
    try {
      const body = new FormData(); body.append("assetType", "video"); body.append("productSku", String(editing.sku || "product")); if (videoAssetLabel.trim()) body.append("assetLabel", videoAssetLabel); Array.from(files).forEach((file) => body.append("files", file));
      const response = await new Promise<{ ok: boolean; body: string }>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/admin/upload");
        request.upload.onprogress = (event) => { if (event.lengthComputable) setVideoUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100))); };
        request.onload = () => resolve({ ok: request.status >= 200 && request.status < 300, body: request.responseText });
        request.onerror = () => reject(new Error("Video upload failed due to a network error."));
        request.onabort = () => reject(new Error("Video upload was cancelled."));
        request.send(body);
      });
      const result = JSON.parse(response.body) as { error?: string; files?: { url: string; name: string }[] };
      if (!response.ok) throw new Error(result.error || "Video upload failed.");
      const uploaded = result.files || [];
      if (!uploaded.length) throw new Error("The server did not return an uploaded video. Please try again.");
      updateProduct({ videos: [...currentVideos, ...uploaded.map((file) => ({ video_url: file.url, title: file.name }))] });
      setVideoUploadNotice({ kind: "success", text: `${uploaded.length} video${uploaded.length === 1 ? "" : "s"} uploaded successfully. Preview below, then click Publish to show them on the public product page.` });
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Video upload failed.";
      setMessage(errorText);
      setVideoUploadNotice({ kind: "error", text: `Upload failed: ${errorText}` });
    }
    finally { pendingVideoUrls.current.forEach((url) => URL.revokeObjectURL(url)); pendingVideoUrls.current = []; setPendingVideoPreviews([]); setVideoUploadProgress(null); setUploading(""); if (videoInput.current) videoInput.current.value = ""; }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return;
    const data = new FormData(event.currentTarget);
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value === "Draft" ? "Draft" : "Published";
    const payload = { ...editing, name: data.get("name"), sku: data.get("sku"), category_id: data.get("category_id"), short_description: data.get("short_description"), description: data.get("description"), status, sort_order: data.get("sort_order") };
    const sku = String(payload.sku || "").trim();
    if (products.some((product) => product.id !== editing.id && product.sku.trim().toLowerCase() === sku.toLowerCase())) { setMessage("SKU must be unique. Choose a different SKU before saving."); return; }
    const response = await fetch("/api/admin/product-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json();
    if (!response.ok) { setMessage(result.error || "Save failed."); return; }
    setEditing(null); setMessage(status === "Published" ? "Product published. The URL slug was generated automatically." : "Product saved as a draft. It is not visible on the public website."); void load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this product and all of its detail information?")) return;
    setDeletingId(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/product-records", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Delete failed.");
      setProducts((current) => current.filter((product) => product.id !== id));
      setMessage("Product deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }
  return <main className={styles.page}>
    <header className={styles.header}><AdminNavigation><Link href="/admin-eric/home"><ArrowLeft size={18} /> Dashboard</Link></AdminNavigation><AdminAccountMenu /></header>
    <div className={styles.content}><div className={styles.title}><div><p>Administration</p><h1>Products</h1><small>{products.length} products</small></div><button onClick={() => setEditing(emptyProduct())}><Plus size={19} /> Add product</button></div>{message && <p className={styles.message}>{message}</p>}
      <section className={styles.table}>
        <div className={`${styles.head} ${tableStyles.head}`}>
          <SortHeader label="Product" field="name" sort={sort} onSort={toggleSort} />
          <SortHeader label="SKU" field="sku" sort={sort} onSort={toggleSort} />
          <SortHeader label="Category" field="category" sort={sort} onSort={toggleSort} />
          <SortHeader label="Sort Order" field="sort_order" sort={sort} onSort={toggleSort} />
          <SortHeader label="Status" field="status" sort={sort} onSort={toggleSort} />
          <span>Actions</span>
        </div>
        {sortedProducts.map((product) => <div className={`${styles.row} ${tableStyles.row}`} key={product.id}>
          <b>{product.name}</b><span>{product.sku}</span><span>{product.category}</span><span>{product.sort_order}</span><span className={product.status === "Published" ? styles.published : styles.draft}>{product.status}</span>
          <span><button className={tableStyles.copy} onClick={() => copyProduct(product)} aria-label={`Copy ${product.name}`} title="Copy product"><Copy size={16} /> Copy</button><button onClick={() => setEditing(product)} aria-label={`Edit ${product.name}`} title="Edit product"><Edit3 size={17} /></button><button onClick={() => void remove(product.id)} disabled={deletingId === product.id} aria-label={`Delete ${product.name}`} title="Delete product">{deletingId === product.id ? "Deleting…" : <Trash2 size={17} />}</button></span>
        </div>)}
      </section>
    </div>
    {editing && <div className={styles.overlay}><form className={styles.modal} onSubmit={save}>
      <div className={styles.modalHeader}><div><p>Product publishing</p><h2>{editing.id ? "Edit product" : "Add product"}</h2></div><button type="button" onClick={() => setEditing(null)} aria-label="Close"><X /></button></div>
      <section className={styles.section}><h3>Core information</h3><div className={styles.grid}>
        <Field label="Product name" name="name" value={editing.name} required /><Field label="SKU" name="sku" value={editing.sku} required />
        <label><span>Category</span><select name="category_id" defaultValue={editing.category_id || ""} required><option value="" disabled>Select an existing category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <Field label="Short description" name="short_description" value={editing.short_description} full /><Field label="Full product overview" name="description" value={editing.description} full textarea />
        <div className={`${styles.uploadArea} ${styles.full}`}><span>Cover image</span><div><input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(event) => void uploadImages(event.target.files, "cover")} /><button type="button" onClick={() => coverInput.current?.click()} disabled={uploading === "cover"}><Upload size={16} /> {uploading === "cover" ? "Uploading…" : "Upload cover image"}</button>{editing.cover_image && <Image src={editing.cover_image} alt="Current cover" width={70} height={54} />}</div></div>
        <Field label="Sort order" name="sort_order" value={editing.sort_order} type="number" />
      </div></section>
      <RepeatSection title="Product videos" button={uploading === "video" ? "Uploading…" : "Upload videos"} onAdd={() => videoInput.current?.click()} disabled={uploading === "video" || (editing.videos || []).length >= 3}>
        <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/mp2t,.ts" multiple hidden onChange={(event) => void uploadVideos(event.target.files)} />
        <p>Upload up to 3 MP4, WebM, or TS videos. Each video opens in the product-page player.</p><label className={styles.assetKeyword}>Feature keyword for filename <input value={videoAssetLabel} onChange={(event) => setVideoAssetLabel(event.target.value)} placeholder="e.g. product-demo" /></label>
        {videoUploadProgress !== null ? <div className={videoUploadStyles.progressWrap}><div className={videoUploadStyles.progressText}><span>{videoUploadProgress === 100 ? "Preparing playback and thumbnail…" : "Uploading videos…"}</span><strong>{videoUploadProgress}%</strong></div><div className={videoUploadStyles.progressTrack} role="progressbar" aria-label="Video upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={videoUploadProgress}><span style={{ width: `${videoUploadProgress}%` }} /></div></div> : null}
        {videoUploadNotice ? <p className={videoUploadNotice.kind === "success" ? videoUploadStyles.successNotice : videoUploadStyles.errorNotice} role={videoUploadNotice.kind === "success" ? "status" : "alert"}>{videoUploadNotice.text}</p> : null}
        {pendingVideoPreviews.length > 0 ? <div className={videoUploadStyles.pendingGrid} aria-label="Selected video previews">{pendingVideoPreviews.map((preview, index) => <div className={videoUploadStyles.pendingCard} key={`${preview.name}-${index}`}>{preview.isTs ? <MpegTsVideoPlayer src={preview.src} autoPlay={false} muted /> : <video src={preview.src} controls muted playsInline preload="auto" />}<span title={preview.name}>{preview.name}</span></div>)}</div> : null}
        {(editing.videos || []).map((item, index) => <div className={videoUploadStyles.savedRow} key={`${item.video_url}-${index}`}>
          <div className={videoUploadStyles.savedPreview}>{isTsVideo(item.video_url) ? <MpegTsVideoPlayer src={item.video_url} autoPlay={false} muted /> : <ProductVideoPlayer key={item.video_url} src={item.video_url} />}</div>
          <div className={videoUploadStyles.savedDetails}><input value={item.title} onChange={(event) => { const videos = [...(editing.videos || [])]; videos[index] = { ...videos[index], title: event.target.value }; updateProduct({ videos }); }} placeholder="Video title" /><small>Uploaded · Preview before publishing</small></div>
          <button type="button" onClick={() => removeVideo(index)} aria-label={`Remove ${item.title || "video"}`}><Trash2 size={16} /></button>
        </div>)}
      </RepeatSection>
      <RepeatSection title="Product gallery" button={uploading === "gallery" ? "Uploading…" : "Upload gallery images"} onAdd={() => galleryInput.current?.click()} disabled={uploading === "gallery"}><input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(event) => void uploadImages(event.target.files, "gallery")} /><p>Upload all color-specific images here, then assign each image to its color below.</p><label className={styles.assetKeyword}>Feature keyword for filename <input value={galleryAssetLabel} onChange={(event) => setGalleryAssetLabel(event.target.value)} placeholder="e.g. temperature-display" /></label>{(editing.images || []).map((item, index) => <div className={styles.galleryRow} key={`${item.image_url}-${index}`}><Image src={item.image_url} alt="" width={72} height={56} /><input value={item.alt_text} onChange={(event) => { const images = [...(editing.images || [])]; images[index] = { ...images[index], alt_text: event.target.value }; updateProduct({ images }); }} placeholder="Alt text" /><button type="button" onClick={() => removeImage(index)}><Trash2 size={16} /></button></div>)}</RepeatSection>
      <RepeatSection title="Key features" button="Add key feature" onAdd={() => addSpec(true)}><p>Each key feature is shown as a checked selling point beside the product title.</p>{(editing.specifications || []).map((item, index) => isFeature(item) ? <div className={featureStyles.row} key={index}><input value={item.value} onChange={(event) => updateSpec(index, { value: event.target.value, label: "Key feature" })} placeholder="e.g. Comfortable adjustable height" /><button type="button" onClick={() => removeSpec(index)}><Trash2 size={16} /></button></div> : null)}</RepeatSection>
      <RepeatSection title="Specifications" button="Add specification" onAdd={() => addSpec(false)}><p>These fields appear in the Specifications tab on the product detail page.</p>{(editing.specifications || []).map((item, index) => !isFeature(item) ? <div className={styles.repeatRow} key={index}><input value={item.label} onChange={(event) => updateSpec(index, { label: event.target.value })} placeholder="e.g. Material" /><input value={item.value} onChange={(event) => updateSpec(index, { value: event.target.value })} placeholder="e.g. Durable, non-toxic plastic" /><button type="button" onClick={() => removeSpec(index)}><Trash2 size={16} /></button></div> : null)}</RepeatSection>
      <RepeatSection title="Color and size options" button="Add option" onAdd={addOption}><p>Add every selectable color and size shown on the product detail page. Upload the images that should appear after the buyer clicks each color.</p>{(editing.options || []).map((item, index) => <div className={styles.optionGroup} key={index}><div className={styles.repeatRow}><select value={item.option_type} onChange={(event) => updateOption(index, { option_type: event.target.value, images: event.target.value === "Color" ? item.images || [] : [] })}><option>Color</option><option>Size</option></select><input value={item.option_value} onChange={(event) => updateOption(index, { option_value: event.target.value })} placeholder="Cloud White / Standard 36 cm" /><input value={item.value_meta} onChange={(event) => updateOption(index, { value_meta: event.target.value })} placeholder="Color code (optional)" /><button type="button" onClick={() => removeOption(index)}><Trash2 size={16} /></button></div>{item.option_type === "Color" && <div className={styles.colorImagePicker}><div className={styles.colorImageHead}><b>{item.option_value || "This color"} images</b><input ref={(node) => { if (node) colorImageInputs.current.set(index, node); else colorImageInputs.current.delete(index); }} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(event) => void uploadColorImages(event.target.files, index)} /><button type="button" onClick={() => colorImageInputs.current.get(index)?.click()} disabled={uploading === "color"}><Upload size={14} /> {uploading === "color" ? "Uploading…" : "Upload images"}</button></div><label className={styles.assetKeyword}>Feature keyword for filename <input value={colorAssetLabels[index] || ""} onChange={(event) => setColorAssetLabels((current) => ({ ...current, [index]: event.target.value }))} placeholder={`e.g. ${(item.option_value || "color").toLowerCase()}-detail`} /></label>{(item.images || []).length ? <div className={styles.colorImageGrid}>{(item.images || []).map((image, imageIndex) => <div key={`${image.image_url}-${imageIndex}`} className={styles.colorImageCard}><Image src={image.image_url} alt="" width={68} height={52} /><span>{image.alt_text || `Image ${imageIndex + 1}`}</span><button type="button" className={styles.removeColorImage} onClick={() => removeColorImage(index, image.image_url)} aria-label={`Remove ${image.alt_text || `image ${imageIndex + 1}`} from ${item.option_value || "this color"}`} title="Remove from this color only"><Trash2 size={13} /></button></div>)}</div> : <small>No images for this color yet. Upload images here to add them.</small>}<small className={styles.colorImageHint}>The red trash button only removes the image from this color. It does not affect other colors or Product gallery.</small></div>}</div>)}</RepeatSection>
      <div className={styles.footer}><button type="button" onClick={() => setEditing(null)}>Cancel</button><button className={publishStyles.draft} type="submit" value="Draft"><Save size={18} /> Save as draft</button><button className={styles.save} type="submit" value="Published"><Send size={18} /> Publish</button></div>
    </form></div>}
  </main>;
}

function Field({ label, name, value, required, full, textarea, type }: { label: string; name: string; value?: string | number; required?: boolean; full?: boolean; textarea?: boolean; type?: string }) { return <label className={full ? styles.full : ""}><span>{label}</span>{textarea ? <textarea name={name} defaultValue={String(value || "")} /> : <input name={name} type={type || "text"} defaultValue={String(value ?? "")} required={required} />}</label>; }
function RepeatSection({ title, button, onAdd, disabled, children }: { title: string; button: string; onAdd: () => void; disabled?: boolean; children: ReactNode }) { return <section className={styles.section}><div className={styles.sectionHead}><h3>{title}</h3><button type="button" onClick={onAdd} disabled={disabled}><ImagePlus size={16} /> {button}</button></div>{children}</section>; }
function SortHeader({ label, field, sort, onSort }: { label: string; field: SortField; sort: { field: SortField; direction: SortDirection }; onSort: (field: SortField) => void }) {
  const active = sort.field === field;
  return <button type="button" className={`${tableStyles.sortHeader} ${active ? tableStyles.sortActive : ""}`} onClick={() => onSort(field)} aria-label={`Sort by ${label}, ${active && sort.direction === "asc" ? "descending" : "ascending"}`}><span>{label}</span>{!active ? <ArrowUpDown size={14} /> : sort.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}</button>;
}
