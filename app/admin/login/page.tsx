import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const session = getSessionFromCookies();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="container">
      <LoginForm />
    </main>
  );
}
