"use client";

import { loginAdmin, setAdminToken } from "@/services/apiClient";
import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginAdmin(email, password);
      setAdminToken(data.token);
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-teal-600 text-white">
          <LockKeyhole size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Admin login</h1>
          <p className="mt-1 text-sm text-slate-600">Owner and staff access only.</p>
        </div>
      </div>
      {error ? <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <label className="mt-6 block space-y-2 text-sm font-medium text-slate-700">
        <span>Email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="owner@example.com" required />
      </label>
      <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
        <span>Password</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="Password" required />
      </label>
      <button disabled={loading} className="mt-6 w-full rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
