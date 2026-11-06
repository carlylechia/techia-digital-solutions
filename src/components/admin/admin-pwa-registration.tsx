"use client";

import { useEffect } from "react";

export function AdminPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/admin/sw.js", { scope: "/admin" })
      .catch(() => {
        // Registration is progressive enhancement; failures should not break admin.
      });
  }, []);

  return null;
}
