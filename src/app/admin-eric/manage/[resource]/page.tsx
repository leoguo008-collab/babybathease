import { redirect } from "next/navigation";
import { currentAdmin, resources } from "@/lib/database";
import AdminSidebar from "@/components/admin-sidebar";
import ManageResource from "./resource-client";
import ProductManager from "./product-manager";
import InquiryManager from "./inquiry-manager";
import CatalogueManager from "./catalogue-manager";
import styles from "../../admin.module.css";

export default async function ManagePage({ params }: PageProps<"/admin-eric/manage/[resource]">) {
  const { resource } = await params;
  if (!resources[resource]) redirect("/admin-eric/home");
  if (!(await currentAdmin())) redirect("/admin-eric");
  return <div className={styles.adminPage}><AdminSidebar />{resource === "products" ? <ProductManager /> : resource === "inquiries" ? <InquiryManager /> : resource === "catalogues" ? <CatalogueManager /> : <ManageResource resourceKey={resource} />}</div>;
}
