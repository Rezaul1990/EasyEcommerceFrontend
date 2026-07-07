import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login | EasyEcommerce",
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <AdminLoginForm />
    </main>
  );
}
