import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";

export default function AdminPage() {
  const session = getSessionFromCookies();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="container stack">
      <section className="card stack">
        <h1 style={{ margin: 0 }}>摄影师后台</h1>
        <p className="muted" style={{ margin: 0 }}>
          当前登录账号：{session.username}
        </p>
        <p className="muted" style={{ margin: 0 }}>
          M2 会在这里接入原图上传、进度展示和上传结果面板。
        </p>
      </section>
    </main>
  );
}
