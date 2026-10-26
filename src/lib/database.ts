import "server-only";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { cookies } from "next/headers";

import { dataDirectory, initializeDatabaseFile } from "./storage";
import { seedCatalogue } from "./catalogue-seed";
const databasePath = path.join(dataDirectory, "baby-bath.db");

export type Field = { name: string; label: string; type?: "text" | "textarea" | "number" | "boolean" | "select"; options?: string[] };
type Resource = { table: string; label: string; fields: Field[]; list: string[] };

export const resources: Record<string, Resource> = {
  catalogues: { table: "catalogues", label: "Catalogues", list: ["title", "original_name", "file_size", "is_active", "updated_at"], fields: [] },
  products: { table: "products", label: "Products", list: ["name", "sku", "category", "status", "updated_at"], fields: [{ name: "name", label: "Product name" }, { name: "slug", label: "URL slug" }, { name: "sku", label: "SKU" }, { name: "category", label: "Category" }, { name: "short_description", label: "Short description", type: "textarea" }, { name: "cover_image", label: "Cover image URL" }, { name: "status", label: "Publishing status", type: "select", options: ["Draft", "Published"] }, { name: "sort_order", label: "Sort order", type: "number" }] },
  productImages: { table: "product_images", label: "Product images", list: ["product_id", "image_url", "alt_text", "sort_order"], fields: [{ name: "product_id", label: "Product ID", type: "number" }, { name: "image_url", label: "Image URL" }, { name: "alt_text", label: "Alt text" }, { name: "sort_order", label: "Sort order", type: "number" }] },
  productOptions: { table: "product_options", label: "Product options", list: ["product_id", "option_type", "option_value", "sort_order"], fields: [{ name: "product_id", label: "Product ID", type: "number" }, { name: "option_type", label: "Option type", type: "select", options: ["Color", "Size"] }, { name: "option_value", label: "Option value" }, { name: "value_meta", label: "Color code / extra data" }, { name: "sort_order", label: "Sort order", type: "number" }] },
  productSpecifications: { table: "product_specifications", label: "Product specifications", list: ["product_id", "spec_group", "label", "value"], fields: [{ name: "product_id", label: "Product ID", type: "number" }, { name: "spec_group", label: "Specification group" }, { name: "label", label: "Label" }, { name: "value", label: "Value", type: "textarea" }, { name: "sort_order", label: "Sort order", type: "number" }] },
  categories: { table: "categories", label: "Product categories", list: ["cover_image", "name", "slug", "sort_order", "is_active"], fields: [{ name: "name", label: "Category name" }, { name: "slug", label: "URL slug" }, { name: "description", label: "Description", type: "textarea" }, { name: "cover_image", label: "Category image" }, { name: "sort_order", label: "Sort order", type: "number" }, { name: "is_active", label: "Active", type: "boolean" }] },
  users: { table: "admin_users", label: "Admin users", list: ["username", "display_name", "role", "is_active", "created_at"], fields: [{ name: "username", label: "Login name" }, { name: "password", label: "Password" }, { name: "display_name", label: "Display name" }, { name: "role", label: "Role", type: "select", options: ["Administrator", "Editor"] }, { name: "is_active", label: "Active", type: "boolean" }] },
  inquiries: { table: "inquiries", label: "Inquiries", list: ["company", "contact_name", "email", "status", "created_at"], fields: [{ name: "company", label: "Company" }, { name: "contact_name", label: "Contact name" }, { name: "email", label: "Email" }, { name: "phone", label: "Phone" }, { name: "message", label: "Message", type: "textarea" }, { name: "status", label: "Status", type: "select", options: ["New", "In Review", "Replied", "Closed"] }] },
  pages: { table: "pages", label: "Page content", list: ["title", "slug", "status", "updated_at"], fields: [{ name: "title", label: "Page title" }, { name: "slug", label: "URL slug" }, { name: "content", label: "Content", type: "textarea" }, { name: "status", label: "Status", type: "select", options: ["Draft", "Published"] }] },
  navigation: { table: "navigation_items", label: "Navigation", list: ["label", "url", "sort_order", "is_active"], fields: [{ name: "label", label: "Label" }, { name: "url", label: "URL" }, { name: "sort_order", label: "Sort order", type: "number" }, { name: "is_active", label: "Active", type: "boolean" }] },
  footerLinks: { table: "footer_links", label: "Footer links", list: ["group_name", "label", "url", "sort_order"], fields: [{ name: "group_name", label: "Link group" }, { name: "label", label: "Label" }, { name: "url", label: "URL" }, { name: "sort_order", label: "Sort order", type: "number" }] },
  socialLinks: { table: "social_links", label: "Social links", list: ["platform", "url", "sort_order", "created_at"], fields: [{ name: "platform", label: "Platform" }, { name: "url", label: "URL" }, { name: "sort_order", label: "Sort order", type: "number" }] },
  settings: { table: "site_settings", label: "Website settings", list: ["site_name", "email", "phone", "updated_at"], fields: [{ name: "site_name", label: "Website name" }, { name: "email", label: "Contact email" }, { name: "sales_emails", label: "Sales emails (one per line)", type: "textarea" }, { name: "phone", label: "Phone" }, { name: "address", label: "Address", type: "textarea" }, { name: "response_time", label: "Response time" }] },
};

