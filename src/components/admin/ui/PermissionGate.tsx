"use client";

import { getCurrentAdmin } from "@/services/apiClient";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function PermissionGate({ permission, children, fallback = null }: { permission: string; children: ReactNode; fallback?: ReactNode }) {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    getCurrentAdmin()
      .then((user) => {
        if (ignore) return;
        setAllowed(Boolean(user.role?.slug === "owner" || user.role?.permissions.includes(permission)));
      })
      .catch(() => {
        if (!ignore) setAllowed(false);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [permission]);

  if (loading) return null;
  return allowed ? children : fallback;
}
