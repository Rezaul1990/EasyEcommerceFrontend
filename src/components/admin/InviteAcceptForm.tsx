"use client";

import { acceptInvite, verifyInviteToken } from "@/services/apiClient";
import { CheckCircle2, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type InvitePreview = {
  email: string;
  name: string;
  role: { name: string; slug: string } | null;
  expiresAt: string;
};

export function InviteAcceptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadInvite() {
      if (!token) {
        setError("Invite token is missing");
        return;
      }

      try {
        const data = await verifyInviteToken(token);
        if (!ignore) setPreview(data);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Invite verification failed");
      }
    }

    loadInvite();
    return () => {
      ignore = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await acceptInvite(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/admin/login"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-md bg-teal-600 text-white">
          <KeyRound size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Set admin password</h1>
          <p className="mt-1 text-sm text-slate-600">Create your password to accept the invite.</p>
        </div>
      </div>
      {preview ? (
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">{preview.name}</p>
          <p>{preview.email}</p>
          <p>{preview.role?.name || "Assigned role"}</p>
        </div>
      ) : null}
      {error ? <p className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {success ? (
        <p className="mt-5 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          Password saved. Redirecting to login.
        </p>
      ) : null}
      <label className="mt-6 block space-y-2 text-sm font-medium text-slate-700">
        <span>Password</span>
        <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="At least 8 characters, mixed case, number" required />
      </label>
      <button disabled={loading || !preview || success} className="mt-6 w-full rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
        {loading ? "Saving..." : "Set password"}
      </button>
    </form>
  );
}
