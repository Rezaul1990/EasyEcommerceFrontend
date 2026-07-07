import { LockKeyhole } from "lucide-react";

export const metadata = {
  title: "Admin Login | EasyEcommerce",
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <form className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-teal-600 text-white">
            <LockKeyhole size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Admin login</h1>
            <p className="mt-1 text-sm text-slate-600">Owner and staff access only.</p>
          </div>
        </div>
        <label className="mt-6 block space-y-2 text-sm font-medium text-slate-700">
          <span>Email</span>
          <input type="email" className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="owner@example.com" />
        </label>
        <label className="mt-4 block space-y-2 text-sm font-medium text-slate-700">
          <span>Password</span>
          <input type="password" className="h-11 w-full rounded-md border border-slate-300 px-3" placeholder="Password" />
        </label>
        <button className="mt-6 w-full rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white">Sign in</button>
      </form>
    </main>
  );
}
