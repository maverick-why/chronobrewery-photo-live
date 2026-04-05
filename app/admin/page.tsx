import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { UploadPanel } from "./UploadPanel";

export default function AdminPage() {
  const session = getSessionFromCookies();
  if (!session) {
    redirect("/admin/login");
  }
  const activitySlug = process.env.NEXT_PUBLIC_ACTIVITY_SLUG || "default";

  return (
    <main className="container stack">
      <UploadPanel activitySlug={activitySlug} username={session.username} />
    </main>
  );
}
