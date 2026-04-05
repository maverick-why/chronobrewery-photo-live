"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "");
    const password = String(form.get("password") ?? "");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "登录失败，请检查账号密码。");
      return;
    }

    startTransition(() => {
      router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <h1 style={{ margin: 0 }}>摄影师登录</h1>
      <label className="stack">
        <span>用户名</span>
        <input className="input" name="username" required />
      </label>
      <label className="stack">
        <span>密码</span>
        <input className="input" type="password" name="password" required />
      </label>
      {error ? (
        <p style={{ margin: 0, color: "#af2934" }}>{error}</p>
      ) : (
        <p style={{ margin: 0 }} className="muted">
          首版使用单账号密码，具体凭证由环境变量管理。
        </p>
      )}
      <button className="btn btn-primary" disabled={isPending} type="submit">
        {isPending ? "登录中..." : "登录后台"}
      </button>
    </form>
  );
}