function now() { return new Date().toISOString(); }
function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) { return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`; }
function verifyPassword(password: string, stored: string) { const [salt, key] = stored.split(":"); return Boolean(salt && key) && crypto.timingSafeEqual(Buffer.from(key, "hex"), crypto.scryptSync(password, salt, 64)); }

export function db() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  initializeDatabaseFile(databasePath);
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Administrator', is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS admin_login_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, username TEXT NOT NULL, status TEXT NOT NULL, logged_in_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES admin_users(id) ON DELETE SET NULL);
    CREATE INDEX IF NOT EXISTS admin_login_logs_logged_in_at_idx ON admin_login_logs(logged_in_at);
    CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT DEFAULT '', cover_image TEXT DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, sku TEXT UNIQUE NOT NULL, category TEXT DEFAULT '', category_id INTEGER, short_description TEXT DEFAULT '', description TEXT DEFAULT '', cover_image TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'Draft', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL);
    CREATE TABLE IF NOT EXISTS product_images (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, image_url TEXT NOT NULL, alt_text TEXT DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS product_videos (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, video_url TEXT NOT NULL, title TEXT DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS product_options (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, option_type TEXT NOT NULL, option_value TEXT NOT NULL, value_meta TEXT DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS product_color_images (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, color_value TEXT NOT NULL, image_url TEXT NOT NULL, alt_text TEXT DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, UNIQUE(product_id,color_value,image_url), FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
    CREATE INDEX IF NOT EXISTS product_color_images_product_color_idx ON product_color_images(product_id,color_value,sort_order,id);
    CREATE TABLE IF NOT EXISTS product_specifications (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, spec_group TEXT DEFAULT 'Specification', label TEXT NOT NULL, value TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT DEFAULT '', contact_name TEXT DEFAULT '', email TEXT DEFAULT '', phone TEXT DEFAULT '', inquiry_type TEXT DEFAULT '', quantity TEXT DEFAULT '', market TEXT DEFAULT '', message TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'New', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT DEFAULT NULL);
    CREATE TABLE IF NOT EXISTS pages (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, content TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'Draft', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS navigation_items (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT NOT NULL, url TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS footer_links (id INTEGER PRIMARY KEY AUTOINCREMENT, group_name TEXT NOT NULL, label TEXT NOT NULL, url TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS social_links (id INTEGER PRIMARY KEY AUTOINCREMENT, platform TEXT NOT NULL, url TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, site_name TEXT NOT NULL, email TEXT DEFAULT '', sales_emails TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '', response_time TEXT DEFAULT '', updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS analytics_page_views (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, path TEXT NOT NULL, referrer TEXT DEFAULT '', search_term TEXT DEFAULT '', duration_seconds INTEGER NOT NULL DEFAULT 0, viewed_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS analytics_page_views_viewed_at_idx ON analytics_page_views(viewed_at);
    CREATE INDEX IF NOT EXISTS analytics_page_views_session_idx ON analytics_page_views(session_id);
    CREATE TABLE IF NOT EXISTS catalogues (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, original_name TEXT NOT NULL, file_url TEXT NOT NULL UNIQUE, file_size INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS catalogues_active_idx ON catalogues(is_active,updated_at DESC,id DESC);
    CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  const inquiryColumns = database.prepare("PRAGMA table_info(inquiries)").all() as { name: string }[];
  ["inquiry_type", "quantity", "market"].forEach((column) => { if (!inquiryColumns.some((item) => item.name === column)) database.exec(`ALTER TABLE inquiries ADD COLUMN ${column} TEXT DEFAULT ''`); });
  if (!inquiryColumns.some((item) => item.name === "deleted_at")) database.exec("ALTER TABLE inquiries ADD COLUMN deleted_at TEXT DEFAULT NULL");
  const settingsColumns = database.prepare("PRAGMA table_info(site_settings)").all() as { name: string }[];
  if (!settingsColumns.some((item) => item.name === "sales_emails")) database.exec("ALTER TABLE site_settings ADD COLUMN sales_emails TEXT DEFAULT ''");
  const seeded = database.prepare("SELECT value FROM app_metadata WHERE key='initial_seed_complete'").get() as { value?: string } | undefined;
  if (!seeded) {
    const hasExistingData = database.prepare("SELECT EXISTS(SELECT 1 FROM admin_users UNION ALL SELECT 1 FROM categories UNION ALL SELECT 1 FROM products UNION ALL SELECT 1 FROM site_settings) AS value").get() as { value: number };
    if (!hasExistingData.value) seed(database);
    database.prepare("INSERT INTO app_metadata (key,value) VALUES ('initial_seed_complete',?)").run(now());
  }
  migrateProductCategories(database);
  migrateLegacyInquiries(database);
  return database;
}

function migrateLegacyInquiries(database: DatabaseSync) {
  const rows = database.prepare("SELECT id,message,inquiry_type,quantity,market FROM inquiries WHERE inquiry_type='' AND quantity='' AND market='' AND message LIKE '%Inquiry type:%'").all() as { id: number; message: string; inquiry_type: string; quantity: string; market: string }[];
  rows.forEach((row) => {
    const parts = row.message.split("\n\n");
    const find = (prefix: string) => parts.find((part) => part.startsWith(prefix))?.slice(prefix.length).trim() || "";
    const plainMessage = parts.filter((part) => !/^(Inquiry type:|Estimated order quantity:|Target market \/ country:)/.test(part)).join("\n\n").trim();
    database.prepare("UPDATE inquiries SET message=?,inquiry_type=?,quantity=?,market=? WHERE id=?").run(plainMessage, find("Inquiry type:"), find("Estimated order quantity:"), find("Target market / country:"), row.id);
  });
}

function normalizeCategory(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function migrateProductCategories(database: DatabaseSync) {
  const columns = database.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  if (!columns.some((column) => column.name === "category_id")) database.exec("ALTER TABLE products ADD COLUMN category_id INTEGER");
  const categories = database.prepare("SELECT id,name,slug FROM categories").all() as { id: number; name: string; slug: string }[];
  const products = database.prepare("SELECT id,category FROM products WHERE category_id IS NULL OR category_id=0").all() as { id: number; category: string }[];
  products.forEach((product) => {
    const current = normalizeCategory(product.category);
    const category = categories.find((item) => {
      const name = normalizeCategory(item.name);
      const slug = normalizeCategory(item.slug);
      return name === current || slug === current || name.endsWith(current) || current.endsWith(slug);
    });
    if (category) database.prepare("UPDATE products SET category_id=?,category=? WHERE id=?").run(category.id, category.name, product.id);
  });
}

function seed(database: DatabaseSync) {
  seedCatalogue(database);
  if (process.env.ADMIN_INITIAL_PASSWORD) {
    const timestamp = now();
    database.prepare("INSERT INTO admin_users (username,password_hash,display_name,role,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
      .run("admineric", hashPassword(process.env.ADMIN_INITIAL_PASSWORD), "Eric", "Administrator", 1, timestamp, timestamp);
  }
}

export function list(resourceKey: string) { const resource = resources[resourceKey]; if (!resource) throw new Error("Unknown resource"); return db().prepare(`SELECT * FROM ${resource.table}${resourceKey === "inquiries" ? " WHERE deleted_at IS NULL" : ""} ORDER BY id DESC`).all() as Record<string, unknown>[]; }
export function getResource(resourceKey: string) { const resource = resources[resourceKey]; if (!resource) throw new Error("Unknown resource"); return resource; }
export function save(resourceKey: string, raw: Record<string, unknown>) {
  const resource = getResource(resourceKey); const database = db(); const id = Number(raw.id || 0); const values: Record<string, unknown> = {};
  resource.fields.forEach((field) => { if (field.name === "password") return; const value = raw[field.name]; values[field.name] = field.type === "boolean" ? (value ? 1 : 0) : (value ?? ""); });
  if (resourceKey === "users" && raw.password) values.password_hash = hashPassword(String(raw.password));
  const timestamp = now(); values.updated_at = timestamp;
  if (!id) { values.created_at = timestamp; const columns = Object.keys(values); const result = database.prepare(`INSERT INTO ${resource.table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`).run(...columns.map((column) => values[column])); return { id: Number(result.lastInsertRowid) }; }
  const columns = Object.keys(values); database.prepare(`UPDATE ${resource.table} SET ${columns.map((column) => `${column}=?`).join(",")} WHERE id=?`).run(...columns.map((column) => values[column]), id);
  if (resourceKey === "categories") database.prepare("UPDATE products SET category=?,updated_at=? WHERE category_id=?").run(String(values.name || ""), timestamp, id);
  return { id };
}
export function remove(resourceKey: string, id: number) { const resource = getResource(resourceKey); db().prepare(`DELETE FROM ${resource.table} WHERE id=?`).run(id); }
export function listInquiries(view: "active" | "trash" = "active") { const database = db(); const isTrash = view === "trash"; const items = database.prepare(`SELECT * FROM inquiries WHERE deleted_at IS ${isTrash ? "NOT " : ""}NULL ORDER BY ${isTrash ? "deleted_at" : "created_at"} DESC,id DESC`).all() as Record<string, unknown>[]; const active = database.prepare("SELECT COUNT(*) AS count FROM inquiries WHERE deleted_at IS NULL").get() as { count: number }; const trash = database.prepare("SELECT COUNT(*) AS count FROM inquiries WHERE deleted_at IS NOT NULL").get() as { count: number }; return { items, activeCount: Number(active.count), trashCount: Number(trash.count) }; }
export function trashInquiry(id: number) { db().prepare("UPDATE inquiries SET deleted_at=?,updated_at=? WHERE id=? AND deleted_at IS NULL").run(now(), now(), id); }
export function restoreInquiry(id: number) { db().prepare("UPDATE inquiries SET deleted_at=NULL,updated_at=? WHERE id=? AND deleted_at IS NOT NULL").run(now(), id); }
export function permanentlyDeleteInquiry(id: number) { db().prepare("DELETE FROM inquiries WHERE id=? AND deleted_at IS NOT NULL").run(id); }
export function publishedProducts() { return db().prepare("SELECT p.id,p.name,p.slug,p.sku,c.name AS category,p.category_id,c.slug AS category_source_slug,p.short_description,p.cover_image FROM products p INNER JOIN categories c ON c.id=p.category_id AND c.is_active=1 WHERE p.status='Published' ORDER BY p.sort_order,p.id").all() as Record<string, unknown>[]; }
export function publishedCatalogue() {
  const categories = (db().prepare("SELECT name,slug,cover_image FROM categories WHERE is_active=1 ORDER BY sort_order,id").all() as { name: string; slug: string; cover_image: string }[]).map((category) => ({
    ...category,
    slug: normalizeCategory(category.slug),
    cover_image: String(category.cover_image || ""),
  }));
  const products = publishedProducts().map((product) => {
    const normalizedCategory = normalizeCategory(String(product.category ?? ""));
    const matched = categories.find((category) => category.slug === String(product.category_source_slug || "") || normalizeCategory(category.name) === normalizedCategory || category.slug === normalizedCategory || category.slug.endsWith(normalizedCategory) || normalizedCategory.endsWith(category.slug));
    const firstGalleryImage = db().prepare("SELECT image_url FROM product_images WHERE product_id=? ORDER BY sort_order,id LIMIT 1").get(product.id) as { image_url?: string } | undefined;
    return { ...product, cover_image: String(product.cover_image || firstGalleryImage?.image_url || ""), category_slug: matched?.slug ?? normalizedCategory };
  });
  return { categories, products, catalogue: activeCatalogue() };
}

export type CatalogueFile = { id: number; title: string; original_name: string; file_url: string; file_size: number; is_active: number; created_at: string; updated_at: string };

const catalogueFolder = path.join(process.cwd(), "public", "uploads", "catalogues");
const initialCatalogueUrl = "/uploads/catalogues/babybath-products_en.pdf";

function seedInitialCatalogue(database: DatabaseSync) {
  const existing = database.prepare("SELECT id FROM catalogues LIMIT 1").get() as { id?: number } | undefined;
  if (existing || !fs.existsSync(path.join(catalogueFolder, "babybath-products_en.pdf"))) return;
  const timestamp = now();
  const fileSize = fs.statSync(path.join(catalogueFolder, "babybath-products_en.pdf")).size;
  database.prepare("INSERT INTO catalogues (title,original_name,file_url,file_size,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run("Baby Bath Product Catalogue", "babybath-products_en.pdf", initialCatalogueUrl, fileSize, 1, timestamp, timestamp);
}

export function catalogueFiles() {
  const database = db();
  seedInitialCatalogue(database);
  return database.prepare("SELECT id,title,original_name,file_url,file_size,is_active,created_at,updated_at FROM catalogues ORDER BY is_active DESC,updated_at DESC,id DESC").all() as CatalogueFile[];
}

export function activeCatalogue() {
  const database = db();
  seedInitialCatalogue(database);
  return database.prepare("SELECT id,title,original_name,file_url,file_size,is_active,created_at,updated_at FROM catalogues WHERE is_active=1 ORDER BY updated_at DESC,id DESC LIMIT 1").get() as CatalogueFile | undefined;
}

export function addCatalogue(raw: { title: string; originalName: string; fileUrl: string; fileSize: number }) {
  const database = db();
  const timestamp = now();
  database.exec("BEGIN");
  try {
    database.prepare("UPDATE catalogues SET is_active=0,updated_at=? WHERE is_active=1").run(timestamp);
    const result = database.prepare("INSERT INTO catalogues (title,original_name,file_url,file_size,is_active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run(raw.title, raw.originalName, raw.fileUrl, raw.fileSize, 1, timestamp, timestamp);
    database.exec("COMMIT");
    return Number(result.lastInsertRowid);
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function removeCatalogue(id: number) {
  const database = db();
  const current = database.prepare("SELECT id,title,original_name,file_url,file_size,is_active,created_at,updated_at FROM catalogues WHERE id=?").get(id) as CatalogueFile | undefined;
  if (!current) return undefined;
  database.exec("BEGIN");
  try {
    database.prepare("DELETE FROM catalogues WHERE id=?").run(id);
    if (current.is_active) {
      const replacement = database.prepare("SELECT id FROM catalogues ORDER BY updated_at DESC,id DESC LIMIT 1").get() as { id?: number } | undefined;
      if (replacement?.id) database.prepare("UPDATE catalogues SET is_active=1,updated_at=? WHERE id=?").run(now(), replacement.id);
    }
    database.exec("COMMIT");
    return current;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
export function dashboardStats() {
  const database = db();
  const products = database.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  const inquiries = database.prepare("SELECT COUNT(*) AS count FROM inquiries WHERE status='New' AND deleted_at IS NULL").get() as { count: number };
  const loginLogs = database.prepare("SELECT l.id,l.username,l.status,l.logged_in_at,COALESCE(u.display_name,'Unknown administrator') AS display_name FROM admin_login_logs l LEFT JOIN admin_users u ON u.id=l.user_id ORDER BY l.logged_in_at DESC,l.id DESC LIMIT 10").all() as { id: number; username: string; status: string; logged_in_at: string; display_name: string }[];
  return {
    productCount: Number(products.count),
    newInquiryCount: Number(inquiries.count),
    loginLogs: loginLogs.map((log) => ({ id: Number(log.id), username: log.username, displayName: log.display_name, status: log.status, loggedInAt: log.logged_in_at })),
  };
}

export function recordAnalyticsPageView(raw: Record<string, unknown>) {
  const sessionId = String(raw.session_id || "").trim().slice(0, 120);
  const pagePath = String(raw.path || "").trim().slice(0, 500);
  if (!sessionId || !pagePath || pagePath.startsWith("/admin-eric")) return { recorded: false };
  const duration = Math.max(0, Math.min(7200, Math.round(Number(raw.duration_seconds) || 0)));
  const referrer = String(raw.referrer || "").trim().slice(0, 500);
  const searchTerm = String(raw.search_term || "").trim().slice(0, 200);
  db().prepare("INSERT INTO analytics_page_views (session_id,path,referrer,search_term,duration_seconds,viewed_at) VALUES (?,?,?,?,?,?)").run(sessionId, pagePath, referrer, searchTerm, duration, now());
  return { recorded: true };
}

export function analyticsSummary(days = 30) {
  const database = db();
  const rangeDays = Math.max(1, Math.min(365, Math.round(days)));
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();
  const totals = database.prepare("SELECT COUNT(*) AS page_views, COUNT(DISTINCT session_id) AS visitors, COALESCE(AVG(duration_seconds),0) AS average_duration, COUNT(DISTINCT NULLIF(search_term,'')) AS search_terms FROM analytics_page_views WHERE viewed_at>=?").get(since) as { page_views: number; visitors: number; average_duration: number; search_terms: number };
  const topPages = database.prepare("SELECT path, COUNT(*) AS page_views, COUNT(DISTINCT session_id) AS visitors, COALESCE(AVG(duration_seconds),0) AS average_duration FROM analytics_page_views WHERE viewed_at>=? GROUP BY path ORDER BY page_views DESC, average_duration DESC LIMIT 10").all(since) as { path: string; page_views: number; visitors: number; average_duration: number }[];
  const searchTerms = database.prepare("SELECT search_term, COUNT(*) AS visits, COUNT(DISTINCT session_id) AS visitors FROM analytics_page_views WHERE viewed_at>=? AND search_term<>'' GROUP BY search_term ORDER BY visits DESC, search_term ASC LIMIT 10").all(since) as { search_term: string; visits: number; visitors: number }[];
  return {
    days: rangeDays,
    pageViews: Number(totals.page_views || 0),
    visitors: Number(totals.visitors || 0),
    averageDuration: Math.round(Number(totals.average_duration || 0)),
    searchTerms: Number(totals.search_terms || 0),
    topPages: topPages.map((item) => ({ path: item.path, pageViews: Number(item.page_views), visitors: Number(item.visitors), averageDuration: Math.round(Number(item.average_duration || 0)) })),
    searchQueries: searchTerms.map((item) => ({ term: item.search_term, visits: Number(item.visits), visitors: Number(item.visitors) })),
  };
}

export function publicSettings() {
  return db().prepare("SELECT site_name,email,sales_emails,phone,address,response_time FROM site_settings ORDER BY id LIMIT 1").get() as { site_name: string; email: string; sales_emails: string; phone: string; address: string; response_time: string } | undefined;
}

export function createInquiry(raw: Record<string, unknown>) {
  const contactName = String(raw.contact_name || "").trim();
  const email = String(raw.email || "").trim();
  const company = String(raw.company || "").trim();
  const inquiryType = String(raw.inquiry_type || "").trim();
  const quantity = String(raw.quantity || "").trim();
  const market = String(raw.market || "").trim();
  const message = String(raw.message || "").trim();
  if (!contactName || !email || !company || !inquiryType || !quantity || !market || !message) throw new Error("Please complete every required inquiry field.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid email address.");
  const timestamp = now();
  const result = db().prepare("INSERT INTO inquiries (company,contact_name,email,phone,inquiry_type,quantity,market,message,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(company, contactName, email, String(raw.phone || "").trim(), inquiryType, quantity, market, message, "New", timestamp, timestamp);
  return { id: Number(result.lastInsertRowid) };
}

function makeSlug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function productEditorData() {
  const database = db();
  return {
    categories: database.prepare("SELECT id,name,slug FROM categories WHERE is_active=1 ORDER BY sort_order,id").all(),
    products: database.prepare("SELECT p.*,COALESCE(c.name,p.category) AS category_name FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.id DESC").all().map((product) => {
      const item = product as Record<string, unknown>;
      const colorImages = colorImageMap(database, Number(item.id));
      return {
        ...item,
        category: String(item.category_name || item.category || ""),
        images: database.prepare("SELECT id,image_url,alt_text,sort_order FROM product_images WHERE product_id=? ORDER BY sort_order,id").all(item.id),
        videos: database.prepare("SELECT id,video_url,title,sort_order FROM product_videos WHERE product_id=? ORDER BY sort_order,id").all(item.id),
        options: database.prepare("SELECT id,option_type,option_value,value_meta,sort_order FROM product_options WHERE product_id=? ORDER BY sort_order,id").all(item.id).map((option) => {
          const row = option as Record<string, unknown>;
          return { ...row, images: colorImages.get(String(row.option_value)) || [] };
        }),
        specifications: database.prepare("SELECT id,spec_group,label,value,sort_order FROM product_specifications WHERE product_id=? ORDER BY sort_order,id").all(item.id),
      };
    }),
  };
}
export function publishedProductBySlug(slug: string) {
  const database = db();
  const product = database.prepare("SELECT p.*,c.name AS category_name,c.slug AS category_slug FROM products p INNER JOIN categories c ON c.id=p.category_id AND c.is_active=1 WHERE p.slug=? AND p.status='Published'").get(slug) as Record<string, unknown> | undefined;
  if (!product) return null;
  const productId = product.id;
  const colorImages = colorImageMap(database, Number(productId));
  return {
    ...product,
    category: String(product.category_name || product.category || ""),
    images: database.prepare("SELECT image_url,alt_text,sort_order FROM product_images WHERE product_id=? ORDER BY sort_order,id").all(productId).map((item) => ({ ...(item as Record<string, unknown>) })),
    videos: database.prepare("SELECT video_url,title,sort_order FROM product_videos WHERE product_id=? ORDER BY sort_order,id").all(productId).map((item) => ({ ...(item as Record<string, unknown>) })),
    options: database.prepare("SELECT option_type,option_value,value_meta,sort_order FROM product_options WHERE product_id=? ORDER BY sort_order,id").all(productId).map((item) => {
      const option = item as Record<string, unknown>;
      return { ...option, images: colorImages.get(String(option.option_value)) || [] };
    }),
    specifications: database.prepare("SELECT spec_group,label,value,sort_order FROM product_specifications WHERE product_id=? ORDER BY sort_order,id").all(productId).map((item) => ({ ...(item as Record<string, unknown>) })),
  };
}
export function saveProduct(raw: Record<string, unknown>) {
  const database = db(); const timestamp = now(); const id = Number(raw.id || 0); const name = String(raw.name || "").trim(); const sku = String(raw.sku || "").trim();
  if (!name || !sku) throw new Error("Product name and SKU are required.");
  const existingSku = database.prepare("SELECT id FROM products WHERE lower(sku)=lower(?) AND id<>? LIMIT 1").get(sku, id) as { id?: number } | undefined;
  if (existingSku?.id) throw new Error("SKU must be unique. Choose a different SKU before saving.");
  const requestedSlug = makeSlug(name); let slug = requestedSlug || `product-${Date.now()}`;
  const existingSlug = database.prepare("SELECT id FROM products WHERE slug=? AND id<>?").get(slug, id) as { id?: number } | undefined;
  if (existingSlug?.id) slug = `${slug}-${Date.now().toString().slice(-5)}`;
  const categoryId = Number(raw.category_id || 0);
  const category = database.prepare("SELECT id,name FROM categories WHERE id=? AND is_active=1").get(categoryId) as { id: number; name: string } | undefined;
  if (!category) throw new Error("Select an existing active category.");
  const images = Array.isArray(raw.images) ? raw.images : [];
  const videos = Array.isArray(raw.videos) ? raw.videos : [];
  if (videos.length > 3) throw new Error("Each product can have up to 3 videos.");
  const firstUploadedImage = images.map((image) => String((image as Record<string, unknown>).image_url || "").trim()).find(Boolean) || "";
  const coverImage = String(raw.cover_image || "").trim() || firstUploadedImage;
  const values = [name, slug, sku, category.name, category.id, String(raw.short_description || ""), String(raw.description || ""), coverImage, String(raw.status || "Draft"), Number(raw.sort_order || 0), timestamp];
  database.exec("BEGIN");
  try {
    let productId = id;
    if (id) database.prepare("UPDATE products SET name=?,slug=?,sku=?,category=?,category_id=?,short_description=?,description=?,cover_image=?,status=?,sort_order=?,updated_at=? WHERE id=?").run(...values, id);
    else productId = Number(database.prepare("INSERT INTO products (name,slug,sku,category,category_id,short_description,description,cover_image,status,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(...values, timestamp).lastInsertRowid);
    database.prepare("DELETE FROM product_images WHERE product_id=?").run(productId);
    database.prepare("DELETE FROM product_videos WHERE product_id=?").run(productId);
    database.prepare("DELETE FROM product_options WHERE product_id=?").run(productId);
    database.prepare("DELETE FROM product_color_images WHERE product_id=?").run(productId);
    database.prepare("DELETE FROM product_specifications WHERE product_id=?").run(productId);
    images.forEach((image, index) => { const row = image as Record<string, unknown>; if (String(row.image_url || "").trim()) database.prepare("INSERT INTO product_images (product_id,image_url,alt_text,sort_order) VALUES (?,?,?,?)").run(productId, String(row.image_url), String(row.alt_text || name), index); });
    videos.forEach((video, index) => { const row = video as Record<string, unknown>; if (String(row.video_url || "").trim()) database.prepare("INSERT INTO product_videos (product_id,video_url,title,sort_order) VALUES (?,?,?,?)").run(productId, String(row.video_url), String(row.title || name), index); });
    const options = Array.isArray(raw.options) ? raw.options : [];
    options.forEach((option, index) => {
      const row = option as Record<string, unknown>; const optionValue = String(row.option_value || "").trim();
      if (!optionValue) return;
      const optionType = String(row.option_type || "Color");
      database.prepare("INSERT INTO product_options (product_id,option_type,option_value,value_meta,sort_order) VALUES (?,?,?,?,?)").run(productId, optionType, optionValue, String(row.value_meta || ""), index);
      if (optionType !== "Color") return;
      const assignedImages = Array.isArray(row.images) ? row.images : [];
      const seen = new Set<string>();
      assignedImages.forEach((image, imageIndex) => {
        const imageRow = image as Record<string, unknown>; const imageUrl = String(imageRow.image_url || "").trim();
        if (!imageUrl || seen.has(imageUrl)) return;
        seen.add(imageUrl);
        database.prepare("INSERT INTO product_color_images (product_id,color_value,image_url,alt_text,sort_order) VALUES (?,?,?,?,?)").run(productId, optionValue, imageUrl, String(imageRow.alt_text || name), imageIndex);
      });
    });
    const specifications = Array.isArray(raw.specifications) ? raw.specifications : [];
    specifications.forEach((specification, index) => { const row = specification as Record<string, unknown>; if (String(row.label || "").trim() && String(row.value || "").trim()) database.prepare("INSERT INTO product_specifications (product_id,spec_group,label,value,sort_order) VALUES (?,?,?,?,?)").run(productId, String(row.spec_group || "Specification"), String(row.label), String(row.value), index); });
    database.exec("COMMIT"); return { id: productId, slug };
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}

function colorImageMap(database: DatabaseSync, productId: number) {
  const rows = database.prepare("SELECT color_value,image_url,alt_text FROM product_color_images WHERE product_id=? ORDER BY color_value,sort_order,id").all(productId) as { color_value: string; image_url: string; alt_text: string }[];
  const grouped = new Map<string, { image_url: string; alt_text: string }[]>();
  rows.forEach((row) => {
    const images = grouped.get(row.color_value) || [];
    images.push({ image_url: row.image_url, alt_text: row.alt_text });
    grouped.set(row.color_value, images);
  });
  return grouped;
}
export function deleteProduct(id: number) {
  const database = db();
  database.prepare("DELETE FROM products WHERE id=?").run(id);
  const result = database.prepare("SELECT changes() AS count").get() as { count: number };
  return result.count;
}
export function login(username: string, password: string) { const user = db().prepare("SELECT * FROM admin_users WHERE username=? AND is_active=1").get(username) as { id: number; password_hash: string; display_name: string } | undefined; if (!user || !verifyPassword(password, user.password_hash)) return null; return user; }
export function recordAdminLogin(raw: { userId?: number; username: string; success: boolean }) {
  const username = raw.username.trim().slice(0, 100) || "Unknown";
  db().prepare("INSERT INTO admin_login_logs (user_id,username,status,logged_in_at) VALUES (?,?,?,?)").run(raw.userId ?? null, username, raw.success ? "Success" : "Failed", now());
}
export function changeAdminPassword(userId: number, currentPassword: string, newPassword: string) {
  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  const database = db();
  const user = database.prepare("SELECT password_hash FROM admin_users WHERE id=? AND is_active=1").get(userId) as { password_hash: string } | undefined;
  if (!user || !verifyPassword(currentPassword, user.password_hash)) throw new Error("Current password is incorrect.");
  database.prepare("UPDATE admin_users SET password_hash=?,updated_at=? WHERE id=?").run(hashPassword(newPassword), now(), userId);
}
export function createSession(userId: number) { const token = crypto.randomBytes(32).toString("hex"); const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(); db().prepare("INSERT INTO admin_sessions (user_id,token,expires_at,created_at) VALUES (?,?,?,?)").run(userId, token, expiresAt, now()); return { token, expiresAt }; }
export async function currentAdmin() { const token = (await cookies()).get("baby_bath_admin")?.value; if (!token) return null; return db().prepare("SELECT u.id,u.username,u.display_name,u.role FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>? AND u.is_active=1").get(token, now()) as { id:number; username:string; display_name:string; role:string } | undefined; }
