import type { DatabaseSync } from "node:sqlite";
import snapshot from "../../config/catalogue-seed.json";

// A one-time copy of public catalogue content. Runtime reads and edits stay local.
export function seedCatalogue(database: DatabaseSync) {
  const timestamp = new Date().toISOString();
  const products = snapshot.products as unknown as Record<string, unknown>[];
  function insert(table: string, columns: string[], row: Record<string, unknown>) {
    database.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")})`)
      .run(...columns.map(column => row[column] ?? ""));
  }
  database.exec("BEGIN IMMEDIATE");
  try {
    snapshot.categories.forEach((category, index) => {
      const product = products.find(item => item.category_slug === category.slug);
      insert("categories", ["id", "name", "slug", "cover_image", "sort_order", "is_active", "created_at", "updated_at"], {
        ...category, id: product?.category_id ?? index + 1, sort_order: index + 1, is_active: 1, created_at: timestamp, updated_at: timestamp,
      });
    });
    products.forEach((product, index) => {
      insert("products", ["id", "name", "slug", "sku", "category", "category_id", "short_description", "description", "cover_image", "status", "sort_order", "created_at", "updated_at"], {
        ...product, category: product.category_name || product.category, status: "Published", sort_order: index + 1,
      });
      const children: [string, string, string[]][] = [
        ["images", "product_images", ["image_url", "alt_text", "sort_order"]],
        ["videos", "product_videos", ["video_url", "title", "sort_order"]],
        ["options", "product_options", ["option_type", "option_value", "value_meta", "sort_order"]],
        ["specifications", "product_specifications", ["spec_group", "label", "value", "sort_order"]],
      ];
      children.forEach(([key, table, columns]) => {
        const rows = product[key] as Record<string, unknown>[];
        rows.forEach((row, order) => insert(table, ["product_id", ...columns], { ...row, product_id: product.id, sort_order: row.sort_order ?? order }));
      });
      (product.options as Record<string, unknown>[]).filter(option => option.option_type === "Color").forEach(option => {
        (option.images as Record<string, unknown>[] || []).forEach((image, order) => {
          database.prepare("INSERT OR IGNORE INTO product_color_images (product_id,color_value,image_url,alt_text,sort_order) VALUES (?,?,?,?,?)")
            .run(product.id, option.option_value, image.image_url, image.alt_text ?? "", image.sort_order ?? order);
        });
      });
    });
    if (snapshot.catalogue) {
      insert("catalogues", ["title", "original_name", "file_url", "file_size", "is_active", "created_at", "updated_at"], { ...snapshot.catalogue, title: "Baby Bath Ease Product Catalogue" });
    }
    insert("site_settings", ["site_name", "email", "sales_emails", "phone", "address", "response_time", "updated_at"], {
      site_name: "Baby Bath Ease", email: "official@babybathease.com", sales_emails: "official@babybathease.com",
      phone: "+86 13802342316", address: "Room 12B1, T1 Building, Fangda City, Beihuan Avenue, Nanshan District, Shenzhen, China",
      response_time: "Within 2 business days", updated_at: timestamp,
    });
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
