"use client";

import { clearAdminToken, getAdminSidebar, getCurrentAdmin } from "@/services/apiClient";
import type { AdminUser, SidebarItem } from "@/types/ecommerce";
import { BarChart3, Boxes, ClipboardList, FilePenLine, LayoutDashboard, LockKeyhole, LogOut, Menu, PackageSearch, Settings, ShieldCheck, TicketPercent, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", module: "dashboard", icon: LayoutDashboard },
  { href: "/admin/catalog", label: "Products", module: "products", icon: Boxes },
  { href: "/admin/orders", label: "Orders", module: "orders", icon: ClipboardList },
  { href: "/admin/coupons", label: "Coupons", module: "coupons", icon: TicketPercent },
  { href: "/admin/content", label: "Content Editor", module: "content", icon: FilePenLine },
  { href: "/admin/inventory", label: "Inventory", module: "inventory", icon: PackageSearch },
  { href: "/admin/reports", label: "Reports", module: "reports", icon: BarChart3 },
  { href: "/admin/access", label: "Team & Permissions", module: "staff", icon: Users },
  { href: "/admin/settings", label: "Settings", module: "settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [sidebar, setSidebar] = useState<SidebarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadSession() {
      try {
        const [currentUser, menu] = await Promise.all([getCurrentAdmin(), getAdminSidebar()]);
        if (ignore) return;
        setUser(currentUser);
        setSidebar(menu);
      } catch {
        if (!ignore) setUnauthorized(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadSession();
    return () => {
      ignore = true;
    };
  }, []);

  function logout() {
    clearAdminToken();
    router.push("/admin/login");
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm font-medium text-slate-600">Loading admin...</div>;
  }

  if (unauthorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
          <ShieldCheck className="mx-auto text-teal-700" size={32} />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-600">Please sign in with an active admin account.</p>
          <Link href="/admin/login" className="mt-6 inline-flex rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white">
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  const allowedModules = new Set(sidebar.map((item) => item.module));
  const visibleNav = navItems.filter((item) => item.module === "dashboard" || allowedModules.has(item.module) || (item.module === "staff" && allowedModules.has("roles")));
  const nav = (
    <nav className="mt-6 space-y-1">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-teal-50 text-teal-700" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}>
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-4 lg:block">
        <Link href="/" className="flex h-12 items-center gap-2 text-base font-semibold text-slate-950">
          <LockKeyhole size={19} />
          EasyEcommerce Admin
        </Link>
        {nav}
        <div className="absolute inset-x-4 bottom-4 rounded-md border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <button onClick={logout} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-rose-600">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/30" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white p-4 shadow-xl">
            <div className="flex h-12 items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-base font-semibold text-slate-950">
                <LockKeyhole size={19} />
                EasyEcommerce
              </Link>
              <button className="grid size-9 place-items-center rounded-md border border-slate-200" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <button className="grid size-10 place-items-center rounded-md border border-slate-200 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
              <Menu size={19} />
            </button>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-950">Admin workspace</p>
              <p className="text-xs text-slate-500">Role: {user?.role?.name || "Assigned user"}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
                <p className="hidden text-xs text-slate-500 sm:block">{user?.email}</p>
              </div>
              <button onClick={logout} className="grid size-10 place-items-center rounded-md border border-slate-200 text-rose-600" aria-label="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
