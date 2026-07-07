import { InviteAcceptForm } from "@/components/admin/InviteAcceptForm";
import { Suspense } from "react";

export const metadata = {
  title: "Accept Invite | EasyEcommerce Admin",
};

export default function AcceptInvitePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <Suspense fallback={<div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Loading invite...</div>}>
        <InviteAcceptForm />
      </Suspense>
    </main>
  );
}
