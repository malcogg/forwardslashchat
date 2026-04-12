import { notFound } from "next/navigation";
import AdminClient from "./AdminClient";

type Props = { params: Promise<{ token: string }> };

/**
 * Secret-path admin UI. Set ADMIN_PATH_TOKEN in Vercel (long random string).
 * URL: /fs-ops/{ADMIN_PATH_TOKEN}
 * Still requires Clerk sign-in + ADMIN_EMAILS for /api/admin/*.
 */
export default async function SecretAdminPage({ params }: Props) {
  const { token } = await params;
  const expected = process.env.ADMIN_PATH_TOKEN?.trim();
  if (!expected || token !== expected) {
    notFound();
  }
  return <AdminClient />;
}
