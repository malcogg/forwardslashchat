import { notFound } from "next/navigation";

/** Legacy /admin URL removed — use secret path from DEPLOYMENT.md (ADMIN_PATH_TOKEN). */
export default function LegacyAdminPage() {
  notFound();
}
